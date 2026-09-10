import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-semibold text-slate-300">404</p>
      <h1 className="mt-4 text-lg font-semibold text-slate-800">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">
        That page does not exist in the Elevate Digital system.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  )
}
