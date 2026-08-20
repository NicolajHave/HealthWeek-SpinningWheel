'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  authenticateTeam,
  getBoardSafe,
  markCompleted,
  spin as spinAction,
  type Board as BoardData,
} from '@/app/actions'
import { SEGMENTS, type Segment } from '@/lib/segments'
import Board from './Board'
import ErrorBoundary from './ErrorBoundary'
import IdleBar from './IdleBar'
import PhotoStep from './PhotoStep'
import PinPad from './PinPad'
import Result from './Result'
import Wheel from './Wheel'
import { useFullscreenOnFirstInteraction, useIdleTimeout, useWakeLock } from './runtime'

type Stage = 'board' | 'pin' | 'ready' | 'spinning' | 'result' | 'photo' | 'error'

const POLL_MS = 5000
const IDLE_MS = 30_000
/** RESULT and PHOTO get longer: teams need time to actually do the exercise. */
const IDLE_LONG_MS = 90_000

interface SpinState {
  segment: Segment
  segmentIndex: number
  isReplay: boolean
  alreadyCompleted: boolean
  hasPhoto: boolean
}

export interface KioskProps {
  initialBoard: BoardData
  canSpin: boolean
  powerUpLocation: string
  powerUpPrize: string
  photoPrize: string
  kioskLocation: string
}

