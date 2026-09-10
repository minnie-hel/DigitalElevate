/** Find a list option by id (string-safe). */
export function findOptionById(options, id) {
  if (id === '' || id === null || id === undefined) return null
  return options.find((row) => String(row.id) === String(id)) || null
}
