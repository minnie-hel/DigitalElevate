import Logo from './Logo.jsx'

/**
 * Letterhead that only appears on printed output, so a printed list still
 * says who produced it, what it is, and when it was taken.
 */
export default function PrintHeader({ title, subtitle }) {
  return (
    <div className="print-only mb-4 border-b-2 border-slate-800 pb-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="mark" className="h-11 w-11 shrink-0" />
          <div>
            <p className="text-base font-bold">Elevate Digital</p>
            <p className="text-xs">Client Management System</p>
          </div>
        </div>
        <p className="text-xs">
          Printed {new Date().toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' })}
        </p>
      </div>
      <div className="mt-2">
        <p className="text-sm font-semibold uppercase tracking-wide">{title}</p>
        {subtitle ? <p className="text-xs text-slate-600">{subtitle}</p> : null}
      </div>
    </div>
  )
}
