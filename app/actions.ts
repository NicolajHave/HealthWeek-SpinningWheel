'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { PHOTO_BUCKET, SPINS, TEAMS, supabaseAdmin } from '@/lib/supabase'
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, adminPinOk, isKiosk } from '@/lib/kiosk'
import { SEGMENTS, chooseSegmentIndex, labelForKey, repsForKey } from '@/lib/segments'
import { photoFilename } from '@/lib/photos'

/* ------------------------------------------------------------------ types */

export type TeamStatus = 'waiting' | 'spun' | 'done'

export interface BoardTeam {
  name: string
  status: TeamStatus
  segmentLabel?: string
  photoUrl?: string
}

export interface Board {
  teams: BoardTeam[]
  spunCount: number
  teamCount: number
  repsBanked: number
  powerUpCount: number
}

export type AuthResult =
  | { ok: true; teamId: string; teamName: string; alreadySpun: boolean }
  | { ok: false; reason: 'not_found' | 'not_kiosk' | 'error' }

export type SpinResult =
  | {
      ok: true
      segmentKey: string
      segmentIndex: number
      isReplay: boolean
      /** The team already pressed "We did it" (or drew the Power-Up). */
      alreadyCompleted: boolean
      /** A photo is already on the board for this team. */
      hasPhoto: boolean
    }
  | { ok: false; reason: 'not_kiosk' | 'error' }

export type SimpleResult = { ok: true } | { ok: false; reason: 'not_kiosk' | 'error' }

/**
 * Ceiling on how many Power-Ups the wheel will hand out in a day. Once it is
 * reached, a prize roll is re-rolled across the five exercises instead. Not
 * surfaced anywhere in the UI. Override with POWER_UP_LIMIT if the prize budget
 * changes.
 */
const POWER_UP_LIMIT = Number(process.env.POWER_UP_LIMIT ?? 3)

interface SpinRow {
  team_id: string
  segment_key: string
  completed_at: string | null
  photo_path: string | null
  photo_on_screen: boolean
}

/* ------------------------------------------------------------- board read */

export async function getBoard(): Promise<Board> {
  const db = supabaseAdmin()

  const [{ data: teams, error: teamsError }, { data: spins, error: spinsError }] = await Promise.all([
    db.from(TEAMS).select('id, name, sort_order').order('sort_order', { ascending: true }),
    db.from(SPINS).select('team_id, segment_key, completed_at, photo_path, photo_on_screen'),
  ])
  if (teamsError) throw teamsError
  if (spinsError) throw spinsError

  const spinByTeam = new Map<string, SpinRow>((spins ?? []).map((s) => [s.team_id as string, s as SpinRow]))

  // One signed-URL round trip for every photo that is on the board.
  const photoPaths = (spins ?? [])
    .filter((s) => s.photo_on_screen && s.photo_path)
    .map((s) => s.photo_path as string)
  const signedByPath = new Map<string, string>()
  if (photoPaths.length > 0) {
    const { data: signed } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(photoPaths, 60 * 60)
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) signedByPath.set(entry.path, entry.signedUrl)
    }
  }

  const boardTeams: BoardTeam[] = (teams ?? []).map((team) => {
    const spin = spinByTeam.get(team.id as string)
    if (!spin) return { name: team.name as string, status: 'waiting' }
    const photoUrl =
      spin.photo_on_screen && spin.photo_path ? signedByPath.get(spin.photo_path) : undefined
    return {
      name: team.name as string,
      status: spin.completed_at ? 'done' : 'spun',
      segmentLabel: labelForKey(spin.segment_key),
      ...(photoUrl ? { photoUrl } : {}),
    }
  })

  const repsBanked = (spins ?? [])
    .filter((s) => s.completed_at)
    .reduce((total, s) => total + repsForKey(s.segment_key as string), 0)

  return {
    teams: boardTeams,
    spunCount: spins?.length ?? 0,
    teamCount: teams?.length ?? 0,
    repsBanked,
    powerUpCount: (spins ?? []).filter((s) => s.segment_key === 'power_up').length,
  }
}

