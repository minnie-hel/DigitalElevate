import { AlertIcon, CheckIcon } from './Icons.jsx'

const TONES = {
  error:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
}

export default function Alert({ tone = 'error', children, className = '' }) {
  if (!children) return null
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${TONES[tone]} ${className}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="mt-0.5 shrink-0">
        {tone === 'success' ? <CheckIcon className="h-4 w-4" /> : <AlertIcon className="h-4 w-4" />}
      </span>
      <span>{children}</span>
    </div>
  )
}
