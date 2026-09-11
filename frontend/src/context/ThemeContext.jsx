import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'elevate.theme'

const ThemeContext = createContext(null)

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(mode) {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  return systemPrefersDark() ? 'dark' : 'light'
}

function applyTheme(resolved) {
  const root = document.documentElement
  const isDark = resolved === 'dark'
  root.classList.toggle('dark', isDark)
  // Keep native date/search/select widgets aligned with the app theme (not OS alone).
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    } catch {
      /* ignore */
    }
    return 'system'
  })

  const resolved = useMemo(() => resolveTheme(mode), [mode])

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  useEffect(() => {
    if (mode !== 'system') return undefined

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(resolveTheme('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  const setMode = useCallback((next) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleMode = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setMode])

  const value = useMemo(
    () => ({
      mode,
      resolved,
      setMode,
      toggleMode,
      isDark: resolved === 'dark',
    }),
    [mode, resolved, setMode, toggleMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.')
  }
  return context
}
