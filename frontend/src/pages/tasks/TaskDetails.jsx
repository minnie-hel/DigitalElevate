import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DetailFields from '../../components/DetailFields.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Spinner from '../../components/Spinner.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import TaskForm from './TaskForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import { formatDate, timeAgo } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function TaskDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/tasks/${id}/`)
      setTask(data)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not load this task.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function confirmDelete() {
    setBusy(true)
    try {
      await api.delete(`/tasks/${id}/`)
      navigate('/tasks')
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not delete this task.'))
    } finally {
      setBusy(false)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading task..." />
      </div>
    )
  }

  if (error && !task) return <Alert tone="error">{error}</Alert>
  if (!task) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/tasks')}
        className="mb-4 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        &larr; Back to tasks
      </button>

      <PageHeader
        title={task.title}
        subtitle={
          <>
            <Link to={`/projects/${task.project}`} className="hover:text-brand-600">
              {task.project_name}
            </Link>
            {task.client_name && (
              <>
                {' · '}
                <Link to={`/clients/${task.client_id}`} className="hover:text-brand-600">
                  {task.client_name}
                </Link>
              </>
            )}
          </>
        }
        actions={
          <>
            <StatusBadge value={task.status} label={task.status_display} />
            <StatusBadge value={task.priority} label={task.priority_display} />
            {canEdit && (
              <>
                <button type="button" className="btn-secondary" onClick={() => setFormOpen(true)}>
                  <EditIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-secondary text-red-600 hover:border-red-200 hover:bg-red-50"
                  onClick={() => setDeleting(true)}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <section className="card p-6">
        <h2 className="section-title mb-4">
          Task details
        </h2>

        {task.description && (
          <p className="mb-6 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
            {task.description}
          </p>
        )}

        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-muted-xs">
            <span>Completion</span>
            <span>{task.completion ?? 0}%</span>
          </div>
          <ProgressBar value={Number(task.completion) || 0} />
        </div>

        <DetailFields
          items={[
            {
              label: 'Assigned to',
              value: task.assigned_to_name || 'Unassigned',
            },
            {
              label: 'Start date',
              value: formatDate(task.start_date),
            },
            {
              label: 'Due date',
              value: (
                <span className={task.is_overdue ? 'font-medium text-red-600' : undefined}>
                  {formatDate(task.due_date)}
                  {task.is_overdue ? ' (overdue)' : ''}
                </span>
              ),
            },
            {
              label: 'Estimated hours',
              value: task.estimated_hours != null ? String(task.estimated_hours) : '—',
            },
            {
              label: 'Actual hours',
              value: task.actual_hours != null ? String(task.actual_hours) : '—',
            },
            {
              label: 'Completed at',
              value: task.completed_at ? formatDate(task.completed_at) : '—',
            },
            {
              label: 'Created',
              value: timeAgo(task.created_at),
            },
            {
              label: 'Last updated',
              value: timeAgo(task.updated_at),
            },
          ]}
        />
      </section>

      <TaskForm open={formOpen} task={task} onClose={() => setFormOpen(false)} onSaved={load} />

      <ConfirmDialog
        open={deleting}
        title="Delete task"
        message={`Delete "${task.title}"? This cannot be undone.`}
        busy={busy}
        onCancel={() => setDeleting(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
