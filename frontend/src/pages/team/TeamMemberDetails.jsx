import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DetailFields from '../../components/DetailFields.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Spinner from '../../components/Spinner.jsx'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EditIcon, TrashIcon } from '../../components/Icons.jsx'
import TeamForm from './TeamForm.jsx'
import api, { apiErrorMessage } from '../../services/api.js'
import { formatDate, initials, timeAgo } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function TeamMemberDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()

  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/team-members/${id}/`)
      setMember(data)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not load this team member.'))
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
      await api.delete(`/team-members/${id}/`)
      navigate('/team')
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not remove this team member.'))
    } finally {
      setBusy(false)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading team member..." />
      </div>
    )
  }

  if (error && !member) return <Alert tone="error">{error}</Alert>
  if (!member) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/team')}
        className="mb-4 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        &larr; Back to team
      </button>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
            >
              {initials(member.name)}
            </span>
            {member.name}
          </span>
        }
        subtitle={[member.role, member.department].filter(Boolean).join(' · ') || 'Team member'}
        actions={
          <>
            <StatusBadge value={member.status} label={member.status_display} />
            {canEdit && (
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
                  Remove
                </button>
              </>
            )}
          </>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Open tasks" value={member.open_task_count ?? 0} />
        <StatCard label="Completed tasks" value={member.completed_task_count ?? 0} />
      </div>

      <section className="card p-6">
        <h2 className="section-title mb-4">
          Contact & profile
        </h2>

        <DetailFields
          items={[
            { label: 'Email', value: member.email || member.user_email || '—' },
            { label: 'Phone', value: member.phone || '—' },
            { label: 'Role', value: member.role || '—' },
            { label: 'Department', value: member.department || '—' },
            {
              label: 'Skills',
              fullWidth: true,
              value:
                member.skill_list?.length > 0 ? member.skill_list.join(', ') : member.skills || '—',
            },
            { label: 'Joined', value: formatDate(member.joined_date) },
            { label: 'Status', value: member.status_display },
            { label: 'Added to system', value: timeAgo(member.created_at) },
            { label: 'Last updated', value: timeAgo(member.updated_at) },
          ]}
        />
      </section>

      <TeamForm open={formOpen} member={member} onClose={() => setFormOpen(false)} onSaved={load} />

      <ConfirmDialog
        open={deleting}
        title="Remove team member"
        message={`Remove ${member.name} from the team? Their user account is not deleted.`}
        busy={busy}
        onCancel={() => setDeleting(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
