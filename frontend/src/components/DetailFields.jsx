/**
 * Read-only label/value grid for entity detail screens.
 */
export default function DetailFields({ items, className = '' }) {
  return (
    <dl className={`grid gap-4 sm:grid-cols-2 ${className}`.trim()}>
      {items.map(({ label, value, fullWidth }) => (
        <div key={label} className={fullWidth ? 'sm:col-span-2' : undefined}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </dt>
          <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
