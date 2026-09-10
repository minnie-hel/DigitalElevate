import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useOptions from '../../hooks/useOptions.js'
import useRelatedAutofill from '../../hooks/useRelatedAutofill.js'
import { findOptionById } from '../../utils/options.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function PaymentForm({ open, payment, invoice, onClose, onSaved }) {
  const [error, setError] = useState('')

  const { options: invoices } = useOptions('/invoices/', {
    enabled: open && !invoice,
    params: { unpaid: true },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      invoice: '',
      amount: '',
      payment_date: today(),
      payment_method: 'bank',
      reference: '',
      notes: '',
    },
  })

  const invoiceId = watch('invoice')
  const invoiceField = register('invoice', { required: 'Choose an invoice.' })

  function fillFromInvoice(picked) {
    if (payment?.id) return
    setValue('amount', picked.balance ?? '')
    setValue('reference', picked.invoice_number || '')
    setValue('payment_date', today())
    setValue(
      'notes',
      picked.client_name ? `Payment for ${picked.client_name} — ${picked.invoice_number}` : '',
    )
  }

  const applyInvoice = useCallback(
    (picked) => fillFromInvoice(picked),
    [payment?.id, setValue],
  )

  useRelatedAutofill({
    skip: Boolean(payment?.id) || Boolean(invoice),
    sourceId: invoice ? invoice.id : invoiceId,
    options: invoice ? [invoice] : invoices,
    apply: applyInvoice,
  })

  useEffect(() => {
    if (!open) return
    setError('')
    const fixed = invoice
    reset({
      invoice: payment?.invoice || fixed?.id || '',
      amount: payment?.amount ?? (fixed ? fixed.balance : ''),
      payment_date: payment?.payment_date || today(),
      payment_method: payment?.payment_method || 'bank',
      reference: payment?.reference || fixed?.invoice_number || '',
      notes:
        payment?.notes ||
        (fixed ? `Payment for ${fixed.client_name} — ${fixed.invoice_number}` : ''),
    })
    if (fixed && !payment?.id) fillFromInvoice(fixed)
  }, [open, payment, invoice, reset])

  function onInvoiceChange(event) {
    const picked = findOptionById(invoices, event.target.value)
    if (picked) fillFromInvoice(picked)
  }

  async function onSubmit(values) {
    setError('')
    const payload = {
      invoice: Number(values.invoice),
      amount: values.amount,
      payment_date: values.payment_date || null,
      payment_method: values.payment_method,
      reference: values.reference,
      notes: values.notes,
    }

    try {
      if (payment?.id) {
        await api.patch(`/payments/${payment.id}/`, payload)
      } else {
        await api.post('/payments/', payload)
      }
      onSaved?.()
      onClose?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not record this payment.'))
    }
  }

  return (
    <Modal
      open={open}
      title={payment ? 'Edit payment' : 'Record a payment'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="payment-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save payment'}
          </button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        {invoice ? (
          <input type="hidden" {...register('invoice', { required: true })} />
        ) : (
          <div>
            <label className="label" htmlFor="invoice">
              Invoice
            </label>
            <select
              id="invoice"
              className="input"
              {...invoiceField}
              onChange={(event) => {
                invoiceField.onChange(event)
                onInvoiceChange(event)
              }}
            >
              <option value="">Select an invoice...</option>
              {invoices.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.invoice_number} — {option.client_name}
                </option>
              ))}
            </select>
            {errors.invoice && <p className="field-error">{errors.invoice.message}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="amount">
              Amount (TZS)
            </label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className="input"
              {...register('amount', {
                required: 'Amount is required.',
                valueAsNumber: true,
                min: { value: 0.01, message: 'Amount must be greater than zero.' },
              })}
            />
            {errors.amount && <p className="field-error">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="payment_date">
              Payment date
            </label>
            <input
              id="payment_date"
              type="date"
              className="input"
              {...register('payment_date', { required: 'Payment date is required.' })}
            />
            {errors.payment_date && <p className="field-error">{errors.payment_date.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="payment_method">
              Method
            </label>
            <select id="payment_method" className="input" {...register('payment_method')}>
              <option value="bank">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="reference">
              Reference
            </label>
            <input
              id="reference"
              className="input"
              placeholder="Transaction ID or receipt no."
              {...register('reference')}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea id="notes" rows={2} className="input" {...register('notes')} />
          </div>
        </div>
      </form>
    </Modal>
  )
}
