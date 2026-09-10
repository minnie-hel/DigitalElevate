import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PrintButton from '../../components/PrintButton.jsx'
import PrintHeader from '../../components/PrintHeader.jsx'
import Spinner from '../../components/Spinner.jsx'
import StatCard from '../../components/StatCard.jsx'
import StatusTabs from '../../components/StatusTabs.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import { formatDate, formatMoney, humanise } from '../../utils/format.js'

// One report at a time: it keeps the screen short and means the print button
// produces a single focused document rather than everything at once.
const REPORT_TABS = [
  { value: 'financial', label: 'Financial' },
  { value: 'clients', label: 'Clients' },
  { value: 'delivery', label: 'Projects & Tasks' },
]

const REPORT_TITLES = {
  financial: 'Financial Report',
  clients: 'Client Report',
  delivery: 'Project & Task Report',
}

/** Table shaped for reading on paper: plain rows and an optional totals row. */
function ReportTable({ title, columns, rows, footer, emptyMessage = 'No data.' }) {
  return (
    <section className="card overflow-hidden">
      <h3 className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="table-wrap">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`th ${column.align === 'right' ? 'text-right' : ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={row.key ?? index}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`td ${column.align === 'right' ? 'text-right' : ''}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {footer && (
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <tr>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`td ${column.align === 'right' ? 'text-right' : ''}`}
                    >
                      {footer[column.key] ?? ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  )
}

function sum(rows, pick) {
  return rows.reduce((total, row) => total + Number(pick(row) || 0), 0)
}

export default function Reports() {
  const [report, setReport] = useState('financial')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [revenue, financial, projects, clients, tasks] = await Promise.all([
          api.get('/reports/revenue/'),
          api.get('/reports/financial/'),
          api.get('/reports/projects/'),
          api.get('/reports/clients/'),
          api.get('/reports/tasks/'),
        ])
        if (cancelled) return
        setData({
          revenue: revenue.data,
          financial: financial.data,
          projects: projects.data,
          clients: clients.data,
          tasks: tasks.data,
        })
      } catch (requestError) {
        if (!cancelled) setError(apiErrorMessage(requestError, 'Could not load the reports.'))
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
        <Spinner label="Building reports..." />
      </div>
    )
  }

  if (error) return <Alert tone="error">{error}</Alert>
  if (!data) return null

  return (
    <div>
      <PageHeader title="Reports" subtitle="Management view across delivery and finance." />

      <PrintHeader title={REPORT_TITLES[report]} />

      <div className="no-print card mb-4 overflow-hidden">
        <StatusTabs options={REPORT_TABS} value={report} onChange={setReport} />
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-3 py-2.5">
          <PrintButton label="Print" className="py-1.5 text-sm" />
        </div>
      </div>

      {report === 'financial' && <FinancialReport data={data} />}
      {report === 'clients' && <ClientReport data={data.clients} />}
      {report === 'delivery' && <DeliveryReport data={data} />}
    </div>
  )
}

function FinancialReport({ data }) {
  const { summary, invoices_by_status: byStatus, payments_by_method: byMethod } = data.financial
  const months = data.revenue

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Invoiced" value={formatMoney(summary.total_invoiced)} />
        <StatCard
          label="Total Received"
          value={formatMoney(summary.total_paid)}
          tone="positive"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(summary.outstanding)}
          tone={Number(summary.outstanding) > 0 ? 'danger' : 'positive'}
        />
        <StatCard
          label="Collection Rate"
          value={`${summary.collection_rate}%`}
          hint="Received as a share of invoiced"
        />
      </div>

      <ReportTable
        title="Invoiced vs received by month"
        rows={months.map((row) => ({ ...row, key: row.month }))}
        columns={[
          { key: 'label', header: 'Month', render: (row) => row.label },
          {
            key: 'invoiced',
            header: 'Invoiced',
            align: 'right',
            render: (row) => formatMoney(row.invoiced),
          },
          {
            key: 'paid',
            header: 'Received',
            align: 'right',
            render: (row) => formatMoney(row.paid),
          },
          {
            key: 'gap',
            header: 'Difference',
            align: 'right',
            render: (row) => formatMoney(Number(row.invoiced) - Number(row.paid)),
          },
        ]}
        footer={{
          label: 'Total',
          invoiced: formatMoney(sum(months, (row) => row.invoiced)),
          paid: formatMoney(sum(months, (row) => row.paid)),
          gap: formatMoney(
            sum(months, (row) => row.invoiced) - sum(months, (row) => row.paid),
          ),
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportTable
          title="Invoices by status"
          rows={byStatus.map((row) => ({ ...row, key: row.status }))}
          emptyMessage="No invoices raised yet."
          columns={[
            { key: 'status', header: 'Status', render: (row) => humanise(row.status) },
            { key: 'count', header: 'Invoices', align: 'right', render: (row) => row.count },
            {
              key: 'value',
              header: 'Value',
              align: 'right',
              render: (row) => formatMoney(row.value),
            },
          ]}
          footer={{
            status: 'Total',
            count: sum(byStatus, (row) => row.count),
            value: formatMoney(sum(byStatus, (row) => row.value)),
          }}
        />

        <ReportTable
          title="Payments by method"
          rows={byMethod.map((row) => ({ ...row, key: row.method }))}
          emptyMessage="No payments recorded yet."
          columns={[
            { key: 'method', header: 'Method', render: (row) => humanise(row.method) },
            { key: 'count', header: 'Payments', align: 'right', render: (row) => row.count },
            {
              key: 'value',
              header: 'Value',
              align: 'right',
              render: (row) => formatMoney(row.value),
            },
          ]}
          footer={{
            method: 'Total',
            count: sum(byMethod, (row) => row.count),
            value: formatMoney(sum(byMethod, (row) => row.value)),
          }}
        />
      </div>
    </div>
  )
}

