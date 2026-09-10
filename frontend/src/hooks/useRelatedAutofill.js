import { useEffect, useRef } from 'react'

import { findOptionById } from '../utils/options.js'

/**
 * When a dropdown selection points at a saved record, copy its fields into
 * the form. Re-runs if options load after the id was already chosen.
 */
export function useRelatedAutofill({ skip = false, sourceId, options, apply }) {
  const appliedKey = useRef('')

  useEffect(() => {
    if (skip || sourceId === '' || sourceId === null || sourceId === undefined) {
      if (!sourceId) appliedKey.current = ''
      return
    }

    const picked = findOptionById(options, sourceId)
    if (!picked) return

    const key = `${sourceId}:${options.length}`
    if (appliedKey.current === key) return

    apply(picked)
    appliedKey.current = key
  }, [skip, sourceId, options, apply])
}

export default useRelatedAutofill
