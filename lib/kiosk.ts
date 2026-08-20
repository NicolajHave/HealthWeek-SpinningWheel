import 'server-only'
import crypto from 'node:crypto'
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

export const ADMIN_COOKIE = 'hw_admin'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8 // one working day

export function adminPinOk(pin: string): boolean {
  const expected = process.env.ADMIN_PIN
  if (!expected) return false
  const given = Buffer.from(pin ?? '')
  const want = Buffer.from(expected)
  return given.length === want.length && crypto.timingSafeEqual(given, want)
}

/**
 * Set when the organiser signs in to /admin, so the photo download route can
 * check them without the PIN travelling in a URL. Deliberately independent of
 * the kiosk cookie — admin works from their own phone.
 */
export async function isAdmin(): Promise<boolean> {
  const expected = process.env.ADMIN_PIN
  if (!expected) return false
  const jar = await cookies()
  const value = jar.get(ADMIN_COOKIE)?.value
  return typeof value === 'string' && adminPinOk(value)
}