function ClientReport({ data }) {
  const { totals, top_clients: topClients, by_industry: byIndustry } = data

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Clients" value={totals.total} />
        <StatCard label="Active" value={totals.active} tone="positive" />
        <StatCard label="Inactive" value={totals.inactive} hint={`${totals.prospects} prospects`} />
        <StatCard label="New This Month" value={totals.new_this_month} />
      </div>

      <ReportTable
        title="Top clients by value invoiced"
        rows={topClients.map((row) => ({ ...row, key: row.id }))}
        emptyMessage="Nothing invoiced yet."
        columns={[
          {
            key: 'name',
            header: 'Client',
            render: (row) => (
              <Link to={`/clients/${row.id}`} className="font-medium hover:text-brand-600">
                {row.name}
              </Link>
            ),
          },
          { key: 'projects', header: 'Projects', align: 'right', render: (row) => row.projects },
          {
            key: 'invoiced',
            header: 'Invoiced',
            align: 'right',
            render: (row) => formatMoney(row.invoiced),
          },
        ]}
        footer={{
          name: 'Total',
          projects: sum(topClients, (row) => row.projects),
          invoiced: formatMoney(sum(topClients, (row) => row.invoiced)),
        }}
      />

      <ReportTable
        title="Clients by industry"
        rows={byIndustry.map((row) => ({ ...row, key: row.industry }))}
        emptyMessage="No industries recorded."
        columns={[
          { key: 'industry', header: 'Industry', render: (row) => row.industry },
          { key: 'count', header: 'Clients', align: 'right', render: (row) => row.count },
          {
            key: 'share',
            header: 'Share',
            align: 'right',
            render: (row) =>
              totals.total ? `${Math.round((row.count / totals.total) * 100)}%` : '-',
          },
        ]}
        footer={{
          industry: 'Total',
          count: sum(byIndustry, (row) => row.count),
        }}
      />
    </div>
  )
}

function DeliveryReport({ data }) {
  const { projects, tasks } = data

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Projects" value={projects.totals.total} />
        <StatCard label="Completed" value={projects.totals.completed} tone="positive" />
        <StatCard label="In Progress" value={projects.totals.in_progress} />
        <StatCard
          label="Overdue Tasks"
          value={tasks.totals.overdue}
          tone={tasks.totals.overdue > 0 ? 'danger' : 'positive'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ReportTable
          title="Projects by status"
          rows={projects.by_status.map((row) => ({ ...row, key: row.status }))}
          columns={[
            { key: 'status', header: 'Status', render: (row) => humanise(row.status) },
            { key: 'count', header: 'Projects', align: 'right', render: (row) => row.count },
          ]}
          footer={{
            status: 'Total',
            count: sum(projects.by_status, (row) => row.count),
          }}
        />

        <ReportTable
          title="Projects by priority"
          rows={projects.by_priority.map((row) => ({ ...row, key: row.priority }))}
          columns={[
            { key: 'priority', header: 'Priority', render: (row) => humanise(row.priority) },
            { key: 'count', header: 'Projects', align: 'right', render: (row) => row.count },
          ]}
          footer={{
            priority: 'Total',
            count: sum(projects.by_priority, (row) => row.count),
          }}
        />

        <ReportTable
          title="Tasks by status"
          rows={tasks.by_status.map((row) => ({ ...row, key: row.status }))}
          columns={[
            { key: 'status', header: 'Status', render: (row) => humanise(row.status) },
            { key: 'count', header: 'Tasks', align: 'right', render: (row) => row.count },
          ]}
          footer={{
            status: 'Total',
            count: sum(tasks.by_status, (row) => row.count),
          }}
        />
      </div>

      <ReportTable
        title="Overdue projects"
        rows={projects.overdue.map((row) => ({ ...row, key: row.id }))}
        emptyMessage="Nothing is past its due date."
        columns={[
          {
            key: 'name',
            header: 'Project',
            render: (row) => (
              <Link to={`/projects/${row.id}`} className="font-medium hover:text-brand-600">
                {row.name}
              </Link>
            ),
          },
          { key: 'client_name', header: 'Client', render: (row) => row.client_name },
          { key: 'status', header: 'Status', render: (row) => humanise(row.status) },
          { key: 'due_date', header: 'Due', render: (row) => formatDate(row.due_date) },
          {
            key: 'days_overdue',
            header: 'Days late',
            align: 'right',
            render: (row) => <span className="font-medium text-red-600">{row.days_overdue}</span>,
          },
        ]}
      />

      <ReportTable
        title="Team workload"
        rows={tasks.by_member.map((row) => ({ ...row, key: row.id }))}
        emptyMessage="No active team members."
        columns={[
          { key: 'name', header: 'Member', render: (row) => row.name },
          { key: 'role', header: 'Role', render: (row) => row.role || '-' },
          { key: 'open_tasks', header: 'Open', align: 'right', render: (row) => row.open_tasks },
          {
            key: 'completed_tasks',
            header: 'Completed',
            align: 'right',
            render: (row) => row.completed_tasks,
          },
          {
            key: 'total',
            header: 'Total',
            align: 'right',
            render: (row) => row.open_tasks + row.completed_tasks,
          },
        ]}
        footer={{
          name: 'Total',
          open_tasks: sum(tasks.by_member, (row) => row.open_tasks),
          completed_tasks: sum(tasks.by_member, (row) => row.completed_tasks),
          total: sum(tasks.by_member, (row) => row.open_tasks + row.completed_tasks),
        }}
      />
    </div>
  )
}
