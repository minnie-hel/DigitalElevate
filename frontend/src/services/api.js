import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const TOKEN_KEY = 'elevate.access'
export const REFRESH_KEY = 'elevate.refresh'
export const API_SCOPE_KEY = 'elevate.apiScope'
/** Set after a successful login or when the API reports users already exist. */
export const HAS_USERS_KEY = 'elevate.hasUsers'

/** Drop tokens saved for a different API base (e.g. production vs local dev). */
export function syncApiScope() {
  const previous = localStorage.getItem(API_SCOPE_KEY)
  if (previous && previous !== BASE_URL) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }
  localStorage.setItem(API_SCOPE_KEY, BASE_URL)
}

syncApiScope()

export const tokenStore = {
  get access() {
    return localStorage.getItem(TOKEN_KEY)
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  save({ access, refresh }) {
    if (access) localStorage.setItem(TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(API_SCOPE_KEY, BASE_URL)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

let bootstrapDone = false
let bootstrapResolve = null
const bootstrapPromise = new Promise((resolve) => {
  bootstrapResolve = resolve
})

export function markAuthBootstrapComplete() {
  bootstrapDone = true
  bootstrapResolve?.()
}

export function waitForAuthBootstrap() {
  return bootstrapDone ? Promise.resolve() : bootstrapPromise
}

function isPublicAuthPath(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/setup') ||
    url.includes('/auth/refresh')
  )
}

/** Session restore uses /auth/me/; must not wait on bootstrap (that would deadlock). */
function skipsAuthBootstrapWait(url = '') {
  return isPublicAuthPath(url) || url.includes('/auth/me')
}

function forceSignOut() {
  tokenStore.clear()
  window.dispatchEvent(new Event('elevate:signed-out'))
}

function parseJwtPayload(token) {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

/** True when access token is missing or past expiry (with a small clock skew). */
export function isAccessTokenExpired(skewSeconds = 60) {
  const token = tokenStore.access
  if (!token) return true
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000
}

let sessionRestorePromise = null

/**
 * One shared restore per page load: refresh if needed, then GET /auth/me/.
 * Returns user JSON or null (invalid/expired session — tokens cleared).
 */
export async function restoreSessionFromTokens() {
  if (sessionRestorePromise) return sessionRestorePromise

  sessionRestorePromise = (async () => {
    try {
      syncApiScope()
      if (!tokenStore.access && !tokenStore.refresh) {
        return null
      }
      if ((!tokenStore.access || isAccessTokenExpired()) && tokenStore.refresh) {
        await refreshAccessToken()
      }
      if (!tokenStore.access) {
        return null
      }
      const { data } = await api.get('/auth/me/')
      return data
    } catch {
      tokenStore.clear()
      return null
    } finally {
      markAuthBootstrapComplete()
    }
  })()

  try {
    return await sessionRestorePromise
  } finally {
    sessionRestorePromise = null
  }
}

function isSessionProbePath(url = '') {
  return url.includes('/auth/me')
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  if (!skipsAuthBootstrapWait(config.url)) {
    await waitForAuthBootstrap()
  }

  const token = tokenStore.access
  if (token && !isPublicAuthPath(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A single refresh attempt is shared between all requests that get a 401 at
// the same time, so a page with several parallel calls does not fire several
// refreshes and invalidate its own new token.
let refreshPromise = null

export function refreshAccessToken() {
  if (!tokenStore.refresh) {
    return Promise.reject(new Error('No refresh token'))
  }
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh/`, { refresh: tokenStore.refresh })
      .then(({ data }) => {
        if (!data?.access) {
          throw new Error('Refresh response missing access token')
        }
        tokenStore.save({
          access: data.access,
          refresh: data.refresh ?? tokenStore.refresh,
        })
        return data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (!config || !response) return Promise.reject(error)

    const url = config.url || ''
    const hadAuth = Boolean(config.headers?.Authorization)
    const isPublic = isPublicAuthPath(url)

    const canRetry =
      response.status === 401 &&
      !config._retried &&
      tokenStore.refresh &&
      !isPublic

    if (canRetry) {
      config._retried = true
      try {
        const access = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${access}`
        return api(config)
      } catch {
        if (!isSessionProbePath(url)) {
          forceSignOut()
        }
        return Promise.reject(error)
      }
    }

    if (
      response.status === 401 &&
      hadAuth &&
      !isPublic &&
      !isSessionProbePath(url)
    ) {
      forceSignOut()
    }

    return Promise.reject(error)
  },
)

/** Turns a DRF error body into a single readable sentence. */
export function apiErrorMessage(error, fallback = 'Something went wrong.') {
  const data = error?.response?.data
  if (!data) return error?.message || fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  const parts = []
  Object.entries(data).forEach(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    parts.push(field === 'non_field_errors' ? text : `${field}: ${text}`)
  })
  return parts.length ? parts.join(' ') : fallback
}

/** DRF returns either a paginated envelope or a bare array. */
export function unwrapList(data) {
  if (Array.isArray(data)) return { results: data, count: data.length }
  return { results: data?.results ?? [], count: data?.count ?? 0 }
}

export default api
