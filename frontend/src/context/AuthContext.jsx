import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import api, { apiErrorMessage, tokenStore } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const signOutLocally = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Restore the session on first load so a refresh does not sign the user out.
  useEffect(() => {
    let cancelled = false

    async function restore() {
      if (!tokenStore.access) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/auth/me/')
        if (!cancelled) setUser(data)
      } catch {
        if (!cancelled) signOutLocally()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [signOutLocally])

  // The API layer raises this when a refresh token has expired.
  useEffect(() => {
    window.addEventListener('elevate:signed-out', signOutLocally)
    return () => window.removeEventListener('elevate:signed-out', signOutLocally)
  }, [signOutLocally])

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login/', { email, password })
      tokenStore.save({ access: data.access, refresh: data.refresh })
      setUser(data.user)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: apiErrorMessage(error, 'Unable to sign in. Check your details.'),
      }
    }
  }, [])

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh
    try {
      if (refresh) await api.post('/auth/logout/', { refresh })
    } catch {
      // Signing out locally matters more than the token being blacklisted.
    } finally {
      signOutLocally()
    }
  }, [signOutLocally])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
      canEdit: ['admin', 'manager'].includes(user?.role) || Boolean(user?.is_superuser),
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.')
  }
  return context
}
