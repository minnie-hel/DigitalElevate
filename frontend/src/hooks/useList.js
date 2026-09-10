import { useCallback, useEffect, useMemo, useState } from 'react'

import api, { apiErrorMessage, unwrapList } from '../services/api.js'

/**
 * Fetches a paginated DRF list endpoint with search and filter support.
 *
 * Filters are compared by value, not identity, so callers can pass an inline
 * object without causing a request on every render.
 */
export default function useList(endpoint, { filters = {}, pageSize = 20 } = {}) {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [currentPageSize, setPageSize] = useState(pageSize)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const filterKey = JSON.stringify(filters)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, page_size: currentPageSize, ...JSON.parse(filterKey) }
      if (search) params.search = search

      // Drop empty values so the API is not sent `status=`.
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      const { data } = await api.get(endpoint, { params })
      const list = unwrapList(data)
      setRows(list.results)
      setCount(list.count)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not load this list.'))
      setRows([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, currentPageSize, search, filterKey, reloadToken])

  useEffect(() => {
    load()
  }, [load])

  // Any change of filter, search term or page size invalidates the page number.
  useEffect(() => {
    setPage(1)
  }, [filterKey, search, currentPageSize])

  const refresh = useCallback(() => setReloadToken((token) => token + 1), [])

  return useMemo(
    () => ({
      rows,
      count,
      page,
      setPage,
      search,
      setSearch,
      loading,
      error,
      refresh,
      pageSize: currentPageSize,
      setPageSize,
    }),
    [rows, count, page, search, loading, error, refresh, currentPageSize],
  )
}
