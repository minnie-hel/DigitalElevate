import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ListScreenToolbar from '../../components/ListScreenToolbar.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PrintHeader from '../../components/PrintHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import ProjectForm from './ProjectForm.jsx'
import { serviceTypeLabel } from './serviceTypes.js'
import api, { apiErrorMessage } from '../../services/api.js'
import useList from '../../hooks/useList.js'
import useOptions from '../../hooks/useOptions.js'
import { exportRowsCsv } from '../../utils/listToolbar.js'
import { formatDate, formatMoney } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function ProjectList() {
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const [status, setStatus] = useState('')
  const [client, setClient] = useState('')
  const [priority, setPriority] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const list = useList('/projects/', { filters: { status, client, priority } })
  const { options: clients } = useOptions('/clients/')

  async function confirmDelete() {
    setBusy(true)
    setActionError('')
    try {
      await api.delete(`/projects/${deleting.id}/`)
      setDeleting(null)
      list.refresh()
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Could not delete this project.'))
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (row) => (
        <div>
          <p className="text-emphasis">{row.name}</p>
          <p className="text-muted-xs">
            {row.client_name}
            {row.service_type_display || row.service_type
              ? ` · ${row.service_type_display || serviceTypeLabel(row.service_type)}`
              : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <div className="w-44">
          <ProgressBar value={row.progress} />
          <p className="mt-1 text-xs text-slate-400">
            {row.completed_tasks} of {row.total_tasks} tasks
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge value={row.status} label={row.status_display} />,
    },
    {
      key: 'service_type',
      header: 'Service',
      render: (row) =>
        row.service_type_display || serviceTypeLabel(row.service_type) || '—',
    },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      render: (row) => formatMoney(row.budget),
    },
    {
      key: 'due_date',
      header: 'Due date',
      render: (row) => (
        <span className={row.is_overdue ? 'font-medium text-red-600' : ''}>
          {formatDate(row.due_date)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      hideOnPrint: true,
      render: (row) =>
        canEdit ? (
          <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
              onClick={() => {
                setEditing(row)
                setFormOpen(true)
              }}
              aria-label={`Edit ${row.name}`}
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              onClick={() => setDeleting(row)}
              aria-label={`Delete ${row.name}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader title="Projects" subtitle="Delivery work across every client." />

      <PrintHeader
        title="Project List"
        subtitle={`Status: ${
          STATUS_TABS.find((tab) => tab.value === status)?.label || 'All'
        }${client ? ` · Client: ${clients.find((c) => String(c.id) === String(client))?.name || ''}` : ''}${
          priority ? ` · Priority: ${priority}` : ''
        } · ${list.count} record(s)`}
      />

      {actionError && (
        <Alert tone="error" className="mb-4">
          {actionError}
        </Alert>
      )}
      {list.error && (
        <Alert tone="error" className="mb-4">
          {list.error}
        </Alert>
      )}

      <div className="card overflow-hidden">
        <ListScreenToolbar
          statusTabs={STATUS_TABS}
          status={status}
          onStatusChange={setStatus}
          count={list.count}
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder="Search projects..."
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          filterContent={
            <>
              <div>
                <label className="label" htmlFor="filter-project-client">
                  Client
                </label>
                <select
                  id="filter-project-client"
                  className="input"
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                >
                  <option value="">All clients</option>
                  {clients.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="filter-project-priority">
                  Priority
                </label>
                <select
                  id="filter-project-priority"
                  className="input"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option value="">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </>
          }
          onExport={() =>
            exportRowsCsv(
              'projects.csv',
              [
                { header: 'Project', key: 'name' },
                { header: 'Client', key: 'client_name' },
                { header: 'Service type', key: 'service_type_display' },
                { header: 'Status', key: 'status' },
                { header: 'Budget', key: 'budget' },
                { header: 'Start', key: 'start_date' },
                { header: 'Due', key: 'due_date' },
              ],
              list.rows,
            )
          }
          addLabel="New project"
          showAdd={canEdit}
          onAdd={
            canEdit
              ? () => {
                  setEditing(null)
                  setFormOpen(true)
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          onRowClick={(row) => navigate(`/projects/${row.id}`)}
          emptyMessage="No projects match these filters."
        />
      </div>

      <ProjectForm
        open={formOpen}
        project={editing}
        onClose={() => setFormOpen(false)}
        onSaved={list.refresh}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete project"
        message={
          deleting
            ? `Deleting ${deleting.name} also removes its tasks. This cannot be undone.`
            : ''
        }
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
