/** Append the total count to the active status tab label, e.g. All (42). */
export function tabsWithCount(tabs, activeValue, count) {
  return tabs.map((tab) => {
    const active = (activeValue || '') === (tab.value || '')
    return {
      ...tab,
      label: active ? `${tab.label} (${count})` : tab.label,
    }
  })
}

/** Export the current table page as a CSV download. */
export function exportRowsCsv(filename, columns, rows) {
  const headers = columns.map((col) => col.header).filter(Boolean)
  const keys = columns.map((col) => col.key).filter((key) => key && key !== 'actions')

  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      keys
        .map((key) => {
          const col = columns.find((c) => c.key === key)
          if (col?.exportValue) return escape(col.exportValue(row))
          const raw = col?.render ? col.render(row) : row[key]
          if (typeof raw === 'object' && raw !== null) return escape('')
          return escape(raw ?? '')
        })
        .join(','),
    ),
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
