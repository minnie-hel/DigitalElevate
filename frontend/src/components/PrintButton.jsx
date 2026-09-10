import { PrinterIcon } from './Icons.jsx'

/**
 * Prints the current screen. The `@media print` rules in index.css strip the
 * navigation and filter chrome, leaving the table or report on the page.
 */
export default function PrintButton({ label = 'Print', className = '' }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`btn-secondary no-print ${className}`}
    >
      <PrinterIcon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}
