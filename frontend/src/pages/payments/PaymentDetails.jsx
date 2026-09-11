import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DetailFields from '../../components/DetailFields.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Spinner from '../../components/Spinner.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import PaymentForm from './PaymentForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import { formatDate, formatMoney, timeAgo } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function PaymentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()

  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/payments/${id}/`)
      setPayment(data)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not load this payment.'))
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
      await api.delete(`/payments/${id}/`)
      navigate('/payments')
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not delete this payment.'))
    } finally {
      setBusy(false)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading payment..." />
      </div>
    )
  }

  if (error && !payment) return <Alert tone="error">{error}</Alert>
  if (!payment) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/payments')}
        className="mb-4 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        &larr; Back to payments
      </button>

      <PageHeader
        title={formatMoney(payment.amount)}
        subtitle={
          <>
            Received {formatDate(payment.payment_date)} ·{' '}
            <Link to={`/invoices/${payment.invoice}`} className="hover:text-brand-600">
              {payment.invoice_number}
            </Link>
          </>
        }
        actions={
          canEdit && (
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
          )
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <section className="card p-6">
        <h2 className="section-title mb-4">
          Payment details
        </h2>

        <DetailFields
          items={[
            {
              label: 'Client',
              value: (
                <Link to={`/clients/${payment.client_id}`} className="text-brand-600 hover:text-brand-700">
                  {payment.client_name}
                </Link>
              ),
            },
            {
              label: 'Invoice',
              value: (
                <Link to={`/invoices/${payment.invoice}`} className="text-brand-600 hover:text-brand-700">
                  {payment.invoice_number}
                </Link>
              ),
            },
            {
              label: 'Invoice total',
              value: formatMoney(payment.invoice_total),
            },
            {
              label: 'Invoice balance after',
              value: formatMoney(payment.invoice_balance),
            },
            { label: 'Amount', value: formatMoney(payment.amount) },
            { label: 'Payment date', value: formatDate(payment.payment_date) },
            { label: 'Method', value: payment.method_display },
            { label: 'Reference', value: payment.reference || '—' },
            {
              label: 'Notes',
              fullWidth: true,
              value: payment.notes ? (
                <span className="whitespace-pre-wrap">{payment.notes}</span>
              ) : (
                '—'
              ),
            },
            { label: 'Recorded', value: timeAgo(payment.created_at) },
            { label: 'Last updated', value: timeAgo(payment.updated_at) },
          ]}
        />
      </section>

      <PaymentForm
        open={formOpen}
        payment={payment}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={deleting}
        title="Delete payment"
        message="Remove this payment record? The invoice balance will be recalculated."
        busy={busy}
        onCancel={() => setDeleting(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
