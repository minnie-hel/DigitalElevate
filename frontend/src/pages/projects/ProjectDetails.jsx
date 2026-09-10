import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Spinner from '../../components/Spinner.jsx'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, PlusIcon, TrashIcon } from '../../components/Icons.jsx'
import ProjectForm from './ProjectForm.jsx'
import TaskForm from '../tasks/TaskForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import { formatDate, formatMoney } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [projectResponse, tasksResponse, progressResponse] = await Promise.all([
        api.get(`/projects/${id}/`),
        api.get(`/projects/${id}/tasks/`),
        api.get(`/projects/${id}/progress/`),
      ])
      setProject(projectResponse.data)
      setTasks(tasksResponse.data)
      setProgress(progressResponse.data)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not load this project.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function toggleTask(task) {
    const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed'
    try {
      await api.post(`/tasks/${task.id}/set_status/`, { status: nextStatus })
      load()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not update this task.'))
    }
  }

  async function confirmDeleteTask() {
    setBusy(true)
    try {
      await api.delete(`/tasks/${deletingTask.id}/`)
      setDeletingTask(null)
      load()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not delete this task.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading project..." />
      </div>
    )
  }

  if (error && !project) return <Alert tone="error">{error}</Alert>
  if (!project) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/projects')}
        className="mb-4 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        &larr; Back to projects
      </button>

      <PageHeader
        title={project.name}
        subtitle={
          <>
            <Link to={`/clients/${project.client}`} className="hover:text-brand-600">
              {project.client_name}
            </Link>
          </>
        }
        actions={
          <>
            <StatusBadge value={project.status} label={project.status_display} />
            <StatusBadge value={project.priority} label={project.priority_display} />
            {canEdit && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProjectFormOpen(true)}
              >
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Budget" value={formatMoney(project.budget)} />
        <StatCard
          label="Tasks"
          value={progress?.total_tasks ?? 0}
          hint={`${progress?.completed ?? 0} completed`}
        />
        <StatCard
          label="Start date"
          value={formatDate(project.start_date)}
          hint={`Due ${formatDate(project.due_date)}`}
        />
        <StatCard
          label="Progress"
          value={`${project.progress}%`}
          tone={project.progress >= 100 ? 'positive' : 'default'}
          hint={project.is_overdue ? 'Past its due date' : undefined}
        />
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Overall progress</h2>
        <ProgressBar value={project.progress} className="mt-3" />
        {progress && (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            {[
              ['Completed', progress.completed],
              ['In progress', progress.in_progress],
              ['In review', progress.review],
              ['Blocked', progress.blocked],
              ['To do', progress.pending],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-lg font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {project.description && (
          <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{project.description}</p>
        )}
      </section>

      <section className="card mt-6">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Tasks</h2>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingTask(null)
              setTaskFormOpen(true)
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add task
          </button>
        </div>

        <DataTable
          rows={tasks}
          emptyMessage="No tasks yet. Add the first one to start tracking progress."
          columns={[
            {
              key: 'done',
              header: '',
              render: (row) => (
                <input
                  type="checkbox"
                  checked={row.status === 'completed'}
                  onChange={() => toggleTask(row)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  aria-label={`Mark ${row.title} complete`}
                />
              ),
            },
            {
              key: 'title',
              header: 'Task',
              render: (row) => (
                <span
                  className={
                    row.status === 'completed'
                      ? 'text-slate-400 line-through'
                      : 'font-medium text-slate-800'
                  }
                >
                  {row.title}
                </span>
              ),
            },
            {
              key: 'assigned_to_name',
              header: 'Assigned to',
              render: (row) =>
                row.assigned_to_name || <span className="text-slate-400">Unassigned</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge value={row.status} label={row.status_display} />,
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
              key: 'hours',
              header: 'Hours',
              align: 'right',
              render: (row) => `${row.actual_hours} / ${row.estimated_hours}`,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                    onClick={() => {
                      setEditingTask(row)
                      setTaskFormOpen(true)
                    }}
                    aria-label={`Edit ${row.title}`}
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setDeletingTask(row)}
                    aria-label={`Delete ${row.title}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </section>

      <ProjectForm
        open={projectFormOpen}
        project={project}
        onClose={() => setProjectFormOpen(false)}
        onSaved={load}
      />

      <TaskForm
        open={taskFormOpen}
        task={editingTask}
        defaultProject={project.id}
        onClose={() => setTaskFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        title="Delete task"
        message={deletingTask ? `Delete "${deletingTask.title}"? This cannot be undone.` : ''}
        busy={busy}
        onCancel={() => setDeletingTask(null)}
        onConfirm={confirmDeleteTask}
      />
    </div>
  )
}
