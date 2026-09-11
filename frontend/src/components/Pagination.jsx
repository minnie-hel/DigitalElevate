import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx'

export default function Pagination({ page, count, pageSize = 20, onChange }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize))
  if (totalPages <= 1) return null

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, count)

  return (
    <div
      className="no-print flex items-center justify-between border-t border-slate-200 px-4 py-3
        dark:border-slate-800"
    >
      <p className="text-sm text-muted">
        Showing <span className="font-medium text-slate-700 dark:text-slate-200">{first}</span>-
        <span className="font-medium text-slate-700 dark:text-slate-200">{last}</span> of{' '}
        <span className="font-medium text-slate-700 dark:text-slate-200">{count}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary px-2 py-1"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn-secondary px-2 py-1"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