export default function Kiosk({
  initialBoard,
  canSpin,
  powerUpLocation,
  powerUpPrize,
  photoPrize,
  kioskLocation,
}: KioskProps) {
  const [board, setBoard] = useState<BoardData>(initialBoard)
  const [stage, setStage] = useState<Stage>('board')
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null)
  const [result, setResult] = useState<SpinState | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [jitter, setJitter] = useState(0)
  const [boundaryKey, setBoundaryKey] = useState(0)

  useWakeLock()
  useFullscreenOnFirstInteraction(canSpin)

  /* ------------------------------------------------------------ polling */

  const refresh = useCallback(async () => {
    const next = await getBoardSafe()
    // A failed poll keeps the last good board rather than blanking the screen.
    if (next) setBoard(next)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => void refresh(), POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  /* -------------------------------------------------------- transitions */

  const toBoard = useCallback(() => {
    setStage('board')
    setTeam(null)
    setResult(null)
    setPinError(null)
    setBusy(false)
    void refresh()
  }, [refresh])

  // Any state that is not the board returns to the board on its own. Without
  // this, an abandoned PIN entry would block the next team for an hour.
  const idleEnabled = stage !== 'board' && stage !== 'spinning'
  const idleMs = stage === 'result' || stage === 'photo' ? IDLE_LONG_MS : IDLE_MS
  const remaining = useIdleTimeout(idleEnabled, idleMs, toBoard)

  const submitPin = useCallback(async (pin: string) => {
    setBusy(true)
    setPinError(null)
    const auth = await authenticateTeam(pin)

    if (!auth.ok) {
      setBusy(false)
      setPinError(
        auth.reason === 'not_found'
          ? "That PIN isn't on the list. Check the card your team was given."
          : 'Something went wrong. Try again in a moment.',
      )
      return
    }

    setTeam({ id: auth.teamId, name: auth.teamName })

    if (!auth.alreadySpun) {
      setBusy(false)
      setStage('ready')
      return
    }

    // Already spun: spin() is idempotent, so this just reads the row back.
    const replay = await spinAction(auth.teamId)
    setBusy(false)
    if (!replay.ok) return setStage('error')
    setResult({
      segment: SEGMENTS[replay.segmentIndex],
      segmentIndex: replay.segmentIndex,
      isReplay: true,
      alreadyCompleted: replay.alreadyCompleted,
      hasPhoto: replay.hasPhoto,
    })
    setStage('result')
  }, [])

  const startSpin = useCallback(async () => {
    if (!team || busy) return
    setBusy(true)
    const outcome = await spinAction(team.id)
    setBusy(false)

    if (!outcome.ok) {
      // The insert is the source of truth. If it failed, nothing was consumed.
      setStage('error')
      return
    }

    setJitter(Math.round(Math.random() * 44) - 22)
    setResult({
      segment: SEGMENTS[outcome.segmentIndex],
      segmentIndex: outcome.segmentIndex,
      isReplay: outcome.isReplay,
      alreadyCompleted: outcome.alreadyCompleted,
      hasPhoto: outcome.hasPhoto,
    })
    setStage('spinning')
  }, [team, busy])

  const afterResult = useCallback(() => {
    if (result && !result.hasPhoto) setStage('photo')
    else toBoard()
  }, [result, toBoard])

  const confirmDone = useCallback(async () => {
    if (!team) return toBoard()
    setBusy(true)
    await markCompleted(team.id)
    setBusy(false)
    void refresh()
    afterResult()
  }, [team, toBoard, refresh, afterResult])

  /* ------------------------------------------------------------- render */

  const wake = () => {
    if (canSpin && stage === 'board') setStage('pin')
  }

  let screen: React.ReactNode
  switch (stage) {
    case 'pin':
      screen = <PinPad onSubmit={(pin) => void submitPin(pin)} error={pinError} busy={busy} onCancel={toBoard} />
      break

    case 'ready':
      screen = (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(1.5rem,4vh,3rem)] p-[clamp(1.5rem,4vw,5rem)] text-center">
          <p className="label" style={{ color: 'var(--color-mute)' }}>
            One spin. Make it count.
          </p>
          <h1 className="display" style={{ fontSize: 'var(--step-headline)', fontWeight: 400, maxWidth: '16ch' }}>
            {team?.name}
          </h1>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: 'var(--step-title)', padding: '0.5em 2rem' }}
            onClick={() => void startSpin()}
            disabled={busy}
            autoFocus
          >
            {busy ? 'Spinning…' : 'Spin'}
          </button>
        </div>
      )
      break

    case 'spinning':
      screen = (
        <div className="flex h-full w-full items-center justify-center">
          <Wheel
            key={result?.segmentIndex ?? 'wheel'}
            targetIndex={result?.segmentIndex ?? null}
            jitter={jitter}
            onSettled={() => setStage('result')}
          />
        </div>
      )
      break

    case 'result':
      screen = result ? (
        <Result
          segment={result.segment}
          isReplay={result.isReplay}
          alreadyCompleted={result.alreadyCompleted}
          busy={busy}
          powerUpLocation={powerUpLocation}
          powerUpPrize={powerUpPrize}
          photoPrize={photoPrize}
          onConfirm={() => void confirmDone()}
          onDismiss={result.alreadyCompleted ? afterResult : toBoard}
        />
      ) : null
      break

    case 'photo':
      screen = team ? (
        <PhotoStep teamId={team.id} photoPrize={photoPrize} onDone={toBoard} />
      ) : null
      break

    case 'error':
      screen = (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(1rem,3vh,2rem)] p-8 text-center">
          <h1 className="display" style={{ fontSize: 'var(--step-title)', fontWeight: 400, maxWidth: '22ch' }}>
            Something went wrong. Try again in a moment.
          </h1>
          <div className="flex flex-wrap justify-center gap-[clamp(0.75rem,1.5vw,1.5rem)]">
            <button type="button" className="btn btn-primary" onClick={() => void startSpin()} disabled={!team || busy}>
              Try again
            </button>
            <button type="button" className="btn" onClick={toBoard}>
              Back to the board
            </button>
          </div>
        </div>
      )
      break

    default:
      screen = (
        <Board board={board} canSpin={canSpin} kioskLocation={kioskLocation} photoPrize={photoPrize} />
      )
  }

  return (
    <div
      className="relative h-dvh w-screen overflow-hidden"
      onClick={stage === 'board' ? wake : undefined}
      onKeyDown={
        stage === 'board'
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') wake()
            }
          : undefined
      }
      role={stage === 'board' && canSpin ? 'button' : undefined}
      tabIndex={stage === 'board' && canSpin ? 0 : undefined}
      aria-label={stage === 'board' && canSpin ? 'Tap to spin' : undefined}
    >
      <ErrorBoundary key={boundaryKey} onReset={() => {
        setBoundaryKey((k) => k + 1)
        toBoard()
      }}>
        {screen}
      </ErrorBoundary>
      {idleEnabled ? <IdleBar remaining={remaining} /> : null}
    </div>
  )
}
