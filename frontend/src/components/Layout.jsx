import { Outlet } from 'react-router-dom'

import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import { SidebarProvider, useSidebar } from '../context/SidebarContext.jsx'

function LayoutShell() {
  const { mobileOpen, setMobileOpen, collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="no-print">
        <Sidebar open={mobileOpen} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      </div>
      <div
        className={`app-content transition-[padding] duration-200 ${
          collapsed ? 'lg:pl-0' : 'lg:pl-64'
        }`}
      >
        <div className="no-print">
          <Header onOpenSidebar={() => setMobileOpen(true)} />
        </div>
        <main className="app-main p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutShell />
    </SidebarProvider>
  )
}
