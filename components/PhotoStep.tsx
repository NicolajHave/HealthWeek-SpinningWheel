'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { savePhoto } from '@/app/actions'

type Stage = 'offer' | 'preview' | 'countdown' | 'review' | 'saving'

export interface PhotoStepProps {
  teamId: string
  photoPrize: string
  onDone: () => void
}

/**
 * Opt-in, never automatic, and always skippable with an equally prominent
 * button. Nothing leaves the browser until the team presses "Use this one".
 */
export default function PhotoStep({ teamId, photoPrize, onDone }: PhotoStepProps) {
  const [stage, setStage] = useState<Stage>('offer')
  const [count, setCount] = useState(3)
  const [shot, setShot] = useState<Blob | null>(null)
  const [shotUrl, setShotUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  useEffect(() => {
    return () => {
      if (shotUrl) URL.revokeObjectURL(shotUrl)
    }
  }, [shotUrl])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      setStage('preview')
      // The <video> only exists once the preview stage has rendered.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      // Permission denied or no camera — skip the photo step silently.
      onDone()
    }
  }, [onDone])

  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video) return onDone()

    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return onDone()
    // The preview is CSS-mirrored so it behaves like a mirror while people line
    // up. The frames themselves are not, so the saved photo is drawn as-is —
    // which is how the rest of the room saw them.
    ctx.drawImage(video, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return onDone()
        stopCamera()
        setShot(blob)
        setShotUrl(URL.createObjectURL(blob))
        setStage('review')
      },
      'image/jpeg',
      0.85,
    )
  }, [onDone, stopCamera])

  // 3 - 2 - 1 - snap.
  useEffect(() => {
    if (stage !== 'countdown') return
    if (count <= 0) {
      capture()
      return
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [stage, count, capture])

  const discard = () => {
    if (shotUrl) URL.revokeObjectURL(shotUrl)
    setShot(null)
    setShotUrl(null)
  }

  const upload = async () => {
    if (!shot) return onDone()
    setStage('saving')
    const formData = new FormData()
    formData.set('teamId', teamId)
    formData.set('photo', new File([shot], 'team.jpg', { type: 'image/jpeg' }))
    // There is no keep-but-hide option: a photo that is not on the board
    // cannot be judged and has no reason to exist.
    formData.set('showOnScreen', 'true')
    try {
      await savePhoto(formData)
    } catch {
      // The photo is a nice-to-have; never strand the team on an error screen.
    }
    onDone()
  }

  if (stage === 'offer') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(1rem,3vh,2.5rem)] p-[clamp(1.5rem,4vw,5rem)] text-center">
        <h1 className="display" style={{ fontSize: 'var(--step-headline)' }}>
          Take a team photo?
        </h1>
        <p style={{ fontSize: 'var(--step-title)', color: 'var(--color-amber)' }}>
          Best one today wins a {photoPrize}.
        </p>
        <div className="flex flex-wrap justify-center gap-[clamp(1rem,2vw,2rem)]">
          <button type="button" className="btn btn-primary" onClick={() => void startCamera()}>
            Take a photo
          </button>
          <button type="button" className="btn" onClick={onDone}>
            No thanks
          </button>
        </div>
        <p style={{ fontSize: 'var(--step-small)', opacity: 0.75, maxWidth: '38ch' }}>
          Your photo goes on the board and into the prize. Nothing is saved unless you choose to keep it.
        </p>
      </div>
    )
  }

  if (stage === 'saving') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="display" style={{ fontSize: 'var(--step-title)' }}>
          Saving…
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(0.75rem,2vh,1.75rem)] p-[clamp(1rem,2.5vw,3rem)]">
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{ height: 'min(62vh, 62vw)', aspectRatio: '4 / 3', background: 'var(--color-lane)', border: '4px solid var(--color-chalk)' }}
      >
        {stage === 'review' && shotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shotUrl} alt="Your team photo" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        {stage === 'countdown' ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(13,27,42,0.35)' }}>
            <span className="display" style={{ fontSize: 'var(--step-counter)' }}>
              {count > 0 ? count : '📸'}
            </span>
          </div>
        ) : null}
      </div>

      {stage === 'preview' ? (
        <div className="flex flex-wrap justify-center gap-[clamp(0.75rem,1.5vw,1.5rem)]">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setCount(3)
              setStage('countdown')
            }}
          >
            Start 3 · 2 · 1
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              stopCamera()
              onDone()
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {stage === 'review' ? (
        <div className="flex flex-wrap justify-center gap-[clamp(0.75rem,1.5vw,1.5rem)]">
          <button type="button" className="btn btn-mint" onClick={() => void upload()}>
            Use this one
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              discard()
              void startCamera()
            }}
          >
            Retake
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              discard()
              onDone()
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}
