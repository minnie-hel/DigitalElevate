import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Spinner from '../../components/Spinner.jsx'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon } from '../../components/Icons.jsx'
import ClientForm from './ClientForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import { formatDate, formatMoney, timeAgo } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

const TABS = ['Overview', 'Projects', 'Tasks', 'Invoices', 'Payments', 'Activity']

export default function ClientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()

  const [tab, setTab] = useState('Overview')
  const [overview, setOverview] = useState(null)
  const [tabData, setTabData] = useState({})
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/clients/${id}/overview/`)
      setOverview(data)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not load this client.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  // Each tab loads its own slice on demand and keeps it cached afterwards.
  useEffect(() => {
    if (tab === 'Overview') return undefined

    const endpoints = {
      Projects: 'projects',
      Tasks: 'tasks',
      Invoices: 'invoices',
      Payments: 'payments',
      Activity: 'activity',
    }
    const key = endpoints[tab]
    if (!key || tabData[key]) return undefined

    let cancelled = false
    setTabLoading(true)

    api
      .get(`/clients/${id}/${key}/`)
      .then(({ data }) => {
        if (!cancelled) setTabData((current) => ({ ...current, [key]: data }))
      })
      .catch((requestError) => {
        if (!cancelled) setError(apiErrorMessage(requestError, `Could not load ${tab}.`))
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tab, id, tabData])

  function refreshEverything() {
    setTabData({})
    loadOverview()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading client..." />
      </div>
    )
  }

  if (error && !overview) return <Alert tone="error">{error}</Alert>
  if (!overview) return null

  const client = overview.client

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/clients')}
        className="mb-4 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        &larr; Back to clients
      </button>

      <PageHeader
        title={client.name}
        subtitle={[client.industry, client.address].filter(Boolean).join(' · ')}
        actions={
          <>
            <StatusBadge value={client.status} label={client.status_display} />
            {canEdit && (
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(true)}>
                <EditIcon className="h-4 w-4" />
                Edit
              </button>
            )}
          </>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Projects"
          value={overview.projects.total}
          hint={`${overview.projects.active} active, ${overview.projects.completed} completed`}
        />
        <StatCard
          label="Tasks"
          value={overview.tasks.total}
          hint={`${overview.tasks.completed} completed, ${overview.tasks.open} open`}
        />
        <StatCard label="Total Invoiced" value={formatMoney(overview.finance.total_invoiced)} />
        <StatCard
          label="Outstanding"
          value={formatMoney(overview.finance.outstanding)}
          tone={Number(overview.finance.outstanding) > 0 ? 'danger' : 'positive'}
          hint={`${formatMoney(overview.finance.total_paid)} received`}
        />
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-1 overflow-hidden border-b border-slate-200 dark:border-slate-700 px-2">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === name
                  ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div>
          {tab === 'Overview' && <OverviewTab client={client} />}

          {tab === 'Projects' && (
            <DataTable
              loading={tabLoading}
              rows={tabData.projects || []}
              emptyMessage="No projects for this client yet."
              onRowClick={(row) => navigate(`/projects/${row.id}`)}
              columns={[
                { key: 'name', header: 'Project' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <StatusBadge value={row.status} label={row.status_display} />,
                },
                {
                  key: 'progress',
                  header: 'Progress',
                  render: (row) => <ProgressBar value={row.progress} className="w-40" />,
                },
                {
                  key: 'budget',
                  header: 'Budget',
                  align: 'right',
                  render: (row) => formatMoney(row.budget),
                },
                {
                  key: 'due_date',
                  header: 'Due',
                  render: (row) => formatDate(row.due_date),
                },
              ]}
            />
          )}

          {tab === 'Tasks' && (
            <DataTable
              loading={tabLoading}
              rows={tabData.tasks || []}
              emptyMessage="No tasks for this client yet."
              columns={[
                { key: 'title', header: 'Task' },
                { key: 'project_name', header: 'Project' },
                {
                  key: 'assigned_to_name',
                  header: 'Assigned to',
                  render: (row) => row.assigned_to_name || 'Unassigned',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <StatusBadge value={row.status} label={row.status_display} />,
                },
                { key: 'due_date', header: 'Due', render: (row) => formatDate(row.due_date) },
              ]}
            />
          )}

          {tab === 'Invoices' && (
            <DataTable
              loading={tabLoading}
              rows={tabData.invoices || []}
              emptyMessage="No invoices raised for this client yet."
              onRowClick={(row) => navigate(`/invoices/${row.id}`)}
              columns={[
                { key: 'invoice_number', header: 'Invoice' },
                {
                  key: 'project_name',
                  header: 'Project',
                  render: (row) => row.project_name || '-',
                },
                {
                  key: 'issue_date',
                  header: 'Issued',
                  render: (row) => formatDate(row.issue_date),
                },
                {
                  key: 'total_amount',
                  header: 'Total',
                  align: 'right',
                  render: (row) => formatMoney(row.total_amount),
                },
                {
                  key: 'balance',
                  header: 'Balance',
                  align: 'right',
                  render: (row) => formatMoney(row.balance),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <StatusBadge value={row.status} label={row.status_display} />,
                },
              ]}
            />
          )}

          {tab === 'Payments' && (
            <DataTable
              loading={tabLoading}
              rows={tabData.payments || []}
              emptyMessage="No payments recorded for this client yet."
              columns={[
                {
                  key: 'payment_date',
                  header: 'Date',
                  render: (row) => formatDate(row.payment_date),
                },
                {
                  key: 'invoice_number',
                  header: 'Invoice',
                  render: (row) => (
                    <Link
                      to={`/invoices/${row.invoice}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {row.invoice_number}
                    </Link>
                  ),
                },
                { key: 'method_display', header: 'Method' },
                { key: 'reference', header: 'Reference', render: (row) => row.reference || '-' },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  render: (row) => (
                    <span className="font-medium text-emerald-600">
                      {formatMoney(row.amount)}
                    </span>
                  ),
                },
              ]}
            />
          )}

          {tab === 'Activity' && (
            <div className="p-5">
              {tabLoading ? (
                <Spinner label="Loading activity..." />
              ) : (tabData.activity || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Nothing has happened on this client yet.
                </p>
              ) : (
                <ol className="space-y-4">
                  {tabData.activity.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{entry.actor_name || 'System'}</span>{' '}
                          {entry.description}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {timeAgo(entry.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>

      <ClientForm
        open={formOpen}
        client={client}
        onClose={() => setFormOpen(false)}
        onSaved={refreshEverything}
      />
    </div>
  )
}

function OverviewTab({ client }) {
  const rows = [
    ['Company name', client.name],
    ['Contact person', client.contact_person],
    ['Email', client.email],
    ['Phone', client.phone],
    ['Industry', client.industry],
    ['Address', client.address],
  ]

  return (
    <div className="grid gap-6 p-5 lg:grid-cols-2">
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4">
            <dt className="w-32 shrink-0 text-sm text-slate-500">{label}</dt>
            <dd className="text-sm text-slate-800 dark:text-slate-100">{value || '-'}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="section-title">Notes</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
          {client.notes || 'No notes recorded.'}
        </p>
      </div>
    </div>
  )
}
