import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import Spinner from './components/Spinner.jsx'
import { useAuth } from './context/AuthContext.jsx'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Settings from './pages/Settings.jsx'
import NotFound from './pages/NotFound.jsx'
import ClientList from './pages/clients/ClientList.jsx'
import ClientDetails from './pages/clients/ClientDetails.jsx'
import ProjectList from './pages/projects/ProjectList.jsx'
import ProjectDetails from './pages/projects/ProjectDetails.jsx'
import TaskList from './pages/tasks/TaskList.jsx'
import InvoiceList from './pages/invoices/InvoiceList.jsx'
import InvoiceDetails from './pages/invoices/InvoiceDetails.jsx'
import PaymentList from './pages/payments/PaymentList.jsx'
import TeamList from './pages/team/TeamList.jsx'
import Reports from './pages/reports/Reports.jsx'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <Spinner label="Loading Elevate Digital..." />
    </div>
  )
}

function ProtectedRoutes() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          loading ? (
            <FullPageSpinner />
          ) : isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoiceDetails />} />
        <Route path="/payments" element={<PaymentList />} />
        <Route path="/team" element={<TeamList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
