import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import api, {
  apiErrorMessage,
  HAS_USERS_KEY,
  restoreSessionFromTokens,
  tokenStore,
} from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const signOutLocally = useCallback(() => {
    // Only this browser's JWT is cleared. Company data in the database is unchanged.
    tokenStore.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    restoreSessionFromTokens().then((profile) => {
      if (cancelled) return
      if (profile) {
        setUser(profile)
        localStorage.setItem(HAS_USERS_KEY, '1')
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    window.addEventListener('elevate:signed-out', signOutLocally)
    return () => window.removeEventListener('elevate:signed-out', signOutLocally)
  }, [signOutLocally])

  const login = useCallback(async (email, password) => {
    try {
      tokenStore.clear()
      const { data } = await api.post('/auth/login/', {
        email: email.trim().toLowerCase(),
        password,
      })
      tokenStore.save({ access: data.access, refresh: data.refresh })
      localStorage.setItem(HAS_USERS_KEY, '1')
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
