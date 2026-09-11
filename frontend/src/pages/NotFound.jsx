import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-semibold text-slate-300 dark:text-slate-600">404</p>
      <h1 className="section-title-lg mt-4">Page not found</h1>
      <p className="mt-1 text-body text-muted">
        That page does not exist in the Elevate Digital system.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  )
}