/** Board read that never throws — the poll uses this and keeps the last good state. */
export async function getBoardSafe(): Promise<Board | null> {
  try {
    return await getBoard()
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ spin */

export async function authenticateTeam(pin: string): Promise<AuthResult> {
  if (!(await isKiosk())) return { ok: false, reason: 'not_kiosk' }

  const trimmed = (pin ?? '').trim()
  if (!/^\d{4}$/.test(trimmed)) return { ok: false, reason: 'not_found' }

  try {
    const db = supabaseAdmin()
    // The PIN never travels back to the client — it is resolved to a team here.
    const { data: team, error } = await db
      .from(TEAMS)
      .select('id, name')
      .eq('pin', trimmed)
      .maybeSingle()
    if (error) throw error
    if (!team) return { ok: false, reason: 'not_found' }

    const { data: spin } = await db
      .from(SPINS)
      .select('team_id')
      .eq('team_id', team.id)
      .maybeSingle()

    return {
      ok: true,
      teamId: team.id as string,
      teamName: team.name as string,
      alreadySpun: Boolean(spin),
    }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/**
 * Decides the outcome server-side and writes it. Idempotent: calling this twice
 * for the same team always returns the same segment, so the result screen is
 * safe to reload and a double click cannot consume two spins.
 */
export async function spin(teamId: string): Promise<SpinResult> {
  if (!(await isKiosk())) return { ok: false, reason: 'not_kiosk' }

  try {
    const db = supabaseAdmin()

    const { count: powerUpsAwarded } = await db
      .from(SPINS)
      .select('team_id', { count: 'exact', head: true })
      .eq('segment_key', 'power_up')

    const segmentIndex = chooseSegmentIndex(crypto.randomInt, powerUpsAwarded ?? 0, POWER_UP_LIMIT)
    const segment = SEGMENTS[segmentIndex]

    // Insert-then-catch, not check-then-insert: this closes the double-click
    // race without a transaction. The unique constraint on spins.team_id is
    // what actually enforces one spin per team.
    const { data: inserted, error } = await db
      .from(SPINS)
      .insert({
        team_id: teamId,
        segment_key: segment.key,
        // Nothing to do for a Power-Up, so it counts as completed at reveal.
        completed_at: segment.type === 'prize' ? new Date().toISOString() : null,
      })
      .select('segment_key, completed_at, photo_path, photo_on_screen')
      .single()

    if (!error && inserted) {
      revalidatePath('/')
      return {
        ok: true,
        segmentKey: inserted.segment_key as string,
        segmentIndex,
        isReplay: false,
        alreadyCompleted: Boolean(inserted.completed_at),
        hasPhoto: Boolean(inserted.photo_path),
      }
    }

    if (error && error.code !== '23505') throw error

    // Unique violation: this team already has a spin. Return the existing row.
    const { data: existing, error: readError } = await db
      .from(SPINS)
      .select('segment_key, completed_at, photo_path, photo_on_screen')
      .eq('team_id', teamId)
      .single()
    if (readError) throw readError

    const existingIndex = SEGMENTS.findIndex((s) => s.key === existing.segment_key)
    return {
      ok: true,
      segmentKey: existing.segment_key as string,
      segmentIndex: existingIndex >= 0 ? existingIndex : 0,
      isReplay: true,
      alreadyCompleted: Boolean(existing.completed_at),
      hasPhoto: Boolean(existing.photo_path),
    }
  } catch {
    // Nothing was consumed — the insert is the source of truth.
    return { ok: false, reason: 'error' }
  }
}

/** Set when the team confirms they did the exercise. Drives the rep counter. */
export async function markCompleted(teamId: string): Promise<SimpleResult> {
  if (!(await isKiosk())) return { ok: false, reason: 'not_kiosk' }

  try {
    const db = supabaseAdmin()
    const { error } = await db
      .from(SPINS)
      .update({ completed_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .is('completed_at', null)
    if (error) throw error
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/**
 * Only called when the team chose to keep the photo. The file arrives as
 * FormData so the browser streams it instead of base64-inflating it.
 */
export async function savePhoto(formData: FormData): Promise<SimpleResult> {
  if (!(await isKiosk())) return { ok: false, reason: 'not_kiosk' }

  try {
    const teamId = String(formData.get('teamId') ?? '')
    const file = formData.get('photo')
    const showOnScreen = formData.get('showOnScreen') !== 'false'
    if (!teamId || !(file instanceof File) || file.size === 0) return { ok: false, reason: 'error' }

    const db = supabaseAdmin()
    const path = `${teamId}.jpg`
    const { error: uploadError } = await db.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: 'image/jpeg', upsert: true })
    if (uploadError) throw uploadError

    const { error } = await db
      .from(SPINS)
      .update({ photo_path: path, photo_on_screen: showOnScreen })
      .eq('team_id', teamId)
    if (error) throw error

    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/* ----------------------------------------------------------------- admin */

export interface AdminTeam {
  id: string
  name: string
  status: TeamStatus
  segmentLabel?: string
  hasPhoto: boolean
  /** Signed preview URL, present only when the team shared a photo. */
  photoUrl?: string
  /** File name the download route will serve it under. */
  photoFilename?: string
}

export type AdminResult =
  | { ok: true; teams: AdminTeam[] }
  | { ok: false; reason: 'bad_pin' | 'error' }

/** Admin views are exempt from the kiosk cookie — the organiser fixes things from their phone. */
export async function adminListTeams(adminPin: string): Promise<AdminResult> {
  if (!adminPinOk(adminPin)) return { ok: false, reason: 'bad_pin' }

  // Remember the sign-in, so the photo download route can authorise the
  // organiser without the PIN travelling in a URL.
  const jar = await cookies()
  jar.set(ADMIN_COOKIE, adminPin, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })

  try {
    const db = supabaseAdmin()
    const [{ data: teams, error: teamsError }, { data: spins, error: spinsError }] = await Promise.all([
      db.from(TEAMS).select('id, name, sort_order').order('sort_order', { ascending: true }),
      db.from(SPINS).select('team_id, segment_key, completed_at, photo_path'),
    ])
    if (teamsError) throw teamsError
    if (spinsError) throw spinsError

    const byTeam = new Map((spins ?? []).map((s) => [s.team_id as string, s]))

    const photoPaths = (spins ?? []).filter((s) => s.photo_path).map((s) => s.photo_path as string)
    const signedByPath = new Map<string, string>()
    if (photoPaths.length > 0) {
      const { data: signed } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(photoPaths, 60 * 60)
      for (const entry of signed ?? []) {
        if (entry.path && entry.signedUrl) signedByPath.set(entry.path, entry.signedUrl)
      }
    }

    return {
      ok: true,
      teams: (teams ?? []).map((team) => {
        const spin = byTeam.get(team.id as string)
        const photoUrl = spin?.photo_path ? signedByPath.get(spin.photo_path as string) : undefined
        return {
          id: team.id as string,
          name: team.name as string,
          status: !spin ? 'waiting' : spin.completed_at ? 'done' : 'spun',
          ...(spin ? { segmentLabel: labelForKey(spin.segment_key as string) } : {}),
          hasPhoto: Boolean(spin?.photo_path),
          ...(photoUrl ? { photoUrl } : {}),
          ...(spin?.photo_path ? { photoFilename: photoFilename(team.name as string) } : {}),
        }
      }),
    }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/** Someone will spin for the wrong team within the first twenty minutes. */
export async function resetTeam(adminPin: string, teamId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!adminPinOk(adminPin)) return { ok: false, reason: 'bad_pin' }

  try {
    const db = supabaseAdmin()
    const { data: spin } = await db
      .from(SPINS)
      .select('photo_path')
      .eq('team_id', teamId)
      .maybeSingle()

    if (spin?.photo_path) {
      await db.storage.from(PHOTO_BUCKET).remove([spin.photo_path as string])
    }

    const { error } = await db.from(SPINS).delete().eq('team_id', teamId)
    if (error) throw error

    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
