export default function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-500">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <span>{label}</span>}
    </div>
  )
}
