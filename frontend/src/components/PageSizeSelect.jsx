const SIZES = [20, 50, 100, 200]

export default function PageSizeSelect({ value, onChange }) {
  const active = SIZES.includes(value) ? value : SIZES[0]

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="whitespace-nowrap">Show items</span>
      <div
        className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5"
        role="group"
        aria-label="Items per page"
      >
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={[
              'min-w-[2.25rem] rounded-md px-2 py-1 text-sm tabular-nums transition',
              active === size
                ? 'bg-brand-600 font-medium text-white'
                : 'text-slate-600 hover:bg-slate-50',
            ].join(' ')}
            aria-pressed={active === size}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
