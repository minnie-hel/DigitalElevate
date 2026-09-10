import { useState } from 'react'
import { Link } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ListScreenToolbar from '../../components/ListScreenToolbar.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PrintHeader from '../../components/PrintHeader.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import PaymentForm from './PaymentForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useList from '../../hooks/useList.js'
import useOptions from '../../hooks/useOptions.js'
import { exportRowsCsv } from '../../utils/listToolbar.js'
import { formatDate, formatMoney } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

// Payments have no status of their own, so the tab strip groups by the method
// the money arrived through instead.
const METHOD_TABS = [
  { value: '', label: 'All' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

export default function PaymentList() {
  const { canEdit } = useAuth()
  const [method, setMethod] = useState('')
  const [client, setClient] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const list = useList('/payments/', { filters: { payment_method: method, client } })
  const { options: clients } = useOptions('/clients/')

  // The current page's total, which is what the user can actually see.
  const pageTotal = list.rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)

  async function confirmDelete() {
    setBusy(true)
    setActionError('')
    try {
      await api.delete(`/payments/${deleting.id}/`)
      setDeleting(null)
      list.refresh()
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Could not delete this payment.'))
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'payment_date',
      header: 'Date',
      render: (row) => formatDate(row.payment_date),
    },
    {
      key: 'invoice_number',
      header: 'Invoice',
      render: (row) => (
        <Link
          to={`/invoices/${row.invoice}`}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          {row.invoice_number}
        </Link>
      ),
    },
    {
      key: 'client_name',
      header: 'Client',
      render: (row) => (
        <Link to={`/clients/${row.client_id}`} className="hover:text-brand-600">
          {row.client_name}
        </Link>
      ),
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
      hideOnPrint: true,
      render: (row) =>
        canEdit ? (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
              onClick={() => {
                setEditing(row)
                setFormOpen(true)
              }}
              aria-label="Edit payment"
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              onClick={() => setDeleting(row)}
              aria-label="Delete payment"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader title="Payments" subtitle="Money received against invoices." />

      <PrintHeader
        title="Payment List"
        subtitle={`Method: ${
          METHOD_TABS.find((tab) => tab.value === method)?.label || 'All'
        }${
          client
            ? ` · Client: ${clients.find((c) => String(c.id) === String(client))?.name || ''}`
            : ''
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
          statusTabs={METHOD_TABS}
          status={method}
          onStatusChange={setMethod}
          count={list.count}
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder="Search by reference, invoice or client..."
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          filterContent={
            <div>
              <label className="label" htmlFor="filter-payment-client">
                Client
              </label>
              <select
                id="filter-payment-client"
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
          }
          onExport={() =>
            exportRowsCsv(
              'payments.csv',
              [
                { header: 'Date', key: 'payment_date' },
                { header: 'Invoice', key: 'invoice_number' },
                { header: 'Client', key: 'client_name' },
                { header: 'Method', key: 'method_display' },
                { header: 'Reference', key: 'reference' },
                { header: 'Amount', key: 'amount' },
              ],
              list.rows,
            )
          }
          addLabel="Add New"
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
          emptyMessage="No payments match these filters."
        />

        {list.rows.length > 0 && (
          <div className="flex justify-end border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Total on this page:{' '}
              <span className="font-semibold text-slate-800">{formatMoney(pageTotal)}</span>
            </span>
          </div>
        )}
      </div>

      <PaymentForm
        open={formOpen}
        payment={editing}
        onClose={() => setFormOpen(false)}
        onSaved={list.refresh}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete payment"
        message={
          deleting
            ? `Remove the payment of ${formatMoney(deleting.amount)} on ${deleting.invoice_number}? The invoice status will be recalculated.`
            : ''
        }
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
