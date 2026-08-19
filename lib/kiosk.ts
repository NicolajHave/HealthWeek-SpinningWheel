import 'server-only'
import { cookies } from 'next/headers'

export const KIOSK_COOKIE = 'hw_kiosk'
export const KIOSK_COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

/**
 * The screen is unattended and the deployment URL is public, so spinning is
 * restricted to the physical kiosk. Without the cookie the app renders the
 * board read-only.
 */
export async function isKiosk(): Promise<boolean> {
  const secret = process.env.KIOSK_SECRET
  if (!secret) return false
  const jar = await cookies()
  return jar.get(KIOSK_COOKIE)?.value === secret
}
