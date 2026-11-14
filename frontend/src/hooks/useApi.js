import { useEffect, useState } from 'react'
import { api } from '../api'

/** GET `path` and refetch whenever `path` or any of `deps` change. Keeps stale data while reloading. */
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    if (!path) return
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    api
      .get(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ ...s, error, loading: false })))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps])
  return state
}
