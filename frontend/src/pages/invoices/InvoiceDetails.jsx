import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Spinner from '../../components/Spinner.jsx'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, PlusIcon, SendIcon, TrashIcon } from '../../components/Icons.jsx'
import InvoiceForm from './InvoiceForm.jsx'
import PaymentForm from '../payments/PaymentForm.jsx'
import api, { apiErrorMessage, unwrapList } from '../../services/api.js'
import { formatDate, formatMoney } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function InvoiceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()

  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [deletingPayment, setDeletingPayment] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [invoiceResponse, paymentsResponse] = await Promise.all([
        api.get(`/invoices/${id}/`),
        api.get('/payments/', { params: { invoice: id, page_size: 100 } }),
      ])
      setInvoice(invoiceResponse.data)
      setPayments(unwrapList(paymentsResponse.data).results)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not load this invoice.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function sendInvoice() {
    setError('')
    try {
      await api.post(`/invoices/${id}/send/`)
      load()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not send this invoice.'))
    }
  }

  async function confirmDeletePayment() {
    setBusy(true)
    try {
      await api.delete(`/payments/${deletingPayment.id}/`)
      setDeletingPayment(null)
      load()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not delete this payment.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading invoice..." />
      </div>
    )
  }

  if (error && !invoice) return <Alert tone="error">{error}</Alert>
  if (!invoice) return null

  const settled = Number(invoice.balance) <= 0
  const canReceivePayment =
    canEdit && !settled && !['draft', 'cancelled'].includes(invoice.status)

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/invoices')}
        className="mb-4 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        &larr; Back to invoices
      </button>

      <PageHeader
        title={invoice.invoice_number}
        subtitle={
          <Link to={`/clients/${invoice.client}`} className="hover:text-brand-600">
            {invoice.client_name}
          </Link>
        }
        actions={
          <>
            <StatusBadge value={invoice.status} label={invoice.status_display} />
            {canEdit && invoice.status === 'draft' && (
              <button type="button" className="btn-secondary" onClick={sendInvoice}>
                <SendIcon className="h-4 w-4" />
                Mark as sent
              </button>
            )}
            {canReceivePayment && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditingPayment(null)
                  setPaymentFormOpen(true)
                }}
              >
                <PlusIcon className="h-4 w-4" />
                Record payment
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setInvoiceFormOpen(true)}
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
        <StatCard label="Invoice total" value={formatMoney(invoice.total_amount)} />
        <StatCard label="Paid" value={formatMoney(invoice.amount_paid)} tone="positive" />
        <StatCard
          label="Remaining"
          value={formatMoney(invoice.balance)}
          tone={settled ? 'positive' : 'danger'}
        />
        <StatCard
          label="Due date"
          value={formatDate(invoice.due_date)}
          hint={invoice.is_overdue ? 'Past due' : `Issued ${formatDate(invoice.issue_date)}`}
          tone={invoice.is_overdue ? 'danger' : 'default'}
        />
      </div>

      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">Bill to</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{invoice.client_name}</p>
            {invoice.project_name && (
              <p className="text-sm text-muted">Project: {invoice.project_name}</p>
            )}
          </div>
          <dl className="text-sm">
            <div className="flex gap-4">
              <dt className="text-muted">Issued</dt>
              <dd className="text-slate-700 dark:text-slate-300">{formatDate(invoice.issue_date)}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-muted">Due</dt>
              <dd className="text-slate-700 dark:text-slate-300">{formatDate(invoice.due_date)}</dd>
            </div>
          </dl>
        </div>

        <div className="table-wrap mt-5">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="surface-subtle">
              <tr>
                <th className="th">Description</th>
                <th className="th text-right">Qty</th>
                <th className="th text-right">Unit price</th>
                <th className="th text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="td">{item.description}</td>
                  <td className="td text-right tabular-nums">{Number(item.quantity)}</td>
                  <td className="td text-right tabular-nums">
                    {formatMoney(item.unit_price, { withCurrency: false })}
                  </td>
                  <td className="td text-right tabular-nums">
                    {formatMoney(item.line_total, { withCurrency: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums text-slate-700 dark:text-slate-300">
              {formatMoney(invoice.subtotal_amount)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tax ({Number(invoice.tax_rate)}%)</dt>
            <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(invoice.tax_amount)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 font-semibold">
            <dt className="text-slate-700 dark:text-slate-300">Total</dt>
            <dd className="tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(invoice.total_amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Paid</dt>
            <dd className="tabular-nums text-emerald-600">
              -{formatMoney(invoice.amount_paid, { withCurrency: false })}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 font-semibold">
            <dt className="text-slate-700 dark:text-slate-300">Balance due</dt>
            <dd className={`tabular-nums ${settled ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatMoney(invoice.balance)}
            </dd>
          </div>
        </dl>

        {invoice.notes && (
          <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-muted dark:border-slate-700">
            {invoice.notes}
          </p>
        )}
      </section>

      <section className="card mt-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
          <h2 className="section-title">Payments</h2>
          {canReceivePayment && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingPayment(null)
                setPaymentFormOpen(true)
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Record payment
            </button>
          )}
        </div>

        <DataTable
          rows={payments}
          emptyMessage="No payments received against this invoice yet."
          columns={[
            {
              key: 'payment_date',
              header: 'Date',
              render: (row) => formatDate(row.payment_date),
            },
            { key: 'method_display', header: 'Method' },
            { key: 'reference', header: 'Reference', render: (row) => row.reference || '-' },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              render: (row) => (
                <span className="font-medium text-emerald-600">{formatMoney(row.amount)}</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) =>
                canEdit ? (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                      onClick={() => {
                        setEditingPayment(row)
                        setPaymentFormOpen(true)
                      }}
                      aria-label="Edit payment"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      onClick={() => setDeletingPayment(row)}
                      aria-label="Delete payment"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : null,
            },
          ]}
        />
      </section>

      <InvoiceForm
        open={invoiceFormOpen}
        invoice={invoice}
        onClose={() => setInvoiceFormOpen(false)}
        onSaved={load}
      />

      <PaymentForm
        open={paymentFormOpen}
        payment={editingPayment}
        invoice={invoice}
        onClose={() => setPaymentFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deletingPayment)}
        title="Delete payment"
        message={
          deletingPayment
            ? `Remove the payment of ${formatMoney(deletingPayment.amount)}? The invoice status will be recalculated.`
            : ''
        }
        busy={busy}
        onCancel={() => setDeletingPayment(null)}
        onConfirm={confirmDeletePayment}
      />
    </div>
  )
}
