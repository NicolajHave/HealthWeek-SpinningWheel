'use client'

import type { Board as BoardData } from '@/app/actions'
import RepCounter from './RepCounter'
import Wheel from './Wheel'
import { Lockup, RegistrationMarks } from './Marks'

/** More than this and the strip stops fitting across the screen. */
const MAX_PHOTOS = 8

/** A numbered section heading, as the guideline sheets set them. */
function Section({ n, title, children, align = 'left' }: {
  n: string
  title: string
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <section style={{ textAlign: align }}>
      <p className="label rule pt-[0.6em]" style={{ color: 'var(--color-mute)' }}>
        {n}. {title}
      </p>
      {children}
    </section>
  )
}

export interface BoardProps {
  board: BoardData
  canSpin: boolean
  unlockFailed?: boolean
  kioskLocation: string
  photoPrize: string
}

export default function Board({ board, canSpin, unlockFailed = false, kioskLocation, photoPrize }: BoardProps) {
  const photos = board.photoUrls.slice(0, MAX_PHOTOS)

  return (
    <div className="relative h-full w-full">
      <RegistrationMarks />

      <div className="flex h-full w-full flex-col gap-[clamp(0.75rem,1.4vh,1.6rem)] p-[clamp(1.5rem,2.6vw,3.5rem)]">
        <header className="flex items-baseline justify-between gap-6">
          <Lockup />
          <p className="label" style={{ color: 'var(--color-mute)' }}>
            One spin per team
          </p>
        </header>

        {/* Two collective numbers, framing the wheel. Nothing that singles
            anyone out. */}
        <div className="grid gap-[clamp(1rem,2.5vw,3rem)]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Section n="1" title="Reps banked today">
            <div className="display" style={{ fontSize: 'var(--step-counter)', fontWeight: 400 }}>
              <RepCounter value={board.repsBanked} />
            </div>
          </Section>

          <Section n="2" title="Teams that have spun" align="right">
            <p className="display" style={{ fontSize: 'var(--step-counter)', fontWeight: 400 }}>
              <span className="mono">{board.spunCount}</span>
              <span style={{ color: 'var(--color-mute)' }}>/{board.teamCount}</span>
            </p>
          </Section>
        </div>

        {/* The wheel is the idle state: the thing you came to use, in the room,
            at rest. It says what this screen is for without a word of copy. */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)]">
          <Wheel targetIndex={null} size="min(43vh, 43vw)" idleRotation={180} />

          {canSpin ? (
            <p className="display pulse" style={{ fontSize: 'var(--step-title)', fontWeight: 400 }}>
              Tap to spin
            </p>
          ) : unlockFailed ? (
            <p
              className="label"
              style={{ background: 'var(--color-ink)', color: 'var(--color-paper)', padding: '0.5em 1em' }}
              role="status"
            >
              That link did not unlock this screen — check it and open it again
            </p>
          ) : (
            <p className="label" style={{ color: 'var(--color-mute)' }}>
              Spin at the screen in {kioskLocation}
            </p>
          )}
        </div>

        <footer className="rule flex flex-wrap items-center justify-between gap-[clamp(0.75rem,1.5vw,2rem)] pt-[0.7em]">
          {/* Photos without names. The prize stays real and the consent copy
              stays true — "your photo goes on the board" — without turning the
              wall into a register of who has been up. */}
          {photos.length > 0 ? (
            <ul className="flex items-center gap-[clamp(0.35rem,0.6vw,0.7rem)]">
              {photos.map((url) => (
                <li key={url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="fade-in object-cover"
                    style={{
                      height: 'clamp(3.5rem, 8vh, 6.5rem)',
                      aspectRatio: '4 / 3',
                      border: '2px solid var(--color-ink)',
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <span />
          )}

          <p className="label">Best team photo wins a {photoPrize} — take one after your spin</p>
        </footer>
      </div>
    </div>
  )
}
