// ══════════════════════════════════════════
// hooks/useApi.js — Data fetching helper
// ══════════════════════════════════════════
import { useState, useEffect } from 'react'

export default function useApi(apiFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    apiFn()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, deps)

  return { data, loading, error }
}