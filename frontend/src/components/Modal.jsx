import { useEffect } from 'react'

import { CloseIcon } from './Icons.jsx'

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

export default function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative my-8 w-full ${WIDTHS[size]} rounded-xl border border-transparent
          bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/50`}
      >
        <div
          className="flex items-center justify-between border-b border-slate-200 px-6 py-4
            dark:border-slate-700"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600
              dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-6 py-5 text-slate-700 dark:text-slate-300">{children}</div>
        {footer && (
          <div
            className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
