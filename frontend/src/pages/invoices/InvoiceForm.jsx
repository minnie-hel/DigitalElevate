import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import { PlusIcon, TrashIcon } from '../../components/Icons.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useOptions from '../../hooks/useOptions.js'
import useRelatedAutofill from '../../hooks/useRelatedAutofill.js'
import { formatMoney } from '../../utils/format.js'
import { findOptionById } from '../../utils/options.js'

const BLANK_ITEM = { description: '', quantity: '1', unit_price: '0' }

function today() {
  return new Date().toISOString().slice(0, 10)
}

function inThirtyDays() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

export default function InvoiceForm({ open, invoice, onClose, onSaved }) {
  const [error, setError] = useState('')
  const { options: clients } = useOptions('/clients/', { enabled: open })

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      client: '',
      project: '',
      issue_date: today(),
      due_date: inThirtyDays(),
      tax_rate: '18',
      status: 'draft',
      notes: '',
      items: [BLANK_ITEM],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Watch the values that feed the running total and the project dropdown.
  const watched = useWatch({ control, name: ['items', 'tax_rate', 'client'] })
  const [items, taxRate, selectedClient] = watched || []

  const { options: projects } = useOptions('/projects/', {
    enabled: open && Boolean(selectedClient),
    params: { client: selectedClient },
  })

  const clientField = register('client', { required: 'Choose a client.' })
  const projectField = register('project')
  const projectId = watch('project')

  const fillFromClient = useCallback(
    (picked) => {
      if (invoice?.id) return
      setValue('project', '')
      if (picked.notes) setValue('notes', picked.notes)
    },
    [invoice?.id, setValue],
  )

  const fillFromProject = useCallback(
    (picked) => {
      if (invoice?.id) return
      if (picked.start_date) setValue('issue_date', picked.start_date)
      if (picked.due_date) setValue('due_date', picked.due_date)
      if (picked.description) setValue('notes', picked.description)
      if (picked.budget && Number(picked.budget) > 0) {
        setValue('items.0.description', `Services — ${picked.name}`)
        setValue('items.0.quantity', '1')
        setValue('items.0.unit_price', picked.budget)
      }
    },
    [invoice?.id, setValue],
  )

  useRelatedAutofill({
    skip: Boolean(invoice?.id),
    sourceId: selectedClient,
    options: clients,
    apply: fillFromClient,
  })

  useRelatedAutofill({
    skip: Boolean(invoice?.id) || !selectedClient,
    sourceId: projectId,
    options: projects,
    apply: fillFromProject,
  })

  useEffect(() => {
    if (!open) return
    setError('')
    reset(
      invoice
        ? {
            client: invoice.client || '',
            project: invoice.project || '',
            issue_date: invoice.issue_date || today(),
            due_date: invoice.due_date || inThirtyDays(),
            tax_rate: invoice.tax_rate ?? '18',
            status: invoice.status || 'draft',
            notes: invoice.notes || '',
            items: invoice.items?.length
              ? invoice.items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                }))
              : [BLANK_ITEM],
          }
        : {
            client: '',
            project: '',
            issue_date: today(),
            due_date: inThirtyDays(),
            tax_rate: '18',
            status: 'draft',
            notes: '',
            items: [BLANK_ITEM],
          },
    )
  }, [open, invoice, reset])

  // Mirror the server's arithmetic so the user sees the total before saving.
  const totals = useMemo(() => {
    const subtotal = (items || []).reduce((sum, item) => {
      const quantity = Number(item?.quantity) || 0
      const price = Number(item?.unit_price) || 0
      return sum + quantity * price
    }, 0)
    const tax = subtotal * ((Number(taxRate) || 0) / 100)
    return { subtotal, tax, total: subtotal + tax }
  }, [items, taxRate])

  async function onSubmit(values) {
    setError('')
    const payload = {
      client: Number(values.client),
      project: values.project ? Number(values.project) : null,
      issue_date: values.issue_date || null,
      due_date: values.due_date || null,
      tax_rate: values.tax_rate || '0',
      status: values.status,
      notes: values.notes,
      items: values.items
        .filter((item) => item.description?.trim())
        .map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity || '1',
          unit_price: item.unit_price || '0',
        })),
    }

    if (payload.items.length === 0) {
      setError('Add at least one line item.')
      return
    }

    try {
      if (invoice?.id) {
        await api.patch(`/invoices/${invoice.id}/`, payload)
      } else {
        await api.post('/invoices/', payload)
      }
      onSaved?.()
      onClose?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not save this invoice.'))
    }
  }

  return (
    <Modal
      open={open}
      title={invoice ? `Edit ${invoice.invoice_number}` : 'New invoice'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="invoice-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save invoice'}
          </button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
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
            <label className="label" htmlFor="project">
              Project (optional)
            </label>
            <select
              id="project"
              className="input"
              disabled={!selectedClient}
              {...projectField}
              onChange={(event) => {
                projectField.onChange(event)
                const picked = findOptionById(projects, event.target.value)
                if (picked) fillFromProject(picked)
              }}
            >
              <option value="">Not tied to a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="issue_date">
              Issue date
            </label>
            <input
              id="issue_date"
              type="date"
              className="input"
              {...register('issue_date', { required: 'Issue date is required.' })}
            />
            {errors.issue_date && <p className="field-error">{errors.issue_date.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="due_date">
              Due date
            </label>
            <input id="due_date" type="date" className="input" {...register('due_date')} />
          </div>

          <div>
            <label className="label" htmlFor="tax_rate">
              Tax rate (%)
            </label>
            <input
              id="tax_rate"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className="input"
              {...register('tax_rate', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select id="status" className="input" {...register('status')}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <p className="mt-1 text-muted-xs">
              Paid and overdue are set automatically from payments and dates.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title">Line items</h3>
            <button
              type="button"
              className="btn-secondary px-2 py-1 text-xs"
              onClick={() => append(BLANK_ITEM)}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add line
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const quantity = Number(items?.[index]?.quantity) || 0
              const price = Number(items?.[index]?.unit_price) || 0

              return (
                <div key={field.id} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                  <div className="min-w-[180px] flex-1">
                    <input
                      className="input"
                      placeholder="Description"
                      {...register(`items.${index}.description`)}
                    />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className="input w-20"
                    placeholder="Qty"
                    aria-label="Quantity"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className="input w-36"
                    placeholder="Unit price"
                    aria-label="Unit price"
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                  />
                  <span className="w-32 shrink-0 py-2 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    {formatMoney(quantity * price, { withCurrency: false })}
                  </span>
                  <button
                    type="button"
                    className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400
                      disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove line ${index + 1}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Tax ({Number(taxRate) || 0}%)</dt>
              <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(totals.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 font-semibold">
              <dt className="text-slate-700 dark:text-slate-300">Total</dt>
              <dd className="tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea id="notes" rows={2} className="input" {...register('notes')} />
        </div>
      </form>
    </Modal>
  )
}
