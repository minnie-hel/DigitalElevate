import { useEffect } from 'react'

import { CloseIcon } from './Icons.jsx'

/** Slide-in panel from the right for list filter controls. */
export default function FilterDrawer({ open, onClose, title = 'Filters', children }) {
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

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl
          dark:bg-slate-900 dark:shadow-black/40 transition-transform duration-200 ease-out ${
            open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
          }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400
              dark:hover:bg-slate-800"
            aria-label="Close filters"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4 [&_select]:w-full">{children}</div>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <button type="button" className="btn-primary w-full py-2" onClick={onClose}>
            Done
          </button>
        </div>
      </aside>
    </>
  )
}
