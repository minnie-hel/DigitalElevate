import { useState } from 'react'

/**
 * Company logo.
 *
 * The artwork is a single square image: the ED monogram stacked above the
 * ELEVATE DIGITAL wordmark, on a white background. That drives the decisions
 * here:
 *
 *  - It always needs a white surface behind it, otherwise it disappears into
 *    a dark one such as the sidebar.
 *  - It carries a lot of empty margin, and the stacked shape does not fit a
 *    64px toolbar. Every variant therefore crops a region out of the square
 *    rather than scaling the whole thing down, so each one reads at its
 *    intended size. The regions are measured off the source artwork and are
 *    deliberately a little looser than the ink, to avoid clipping glyphs.
 *
 * Callers set one dimension; the other follows from the region's aspect
 * ratio. If `/logo.png` is missing, a coded wordmark is shown instead of a
 * broken-image icon.
 */

const REGIONS = {
  full: { x: [0.06, 0.94], y: [0.11, 0.83] },
  mark: { x: [0.25, 0.82], y: [0.11, 0.55] },
  wordmark: { x: [0.06, 0.94], y: [0.53, 0.84] },
}

function geometry(region) {
  const width = region.x[1] - region.x[0]
  const height = region.y[1] - region.y[0]
  const aspect = width / height
  const scaleX = 1 / width
  const scaleY = scaleX * aspect
  const centre = (axis) => (region[axis][0] + region[axis][1]) / 2
  const offset = (scale, c) => `${(0.5 + scale / 2 - c * scale) * 100}%`

  return {
    aspect,
    width: `${scaleX * 100}%`,
    left: offset(scaleX, centre('x')),
    top: offset(scaleY, centre('y')),
  }
}

const GEOMETRY = {
  full: geometry(REGIONS.full),
  mark: geometry(REGIONS.mark),
  wordmark: geometry(REGIONS.wordmark),
}

const ALT = {
  full: 'Elevate Digital — Elevating brands. Driving growth.',
  mark: 'Elevate Digital',
  wordmark: 'Elevate Digital',
}

function Fallback({ variant, className }) {
  if (variant === 'mark') {
    return (
      <span
        className={`flex items-center justify-center rounded-md bg-brand-600 text-xs font-bold
          tracking-tight text-white ${className}`}
      >
        ED
      </span>
    )
  }

  return (
    <span
      className={`flex flex-col justify-center rounded-md bg-white px-2 py-1.5 ring-1
        ring-slate-200/90 ${className}`}
    >
      <span className="whitespace-nowrap text-base font-bold leading-none tracking-tight text-slate-900">
        ELEVATE <span className="text-brand-600">DIGITAL</span>
      </span>
      <span className="mt-1 whitespace-nowrap text-[8px] uppercase tracking-[0.12em] text-slate-500">
        Elevating brands. Driving growth.
      </span>
    </span>
  )
}

export default function Logo({ variant = 'full', className = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed) return <Fallback variant={variant} className={className} />

  const { aspect, width, left, top } = GEOMETRY[variant]

  return (
    <span
      className={`relative block overflow-hidden rounded-md bg-white p-1 ring-1
        ring-slate-200/90 ${className}`.trim()}
      style={{ aspectRatio: aspect }}
    >
      <span className="relative block h-full w-full overflow-hidden rounded-[3px] bg-white">
        <img
          src="/logo.png"
          alt={ALT[variant]}
          onError={() => setFailed(true)}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ width, left, top }}
        />
      </span>
    </span>
  )
}
