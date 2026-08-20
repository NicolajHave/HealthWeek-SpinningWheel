import { type NextRequest } from 'next/server'
import { unlock } from '@/lib/kiosk-unlock'

export const dynamic = 'force-dynamic'

/** `/kiosk?secret=…`, and where `/?kiosk=…` is forwarded to. */
export async function GET(request: NextRequest) {
  return unlock(request, request.nextUrl.searchParams.get('secret'))
}
