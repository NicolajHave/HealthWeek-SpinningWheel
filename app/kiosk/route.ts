import { NextResponse, type NextRequest } from 'next/server'
import { KIOSK_COOKIE, KIOSK_COOKIE_MAX_AGE } from '@/lib/kiosk'

/**
 * Visited once on the kiosk browser the morning of the event, via
 * /?kiosk=<KIOSK_SECRET>. Sets an httpOnly cookie and redirects to a clean URL
 * so the secret is not left sitting in the address bar.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const expected = process.env.KIOSK_SECRET
  const response = NextResponse.redirect(new URL('/', request.nextUrl.origin))

  if (expected && secret === expected) {
    response.cookies.set(KIOSK_COOKIE, expected, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: KIOSK_COOKIE_MAX_AGE,
    })
  }

  return response
}
