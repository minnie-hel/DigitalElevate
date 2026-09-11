import { useEffect, useState } from 'react'

import api, { unwrapList } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Loads a full list for use in a <select>. Dropdowns need every option, not
 * the first page, so this asks for a large page size.
 */
export default function useOptions(endpoint, { enabled = true, params = {} } = {}) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(enabled)

  const paramKey = JSON.stringify(params)

  useEffect(() => {
    if (!enabled || authLoading || !isAuthenticated) {
      setOptions([])
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    api
      .get(endpoint, { params: { page_size: 200, ...JSON.parse(paramKey) } })
      .then(({ data }) => {
        if (!cancelled) setOptions(unwrapList(data).results)
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [endpoint, enabled, paramKey, authLoading, isAuthenticated])

  return { options, loading }
}
