import { useState } from 'react'

/**
 * Company logo — cropped regions from `/logo.png` (no frame/card around the artwork).
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
        className={`flex items-center justify-center rounded-lg bg-brand-600 text-xs font-bold
          tracking-tight text-white ${className}`}
      >
        ED
      </span>
    )
  }

  return (
    <span className={`flex flex-col justify-center ${className}`}>
      <span className="whitespace-nowrap text-base font-bold leading-none tracking-tight text-slate-900 dark:text-white">
        ELEVATE <span className="text-brand-600 dark:text-brand-400">DIGITAL</span>
      </span>
      <span className="mt-1 whitespace-nowrap text-[8px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
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
      className={`relative block overflow-hidden ${className}`.trim()}
      style={{ aspectRatio: aspect }}
    >
      <img
        src="/logo.png"
        alt={ALT[variant]}
        onError={() => setFailed(true)}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ width, left, top }}
      />
    </span>
  )
}
