export default function StatCard({ label, value, hint, tone = 'default', icon }) {
  const tones = {
    default: 'text-slate-900',
    positive: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  }

  // Deliberately compact: the dashboard shows eight of these at once and the
  // whole set needs to fit above the fold.
  return (
    <div className="card px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
