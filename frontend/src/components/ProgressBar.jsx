export default function ProgressBar({ value = 0, showLabel = true, className = '' }) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))

  // Colour hints at health: nearly done reads green, barely started reads amber.
  const tone =
    percent >= 100
      ? 'bg-emerald-500'
      : percent >= 60
        ? 'bg-brand-500'
        : percent >= 30
          ? 'bg-amber-500'
          : 'bg-slate-400'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
          {percent}%
        </span>
      )}
    </div>
  )
}
