import { MenuIcon, PanelLeftIcon } from './Icons.jsx'
import Logo from './Logo.jsx'
import { useSidebar } from '../context/SidebarContext.jsx'

export default function Header({ onOpenSidebar }) {
  const { collapsed, toggleCollapsed } = useSidebar()

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200
        bg-white px-4 shadow-sm sm:px-6"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        {collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:inline-flex"
            aria-label="Show sidebar"
            title="Show sidebar"
          >
            <PanelLeftIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <Logo variant="mark" className="h-8 w-8 shrink-0 border border-slate-200" />
        <span className="text-sm font-semibold text-slate-800">Elevate Digital</span>
      </div>
    </header>
  )
}
