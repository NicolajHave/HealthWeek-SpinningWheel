import { NextResponse, type NextRequest } from 'next/server'
import { isAdmin } from '@/lib/kiosk'
import { PHOTO_BUCKET, SPINS, TEAMS, supabaseAdmin } from '@/lib/supabase'
import { zipStream } from '@/lib/zip'
import { PHOTO_ZIP_FILENAME, photoFilename } from '@/lib/photos'

export const dynamic = 'force-dynamic'
// A full set is fetched from storage and framed one photo at a time; the
// default serverless ceiling is too tight for that. Capped by the Vercel plan.
export const maxDuration = 60

interface PhotoRow {
  team_id: string
  photo_path: string
  created_at: string
  name: string
}

async function listPhotos(): Promise<PhotoRow[]> {
  const db = supabaseAdmin()

  const [{ data: spins, error: spinsError }, { data: teams, error: teamsError }] = await Promise.all([
    db.from(SPINS).select('team_id, photo_path, created_at').not('photo_path', 'is', null),
    db.from(TEAMS).select('id, name, sort_order').order('sort_order', { ascending: true }),
  ])
  if (spinsError) throw spinsError
  if (teamsError) throw teamsError

  const nameById = new Map((teams ?? []).map((t) => [t.id as string, t.name as string]))
  const order = new Map((teams ?? []).map((t, i) => [t.id as string, i]))

  return (spins ?? [])
    .filter((s) => s.photo_path && nameById.has(s.team_id as string))
    .map((s) => ({
      team_id: s.team_id as string,
      photo_path: s.photo_path as string,
      created_at: s.created_at as string,
      name: nameById.get(s.team_id as string) as string,
    }))
    .sort((a, b) => (order.get(a.team_id) ?? 0) - (order.get(b.team_id) ?? 0))
}

/** Pull one object out of the private bucket as raw bytes. */
async function readPhoto(path: string): Promise<Uint8Array | null> {
  const { data, error } = await supabaseAdmin().storage.from(PHOTO_BUCKET).download(path)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}

/**
 * Serves the team photos for the intranet write-up.
 *
 * `?team=<id>` returns one photo; no parameter returns the lot as a ZIP. Both
 * are same-origin with a Content-Disposition, so the browser saves them under a
 * readable name instead of navigating to a signed Supabase URL.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not signed in to admin.' }, { status: 401 })
  }

  let photos: PhotoRow[]
  try {
    photos = await listPhotos()
  } catch {
    return NextResponse.json({ error: 'Could not reach the database.' }, { status: 502 })
  }

  const teamId = request.nextUrl.searchParams.get('team')

  if (teamId) {
    const photo = photos.find((p) => p.team_id === teamId)
    if (!photo) return NextResponse.json({ error: 'No photo for that team.' }, { status: 404 })

    const bytes = await readPhoto(photo.photo_path)
    if (!bytes) return NextResponse.json({ error: 'Photo could not be read.' }, { status: 502 })

    return new NextResponse(bytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(bytes.length),
        'Content-Disposition': `attachment; filename="${photoFilename(photo.name)}"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  if (photos.length === 0) {
    return NextResponse.json({ error: 'No photos have been shared yet.' }, { status: 404 })
  }

  // Streamed, so a full set is never held in memory or capped by a buffered
  // response limit.
  const stream = zipStream(
    photos.map((photo) => ({
      name: photoFilename(photo.name),
      read: () => readPhoto(photo.photo_path),
      modified: new Date(photo.created_at),
    })),
  )

  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${PHOTO_ZIP_FILENAME}"`,
      'Cache-Control': 'no-store',
    },
  })
}
