/**
 * On-screen page title. Printed output uses `PrintHeader` instead, so this is
 * hidden on paper to avoid a duplicate heading.
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
