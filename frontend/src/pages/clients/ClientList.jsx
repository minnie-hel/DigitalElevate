import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ListScreenToolbar from '../../components/ListScreenToolbar.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PrintHeader from '../../components/PrintHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import ClientForm from './ClientForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useList from '../../hooks/useList.js'
import { exportRowsCsv } from '../../utils/listToolbar.js'
import { formatMoney } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'inactive', label: 'Inactive' },
]

export default function ClientList() {
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const list = useList('/clients/', { filters: { status } })

  async function confirmDelete() {
    setBusy(true)
    setActionError('')
    try {
      await api.delete(`/clients/${deleting.id}/`)
      setDeleting(null)
      list.refresh()
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Could not delete this client.'))
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.industry && <p className="text-xs text-slate-500">{row.industry}</p>}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <p>{row.contact_person || '-'}</p>
          <p className="text-xs text-slate-500">{row.email || row.phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      render: (row) => (
        <span>
          {row.active_projects} active
          <span className="text-slate-400"> / {row.total_projects}</span>
        </span>
      ),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      render: (row) => (
        <span className={Number(row.outstanding) > 0 ? 'font-medium text-red-600' : ''}>
          {formatMoney(row.outstanding)}
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
              onClick={() => {
                setEditing(row)
                setFormOpen(true)
              }}
              aria-label={`Edit ${row.name}`}
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              onClick={() => setDeleting(row)}
              aria-label={`Delete ${row.name}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader title="Clients" subtitle="Every company Elevate Digital works with." />

      <PrintHeader
        title="Client List"
        subtitle={`Status: ${
          STATUS_TABS.find((tab) => tab.value === status)?.label || 'All'
        }${list.search ? ` · Search: "${list.search}"` : ''} · ${list.count} record(s)`}
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
          searchPlaceholder="Search by name, contact or email..."
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          onExport={() =>
            exportRowsCsv(
              'clients.csv',
              [
                { header: 'Company', key: 'name' },
                { header: 'Contact', key: 'contact_person' },
                { header: 'Email', key: 'email' },
                { header: 'Phone', key: 'phone' },
                { header: 'Industry', key: 'industry' },
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
          onRowClick={(row) => navigate(`/clients/${row.id}`)}
          emptyMessage="No clients match your search yet."
        />
      </div>

      <ClientForm
        open={formOpen}
        client={editing}
        onClose={() => setFormOpen(false)}
        onSaved={list.refresh}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete client"
        message={
          deleting
            ? `Deleting ${deleting.name} also removes its projects, tasks, invoices and payments. This cannot be undone.`
            : ''
        }
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
