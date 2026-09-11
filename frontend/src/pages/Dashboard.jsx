import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Alert from '../components/Alert.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import Spinner from '../components/Spinner.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import api, { apiErrorMessage } from '../services/api.js'
import { useTheme } from '../context/ThemeContext.jsx'
import { formatDate, formatMoney, formatMoneyShort, timeAgo } from '../utils/format.js'

export default function Dashboard() {
  const { isDark } = useTheme()
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        // Bring overdue invoices up to date first, so the KPIs below reflect
        // reality even if nothing has run since yesterday.
        await api.post('/invoices/refresh_overdue/').catch(() => null)

        const [dashboardResponse, revenueResponse] = await Promise.all([
          api.get('/reports/dashboard/'),
          api.get('/reports/revenue/'),
        ])
        if (cancelled) return
        setStats(dashboardResponse.data)
        setRevenue(revenueResponse.data)
      } catch (requestError) {
        if (!cancelled) setError(apiErrorMessage(requestError, 'Could not load the dashboard.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading dashboard..." />
      </div>
    )
  }

  if (error) return <Alert tone="error">{error}</Alert>
  if (!stats) return null

  const chartData = revenue.map((row) => ({
    month: row.label,
    Invoiced: Number(row.invoiced),
    Received: Number(row.paid),
  }))

  const gridStroke = isDark ? '#334155' : '#e2e8f0'
  const tickFill = isDark ? '#94a3b8' : '#64748b'
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    borderColor: isDark ? '#475569' : '#e2e8f0',
    backgroundColor: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#e2e8f0' : '#334155',
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Business overview across clients, delivery and finance."
      />

      {/* All eight KPIs in one tight grid so the panels below stay in view. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Clients"
          value={stats.clients.total}
          hint={`${stats.clients.active} active`}
        />
        <StatCard
          label="Active Projects"
          value={stats.projects.active}
          hint={`${stats.projects.total} in total`}
        />
        <StatCard
          label="Pending Tasks"
          value={stats.tasks.pending}
          hint={`${stats.tasks.completed} completed`}
          tone={stats.tasks.overdue > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Outstanding Invoices"
          value={formatMoney(stats.finance.outstanding)}
          hint={`${stats.finance.unpaid_invoices} unpaid, ${stats.finance.overdue_invoices} overdue`}
          tone={Number(stats.finance.outstanding) > 0 ? 'danger' : 'positive'}
        />
        <StatCard label="Total Invoiced" value={formatMoney(stats.finance.total_invoiced)} />
        <StatCard
          label="Total Received"
          value={formatMoney(stats.finance.total_paid)}
          tone="positive"
        />
        <StatCard
          label="Overdue Projects"
          value={stats.projects.overdue}
          tone={stats.projects.overdue > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Team Members"
          value={stats.team.active}
          hint={`${stats.team.total} on record`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card p-4 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Invoiced vs received</h2>
            <p className="text-muted-xs">Last 12 months, TZS</p>
          </div>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: tickFill }}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={formatMoneyShort}
                  tick={{ fontSize: 11, fill: tickFill }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip formatter={(value) => formatMoney(value)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: tickFill }} />
                <Bar dataKey="Invoiced" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Received" fill="#3366ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Both side panels scroll inside a fixed height rather than pushing
            the page down. */}
        <section className="card flex flex-col p-4">
          <h2 className="section-title">Recent activity</h2>
          {stats.recent_activity.length === 0 ? (
            <p className="mt-4 text-body text-muted">No activity recorded yet.</p>
          ) : (
            <ul className="scroll-panel mt-2 max-h-56 divide-y divide-slate-100 pr-1 dark:divide-slate-800">
              {stats.recent_activity.map((entry) => (
                <li key={entry.id} className="flex gap-2 py-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0">
                    <p className="text-xs leading-snug text-slate-700 dark:text-slate-300">
                      <span className="text-emphasis dark:text-slate-100">
                        {entry.actor_name || 'System'}
                      </span>{' '}
                      {entry.description}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {timeAgo(entry.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Project progress</h2>
          <Link
            to="/projects"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400
              dark:hover:text-brand-300"
          >
            View all projects
          </Link>
        </div>

        {stats.project_progress.length === 0 ? (
          <p className="mt-4 text-body text-muted">No active projects at the moment.</p>
        ) : (
          <ul className="scroll-panel mt-1 max-h-64 divide-y divide-slate-100 pr-1 dark:divide-slate-800">
            {stats.project_progress.map((project) => (
              <li
                key={project.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-sm text-emphasis hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    {project.name}
                  </Link>
                  <span className="ml-2 text-muted-xs">{project.client_name}</span>
                </div>
                <ProgressBar
                  value={project.progress}
                  showLabel={false}
                  className="w-40 shrink-0"
                />
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
                  {project.progress}%
                </span>
                <span className="w-24 shrink-0 text-right text-muted-xs">
                  {formatDate(project.due_date)}
                </span>
                <StatusBadge value={project.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
