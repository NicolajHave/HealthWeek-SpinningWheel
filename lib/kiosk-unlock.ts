import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { KIOSK_COOKIE, KIOSK_COOKIE_MAX_AGE, kioskSecretMatches } from './kiosk'

/**
 * Sets the kiosk cookie and returns to a clean URL, so the secret is not left
 * sitting in the address bar of a screen the whole room can see.
 *
 * A failed unlock comes back as `/?locked=1` rather than failing silently.
 * Staying quiet bought nothing — the board already shows whether it is unlocked,
 * so anyone could tell either way — and it made a mistyped link impossible to
 * tell apart from a broken screen.
 */
export function unlock(request: NextRequest, secret: string | null): NextResponse {
  const ok = kioskSecretMatches(secret)
  const target = new URL(ok ? '/' : '/?locked=1', request.nextUrl.origin)
  const response = NextResponse.redirect(target)

  if (ok) {
    response.cookies.set(KIOSK_COOKIE, process.env.KIOSK_SECRET as string, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: KIOSK_COOKIE_MAX_AGE,
    })
  }

  return response
}
