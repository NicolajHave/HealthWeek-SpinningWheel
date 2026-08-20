import { type NextRequest } from 'next/server'
import { unlock } from '@/lib/kiosk-unlock'

export const dynamic = 'force-dynamic'

/**
 * `/kiosk/<secret>` — the form to hand to someone else. No query string to be
 * stripped by a mail client or lost to a stray second slash, and short enough
 * to read down the phone.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params
  return unlock(request, decodeURIComponent(secret))
}
