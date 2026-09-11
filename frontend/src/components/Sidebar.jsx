import { NavLink } from 'react-router-dom'

import {
  ClientsIcon,
  DashboardIcon,
  InvoiceIcon,
  LogoutIcon,
  PanelLeftIcon,
  PaymentIcon,
  ProjectsIcon,
  ReportsIcon,
  SettingsIcon,
  TasksIcon,
  TeamIcon,
} from './Icons.jsx'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSidebar } from '../context/SidebarContext.jsx'

const MODULES = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/clients', label: 'Clients', icon: ClientsIcon },
  { to: '/projects', label: 'Projects', icon: ProjectsIcon },
  { to: '/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/invoices', label: 'Invoices', icon: InvoiceIcon },
  { to: '/payments', label: 'Payments', icon: PaymentIcon },
  { to: '/team', label: 'Team Members', icon: TeamIcon },
  { to: '/reports', label: 'Reports', icon: ReportsIcon },
]

function itemClasses({ isActive }) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  ].join(' ')
}

export default function Sidebar({ open, collapsed, onNavigate }) {
  const { logout } = useAuth()
  const { toggleCollapsed } = useSidebar()

  const hiddenOnDesktop = collapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 shadow-xl
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${hiddenOnDesktop}`}
      >
        <div
          className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4
            dark:border-slate-700"
        >
          <Logo variant="wordmark" className="w-32 shrink-0" />
          <button
            type="button"
            onClick={toggleCollapsed}
            className="ml-auto hidden shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100
              dark:text-slate-400 dark:hover:bg-slate-800 lg:inline-flex"
            aria-label="Hide sidebar"
            title="Hide sidebar"
          >
            <PanelLeftIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-6">
          {MODULES.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={itemClasses}
              onClick={onNavigate}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-slate-800 px-3 py-4">
          <NavLink to="/settings" className={itemClasses} onClick={onNavigate}>
            <SettingsIcon className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
              font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
