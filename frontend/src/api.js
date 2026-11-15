// API client. Two modes, same routes and response shapes:
//   mock   (default) — in-browser stand-in (src/mock), data saved in localStorage
//   remote           — the FastAPI backend; set VITE_API_MODE=remote (Vite proxies /api → :8000)
export const API_MODE = import.meta.env.VITE_API_MODE === 'remote' ? 'remote' : 'mock'

const mock = API_MODE === 'mock' ? import('./mock/server') : null

async function remote(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const detail = data?.detail
    const err = new Error(typeof detail === 'string' ? detail : detail ? 'Some fields are invalid.' : `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

async function request(method, path, body) {
  if (!mock) return remote(method, path, body)
  const { handle } = await mock
  // clone so callers never mutate the mock's stored objects
  return structuredClone(await handle(method, path, body))
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
}
