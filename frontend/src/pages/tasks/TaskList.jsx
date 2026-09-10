import { useState } from 'react'
import { Link } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ListScreenToolbar from '../../components/ListScreenToolbar.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PrintHeader from '../../components/PrintHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import TaskForm from './TaskForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useList from '../../hooks/useList.js'
import useOptions from '../../hooks/useOptions.js'
import { exportRowsCsv } from '../../utils/listToolbar.js'
import { formatDate } from '../../utils/format.js'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
]

export default function TaskList() {
  const [status, setStatus] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const list = useList('/tasks/', {
    filters: { status, assigned_to: assignee, priority },
  })
  const { options: members } = useOptions('/team-members/')

  async function toggleComplete(task) {
    setActionError('')
    const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed'
    try {
      await api.post(`/tasks/${task.id}/set_status/`, { status: nextStatus })
      list.refresh()
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Could not update this task.'))
    }
  }

  async function confirmDelete() {
    setBusy(true)
    setActionError('')
    try {
      await api.delete(`/tasks/${deleting.id}/`)
      setDeleting(null)
      list.refresh()
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Could not delete this task.'))
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'done',
      header: '',
      hideOnPrint: true,
      render: (row) => (
        <input
          type="checkbox"
          checked={row.status === 'completed'}
          onChange={() => toggleComplete(row)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          aria-label={`Mark ${row.title} complete`}
        />
      ),
    },
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <div>
          <p
            className={`font-medium ${
              row.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'
            }`}
          >
            {row.title}
          </p>
          <p className="text-xs text-slate-500">
            <Link to={`/projects/${row.project}`} className="hover:text-brand-600">
              {row.project_name}
            </Link>
            {row.client_name ? ` · ${row.client_name}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'assigned_to_name',
      header: 'Assigned to',
      render: (row) => row.assigned_to_name || <span className="text-slate-400">Unassigned</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge value={row.status} label={row.status_display} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <StatusBadge value={row.priority} label={row.priority_display} />,
    },
    {
      key: 'due_date',
      header: 'Due',
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
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
            onClick={() => {
              setEditing(row)
              setFormOpen(true)
            }}
            aria-label={`Edit ${row.title}`}
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleting(row)}
            aria-label={`Delete ${row.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Work items across all projects." />

      <PrintHeader
        title="Task List"
        subtitle={`Status: ${
          STATUS_TABS.find((tab) => tab.value === status)?.label || 'All'
        }${
          assignee
            ? ` · Assignee: ${members.find((m) => String(m.id) === String(assignee))?.name || ''}`
            : ''
        }${priority ? ` · Priority: ${priority}` : ''} · ${list.count} record(s)`}
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
          searchPlaceholder="Search tasks..."
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          filterContent={
            <>
              <div>
                <label className="label" htmlFor="filter-task-assignee">
                  Assignee
                </label>
                <select
                  id="filter-task-assignee"
                  className="input"
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                >
                  <option value="">Everyone</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="filter-task-priority">
                  Priority
                </label>
                <select
                  id="filter-task-priority"
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
              'tasks.csv',
              [
                { header: 'Title', key: 'title' },
                { header: 'Project', key: 'project_name' },
                { header: 'Assignee', key: 'assignee_name' },
                { header: 'Status', key: 'status' },
                { header: 'Priority', key: 'priority' },
                { header: 'Due', key: 'due_date' },
              ],
              list.rows,
            )
          }
          addLabel="Add New"
          onAdd={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        />

        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          emptyMessage="No tasks match these filters."
        />
      </div>

      <TaskForm
        open={formOpen}
        task={editing}
        onClose={() => setFormOpen(false)}
        onSaved={list.refresh}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete task"
        message={deleting ? `Delete "${deleting.title}"? This cannot be undone.` : ''}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
