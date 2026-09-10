import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'elevate.sidebar.collapsed'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      mobileOpen,
      setMobileOpen,
      collapsed,
      toggleCollapsed,
    }),
    [mobileOpen, collapsed, toggleCollapsed],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider.')
  }
  return context
}
