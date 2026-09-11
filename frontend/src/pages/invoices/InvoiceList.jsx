import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ListScreenToolbar from '../../components/ListScreenToolbar.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PrintHeader from '../../components/PrintHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import InvoiceForm from './InvoiceForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useList from '../../hooks/useList.js'
import useOptions from '../../hooks/useOptions.js'
import { exportRowsCsv } from '../../utils/listToolbar.js'
import { formatDate, formatMoney } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function InvoiceList() {
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const [status, setStatus] = useState('')
  const [client, setClient] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const list = useList('/invoices/', { filters: { status, client } })
  const { options: clients } = useOptions('/clients/')

  async function confirmDelete() {
    setBusy(true)
    setActionError('')
    try {
      await api.delete(`/invoices/${deleting.id}/`)
      setDeleting(null)
      list.refresh()
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Could not delete this invoice.'))
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'invoice_number',
      header: 'Invoice',
      render: (row) => (
        <div>
          <p className="text-emphasis">{row.invoice_number}</p>
          <p className="text-muted-xs">{formatDate(row.issue_date)}</p>
        </div>
      ),
    },
    {
      key: 'client_name',
      header: 'Client',
      render: (row) => (
        <div>
          <Link
            to={`/clients/${row.client}`}
            className="hover:text-brand-600"
            onClick={(event) => event.stopPropagation()}
          >
            {row.client_name}
          </Link>
          {row.project_name && <p className="text-muted-xs">{row.project_name}</p>}
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      align: 'right',
      render: (row) => formatMoney(row.total_amount),
    },
    {
      key: 'amount_paid',
      header: 'Paid',
      align: 'right',
      render: (row) => (
        <span className="text-emerald-600">{formatMoney(row.amount_paid)}</span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (row) => (
        <span className={Number(row.balance) > 0 ? 'font-medium text-red-600' : 'text-slate-400'}>
          {formatMoney(row.balance)}
        </span>
      ),
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
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge value={row.status} label={row.status_display} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      hideOnPrint: true,
      render: (row) =>
        canEdit ? (
          <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
              onClick={() => {
                setEditing(row)
                setFormOpen(true)
              }}
              aria-label={`Edit ${row.invoice_number}`}
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              onClick={() => setDeleting(row)}
              aria-label={`Delete ${row.invoice_number}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Everything billed to clients, and what is still owed."
      />

      <PrintHeader
        title="Invoice List"
        subtitle={`Status: ${
          STATUS_TABS.find((tab) => tab.value === status)?.label || 'All'
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
          statusTabs={STATUS_TABS}
          status={status}
          onStatusChange={setStatus}
          count={list.count}
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder="Search by number or client..."
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          filterContent={
            <div>
              <label className="label" htmlFor="filter-invoice-client">
                Client
              </label>
              <select
                id="filter-invoice-client"
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
              'invoices.csv',
              [
                { header: 'Invoice', key: 'invoice_number' },
                { header: 'Client', key: 'client_name' },
                { header: 'Total', key: 'total_amount' },
                { header: 'Paid', key: 'amount_paid' },
                { header: 'Balance', key: 'balance' },
                { header: 'Due', key: 'due_date' },
                { header: 'Status', key: 'status' },
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
          onRowClick={(row) => navigate(`/invoices/${row.id}`)}
          emptyMessage="No invoices match these filters."
        />
      </div>

      <InvoiceForm
        open={formOpen}
        invoice={editing}
        onClose={() => setFormOpen(false)}
        onSaved={list.refresh}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete invoice"
        message={
          deleting
            ? `Deleting ${deleting.invoice_number} also removes its payments. This cannot be undone.`
            : ''
        }
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
