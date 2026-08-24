/**
 * The framing furniture from the brand guidelines: the sub-brand lockup and the
 * registration marks that sit in the corners of their layout sheets.
 */

/** A corner cross, as on the guideline artboards. */
function Cross({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ width: 'clamp(14px, 1.1vw, 22px)' }}>
      <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function RegistrationMarks() {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ color: 'var(--color-rule)' }} aria-hidden="true">
      <Cross className="absolute left-[clamp(0.5rem,0.9vw,1.1rem)] top-[clamp(0.5rem,0.9vw,1.1rem)]" />
      <Cross className="absolute right-[clamp(0.5rem,0.9vw,1.1rem)] top-[clamp(0.5rem,0.9vw,1.1rem)]" />
      <Cross className="absolute bottom-[clamp(0.5rem,0.9vw,1.1rem)] left-[clamp(0.5rem,0.9vw,1.1rem)]" />
      <Cross className="absolute bottom-[clamp(0.5rem,0.9vw,1.1rem)] right-[clamp(0.5rem,0.9vw,1.1rem)]" />
    </div>
  )
}

/**
 * `Selected Health Week`, set as a section of the main brand — the same
 * construction as Selected Destinations, Selected Archive and the rest.
 *
 * TODO: swap for the supplied wordmark SVG once it is in /public. Set in the
 * display face at the same weight, it follows the Sections rule as it stands.
 */
export function Lockup({ invert = false }: { invert?: boolean }) {
  return (
    <span
      className="display"
      style={{
        fontSize: 'var(--step-title)',
        fontWeight: 400,
        letterSpacing: '-0.03em',
        color: invert ? 'var(--color-paper)' : 'var(--color-ink)',
        display: 'inline-block',
        // Clear space is H/4 on all sides. It is left to the layout rather than
        // padded in here: every screen sets the wordmark against page padding
        // far larger than a quarter of its height, and padding it as well only
        // indented it out of alignment with the column it heads.
      }}
    >
      Selected Health Week
    </span>
  )
}
