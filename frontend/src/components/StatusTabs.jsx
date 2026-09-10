/**
 * Status tab strip for list screens. Tabs drive the same query parameter a
 * dropdown would, so `''` means "all".
 */
export default function StatusTabs({ options, value, onChange, className = '' }) {
  return (
    <div
      className={`flex flex-wrap gap-0 overflow-hidden border-b border-slate-200 px-2 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const active = (value || '') === (option.value || '')
        return (
          <button
            key={option.value || 'all'}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={[
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition',
              active
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
