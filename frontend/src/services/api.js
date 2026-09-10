import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const TOKEN_KEY = 'elevate.access'
export const REFRESH_KEY = 'elevate.refresh'

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
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.access
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A single refresh attempt is shared between all requests that get a 401 at
// the same time, so a page with several parallel calls does not fire several
// refreshes and invalidate its own new token.
let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh/`, { refresh: tokenStore.refresh })
      .then(({ data }) => {
        tokenStore.save({ access: data.access, refresh: data.refresh })
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

    const canRetry =
      response?.status === 401 &&
      !config?._retried &&
      tokenStore.refresh &&
      !config?.url?.includes('/auth/login') &&
      !config?.url?.includes('/auth/refresh')

    if (canRetry) {
      config._retried = true
      try {
        const access = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${access}`
        return api(config)
      } catch {
        tokenStore.clear()
        window.dispatchEvent(new Event('elevate:signed-out'))
      }
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
