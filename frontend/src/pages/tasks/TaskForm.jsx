import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useOptions from '../../hooks/useOptions.js'
import useRelatedAutofill from '../../hooks/useRelatedAutofill.js'
import { findOptionById } from '../../utils/options.js'

const EMPTY = {
  project: '',
  title: '',
  description: '',
  assigned_to: '',
  status: 'todo',
  priority: 'medium',
  start_date: '',
  due_date: '',
  estimated_hours: '0',
  actual_hours: '0',
  completion: 0,
}

export default function TaskForm({ open, task, defaultProject, onClose, onSaved }) {
  const [error, setError] = useState('')
  const { options: projects } = useOptions('/projects/', { enabled: open })
  const { options: members } = useOptions('/team-members/', {
    enabled: open,
    params: { status: 'active' },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY })

  const projectField = register('project', { required: 'Choose a project.' })
  const projectId = watch('project')

  const fillFromProject = useCallback(
    (picked) => {
      if (task?.id) return
      setValue('start_date', picked.start_date || '')
      setValue('due_date', picked.due_date || '')
      setValue('priority', picked.priority || 'medium')
      if (picked.description) setValue('description', picked.description)
    },
    [setValue, task?.id],
  )

  useRelatedAutofill({
    skip: Boolean(task?.id),
    sourceId: projectId,
    options: projects,
    apply: fillFromProject,
  })

  useEffect(() => {
    if (!open) return
    setError('')
    reset(
      task
        ? {
            project: task.project || '',
            title: task.title || '',
            description: task.description || '',
            assigned_to: task.assigned_to || '',
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            start_date: task.start_date || '',
            due_date: task.due_date || '',
            estimated_hours: task.estimated_hours ?? '0',
            actual_hours: task.actual_hours ?? '0',
            completion: task.completion ?? 0,
          }
        : { ...EMPTY, project: defaultProject || '' },
    )
  }, [open, task, defaultProject, reset])

  async function onSubmit(values) {
    setError('')
    const payload = {
      ...values,
      project: Number(values.project),
      assigned_to: values.assigned_to ? Number(values.assigned_to) : null,
      start_date: values.start_date || null,
      due_date: values.due_date || null,
      completion: Number(values.completion) || 0,
    }

    try {
      if (task?.id) {
        await api.patch(`/tasks/${task.id}/`, payload)
      } else {
        await api.post('/tasks/', payload)
      }
      onSaved?.()
      onClose?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not save this task.'))
    }
  }

  return (
    <Modal
      open={open}
      title={task ? 'Edit task' : 'New task'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="task-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save task'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="input"
              placeholder="Develop the backend API"
              {...register('title', { required: 'Title is required.' })}
            />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="project">
              Project
            </label>
            <select
              id="project"
              className="input"
              {...projectField}
              onChange={(event) => {
                projectField.onChange(event)
                const picked = findOptionById(projects, event.target.value)
                if (picked) fillFromProject(picked)
              }}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} — {project.client_name}
                </option>
              ))}
            </select>
            {errors.project && <p className="field-error">{errors.project.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="assigned_to">
              Assigned to
            </label>
            <select id="assigned_to" className="input" {...register('assigned_to')}>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.role ? ` — ${member.role}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select id="status" className="input" {...register('status')}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="priority">
              Priority
            </label>
            <select id="priority" className="input" {...register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="start_date">
              Start date
            </label>
            <input id="start_date" type="date" className="input" {...register('start_date')} />
          </div>

          <div>
            <label className="label" htmlFor="due_date">
              Due date
            </label>
            <input id="due_date" type="date" className="input" {...register('due_date')} />
          </div>

          <div>
            <label className="label" htmlFor="estimated_hours">
              Estimated hours
            </label>
            <input
              id="estimated_hours"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className="input"
              {...register('estimated_hours', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="label" htmlFor="actual_hours">
              Actual hours
            </label>
            <input
              id="actual_hours"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className="input"
              {...register('actual_hours', { valueAsNumber: true })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="completion">
              Completion (%)
            </label>
            <input
              id="completion"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="input"
              {...register('completion', {
                valueAsNumber: true,
                min: { value: 0, message: 'Must be between 0 and 100.' },
                max: { value: 100, message: 'Must be between 0 and 100.' },
              })}
            />
            {errors.completion && <p className="field-error">{errors.completion.message}</p>}
            <p className="mt-1 text-muted-xs">
              Set automatically to 100% when the status is Completed.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea id="description" rows={3} className="input" {...register('description')} />
          </div>
        </div>
      </form>
    </Modal>
  )
}
