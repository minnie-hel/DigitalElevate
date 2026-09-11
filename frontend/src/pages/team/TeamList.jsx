import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ListScreenToolbar from '../../components/ListScreenToolbar.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PrintHeader from '../../components/PrintHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, TrashIcon, ViewIcon } from '../../components/Icons.jsx'
import TeamForm from './TeamForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import useList from '../../hooks/useList.js'
import { exportRowsCsv } from '../../utils/listToolbar.js'
import { formatDate, initials } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
]

export default function TeamList() {
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const list = useList('/team-members/', { filters: { status } })

  async function confirmDelete() {
    setBusy(true)
    setActionError('')
    try {
      await api.delete(`/team-members/${deleting.id}/`)
      setDeleting(null)
      list.refresh()
    } catch (error) {
      setActionError(apiErrorMessage(error, 'Could not remove this team member.'))
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span
            className="no-print flex h-9 w-9 shrink-0 items-center justify-center rounded-full
              bg-brand-100 text-xs font-semibold text-brand-700"
          >
            {initials(row.name)}
          </span>
          <div>
            <p className="text-emphasis">{row.name}</p>
            <p className="text-muted-xs">{row.role || 'No title set'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => row.department || '-',
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <p>{row.email || '-'}</p>
          {row.phone && <p className="text-muted-xs">{row.phone}</p>}
        </div>
      ),
    },
    {
      key: 'joined_date',
      header: 'Joined',
      render: (row) => formatDate(row.joined_date),
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
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/team/${row.id}`)
            }}
            aria-label={`View ${row.name}`}
          >
            <ViewIcon className="h-4 w-4" />
          </button>
          {canEdit ? (
            <>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                onClick={(event) => {
                  event.stopPropagation()
                  setEditing(row)
                  setFormOpen(true)
                }}
                aria-label={`Edit ${row.name}`}
              >
                <EditIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                onClick={(event) => {
                  event.stopPropagation()
                  setDeleting(row)
                }}
                aria-label={`Remove ${row.name}`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Team Members" subtitle="The people delivering Elevate Digital's work." />

      <PrintHeader
        title="Team Member List"
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
          searchPlaceholder="Search by name, role or skill..."
          page={list.page}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          onExport={() =>
            exportRowsCsv(
              'team-members.csv',
              [
                { header: 'Name', key: 'name' },
                { header: 'Role', key: 'role' },
                { header: 'Department', key: 'department' },
                { header: 'Email', key: 'email' },
                { header: 'Phone', key: 'phone' },
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
          emptyMessage="No team members match your search."
          onRowClick={(row) => navigate(`/team/${row.id}`)}
        />
      </div>

      <TeamForm
        open={formOpen}
        member={editing}
        onClose={() => setFormOpen(false)}
        onSaved={list.refresh}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove team member"
        message={
          deleting
            ? `Remove ${deleting.name}? Their assigned tasks will become unassigned.`
            : ''
        }
        confirmLabel="Remove"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
