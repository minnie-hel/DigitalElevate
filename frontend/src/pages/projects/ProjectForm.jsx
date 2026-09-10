import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useOptions from '../../hooks/useOptions.js'
import useRelatedAutofill from '../../hooks/useRelatedAutofill.js'
import { findOptionById } from '../../utils/options.js'

const EMPTY = {
  client: '',
  name: '',
  description: '',
  start_date: '',
  due_date: '',
  budget: '0',
  status: 'planning',
  priority: 'medium',
}

export default function ProjectForm({ open, project, defaultClient, onClose, onSaved }) {
  const [error, setError] = useState('')
  const { options: clients } = useOptions('/clients/', { enabled: open })
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY })

  const clientField = register('client', { required: 'Choose a client.' })
  const clientId = watch('client')

  const fillFromClient = useCallback(
    (picked) => {
      if (project?.id) return
      if (picked.notes) setValue('description', picked.notes)
    },
    [project?.id, setValue],
  )

  useRelatedAutofill({
    skip: Boolean(project?.id),
    sourceId: clientId,
    options: clients,
    apply: fillFromClient,
  })

  useEffect(() => {
    if (!open) return
    setError('')
    reset(
      project
        ? {
            client: project.client || '',
            name: project.name || '',
            description: project.description || '',
            start_date: project.start_date || '',
            due_date: project.due_date || '',
            budget: project.budget ?? '0',
            status: project.status || 'planning',
            priority: project.priority || 'medium',
          }
        : { ...EMPTY, client: defaultClient || '' },
    )
  }, [open, project, defaultClient, reset])

  async function onSubmit(values) {
    setError('')
    const payload = {
      ...values,
      client: Number(values.client),
      start_date: values.start_date || null,
      due_date: values.due_date || null,
    }

    try {
      if (project?.id) {
        await api.patch(`/projects/${project.id}/`, payload)
      } else {
        await api.post('/projects/', payload)
      }
      onSaved?.()
      onClose?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not save this project.'))
    }
  }

  return (
    <Modal
      open={open}
      title={project ? `Edit ${project.name}` : 'New project'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save project'}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Project name
            </label>
            <input
              id="name"
              className="input"
              placeholder="Corporate Website Development"
              {...register('name', { required: 'Project name is required.' })}
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="client">
              Client
            </label>
            <select
              id="client"
              className="input"
              {...clientField}
              onChange={(event) => {
                clientField.onChange(event)
                const picked = findOptionById(clients, event.target.value)
                if (picked) fillFromClient(picked)
              }}
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client && <p className="field-error">{errors.client.message}</p>}
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
            <label className="label" htmlFor="budget">
              Budget (TZS)
            </label>
            <input
              id="budget"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className="input"
              {...register('budget', {
                required: 'Budget is required.',
                valueAsNumber: true,
                min: { value: 0, message: 'Budget cannot be negative.' },
              })}
            />
            {errors.budget && <p className="field-error">{errors.budget.message}</p>}
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

          <div className="sm:col-span-2">
            <label className="label" htmlFor="status">
              Status
            </label>
            <select id="status" className="input" {...register('status')}>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
