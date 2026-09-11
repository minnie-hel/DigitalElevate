import Spinner from './Spinner.jsx'

/**
 * Generic table.
 *
 * `columns` entries look like:
 *   { key, header, render?, className?, align?, hideOnPrint? }
 *
 * `hideOnPrint` is for columns that make no sense on paper, such as row
 * action buttons.
 */
export default function DataTable({
  columns,
  rows,
  loading = false,
  emptyMessage = 'Nothing to show yet.',
  onRowClick,
  rowKey = (row) => row.id,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading..." />
      </div>
    )
  }

  if (!rows?.length) {
    return <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
  }

  return (
    <div className="table-wrap">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-800/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`th ${column.align === 'right' ? 'text-right' : ''} ${
                  column.hideOnPrint ? 'no-print' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={
                onRowClick
                  ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`td ${column.align === 'right' ? 'text-right' : ''} ${
                    column.hideOnPrint ? 'no-print' : ''
                  } ${column.className || ''}`}
                >
                  {column.render ? column.render(row) : (row[column.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
