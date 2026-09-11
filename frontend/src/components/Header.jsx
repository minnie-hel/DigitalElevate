import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { MenuIcon, MoonIcon, PanelLeftIcon, SunIcon } from './Icons.jsx'
import Logo from './Logo.jsx'
import { initials } from '../utils/format.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSidebar } from '../context/SidebarContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Header({ onOpenSidebar }) {
  const { user, logout } = useAuth()
  const { collapsed, toggleCollapsed } = useSidebar()
  const { isDark, toggleMode } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    function onClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const name = user?.full_name?.trim() || user?.email || 'Account'

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b
        border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900
        sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400
            dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        {collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400
              dark:hover:bg-slate-800 lg:inline-flex"
            aria-label="Show sidebar"
            title="Show sidebar"
          >
            <PanelLeftIcon className="h-5 w-5" />
          </button>
        ) : null}

        <div className="flex items-center gap-2 lg:hidden">
          <Logo variant="mark" className="h-8 w-8 shrink-0" />
          <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            Elevate Digital
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={toggleMode}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400
            dark:hover:bg-slate-800"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex max-w-[12rem] items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100
              dark:hover:bg-slate-800 sm:max-w-none"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${name}`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/50
                dark:text-brand-200"
            >
              {initials(name)}
            </span>
            <span className="hidden min-w-0 truncate text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">
              {name}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200
                bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300
                dark:hover:bg-slate-700/80"
              role="menuitem"
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                logout()
              }}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50
                dark:text-red-400 dark:hover:bg-red-950/40"
              role="menuitem"
            >
              Sign out
            </button>
          </div>
          )}
        </div>
      </div>
    </header>
  )
}
