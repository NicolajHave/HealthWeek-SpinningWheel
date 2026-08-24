'use client'

import type { Board as BoardData } from '@/app/actions'
import RepCounter from './RepCounter'
import Wheel from './Wheel'
import { Lockup, RegistrationMarks } from './Marks'

/** More than this and the strip stops fitting in the column. */
const MAX_PHOTOS = 6

/** A numbered section heading, as the guideline sheets set them. */
function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="label rule pt-[0.55em]" style={{ color: 'var(--color-mute)' }}>
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

      {/*
        Two columns, the way the guideline sheets set an annotation column
        against the thing itself. It also buys the wheel the whole height of the
        screen: stacked, everything above and below it was eating the space it
        needed to be seen from the far side of the room.
      */}
      <div
        className="grid h-full w-full gap-[clamp(1.5rem,3vw,4rem)] p-[clamp(1.5rem,2.6vw,3.5rem)]"
        style={{ gridTemplateColumns: 'clamp(17rem, 29vw, 32rem) minmax(0, 1fr)' }}
      >
        <div className="flex min-h-0 flex-col gap-[clamp(0.9rem,2vh,2rem)]">
          <header>
            <Lockup />
            <p className="label mt-[0.2em]" style={{ color: 'var(--color-mute)' }}>
              One spin per team
            </p>
          </header>

          {/* Two collective numbers. Nothing that singles anyone out. */}
          <Section n="1" title="Reps banked today">
            <div className="display" style={{ fontSize: 'var(--step-counter)', fontWeight: 400 }}>
              <RepCounter value={board.repsBanked} />
            </div>
          </Section>

          <Section n="2" title="Teams that have spun">
            <p className="display" style={{ fontSize: 'var(--step-counter)', fontWeight: 400 }}>
              <span className="mono">{board.spunCount}</span>
              <span style={{ color: 'var(--color-mute)' }}>/{board.teamCount}</span>
            </p>
          </Section>

          <div className="flex min-h-0 flex-1 items-center">
            {canSpin ? (
              <p className="display pulse" style={{ fontSize: 'clamp(2.5rem, 4.2vw, 4.5rem)', fontWeight: 400 }}>
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

          {/* Photos without names. The prize stays real and the consent copy
              stays true — "your photo goes on the board" — without turning the
              wall into a register of who has been up. */}
          <section>
            <p className="label rule pt-[0.55em]" style={{ color: 'var(--color-mute)' }}>
              3. Best team photo wins a {photoPrize}
            </p>
            {photos.length > 0 ? (
              <ul
                className="mt-[0.6em] grid gap-[clamp(0.3rem,0.45vw,0.55rem)]"
                style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
              >
                {photos.map((url) => (
                  <li key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="fade-in w-full object-cover"
                      style={{ aspectRatio: '4 / 3', border: '2px solid var(--color-ink)' }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="label mt-[0.5em]" style={{ color: 'var(--color-mute)' }}>
                Take one after your spin
              </p>
            )}
          </section>
        </div>

        <div className="flex min-h-0 items-center justify-center">
          <Wheel targetIndex={null} size="min(86vh, 56vw)" idleRotation={180} />
        </div>
      </div>
    </div>
  )
}
