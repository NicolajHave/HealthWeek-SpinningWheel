import { redirect } from 'next/navigation'
import Kiosk from '@/components/Kiosk'
import { getBoard, type Board as BoardData } from './actions'
import { isKiosk } from '@/lib/kiosk'
import { eventConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

const EMPTY_BOARD: BoardData = {
  teams: [],
  spunCount: 0,
  teamCount: 0,
  repsBanked: 0,
  powerUpCount: 0,
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const kioskParam = params.kiosk

  // /?kiosk=<KIOSK_SECRET> hands off to the route handler, which is the only
  // place allowed to set the httpOnly cookie, then comes straight back to /.
  if (typeof kioskParam === 'string' && kioskParam.length > 0) {
    redirect(`/kiosk?secret=${encodeURIComponent(kioskParam)}`)
  }

  const canSpin = await isKiosk()
  // Set by the unlock route when the link did not match.
  const unlockFailed = params.locked === '1' && !canSpin

  // A first render that cannot reach Supabase still shows the frame; the 5s
  // poll fills it in rather than the whole screen erroring in front of the room.
  let board = EMPTY_BOARD
  try {
    board = await getBoard()
  } catch {
    board = EMPTY_BOARD
  }

  return (
    <Kiosk
      initialBoard={board}
      canSpin={canSpin}
      unlockFailed={unlockFailed}
      powerUpLocation={eventConfig.powerUpLocation}
      powerUpPrize={eventConfig.powerUpPrize}
      photoPrize={eventConfig.photoPrize}
      kioskLocation={eventConfig.kioskLocation}
    />
  )
}
