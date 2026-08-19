import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client. RLS denies everything to the anon role, so every read
 * and write in this app goes through here — from a server action, never the
 * client bundle.
 *
 * Created lazily so a missing env var surfaces as a caught runtime error on the
 * action that needed it, rather than crashing the build or the whole render.
 */
let cached: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

/**
 * This Supabase project is shared with other apps that already own a `teams`
 * table, so everything here is namespaced.
 */
export const TEAMS = 'hw_teams'
export const SPINS = 'hw_spins'
export const PHOTO_BUCKET = 'hw-team-photos'
