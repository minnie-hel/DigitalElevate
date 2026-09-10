import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import api, { apiErrorMessage } from '../../services/api.js'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  skills: '',
  status: 'active',
  joined_date: '',
}

export default function TeamForm({ open, member, onClose, onSaved }) {
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    setError('')
    reset(
      member
        ? {
            name: member.name || '',
            email: member.email || '',
            phone: member.phone || '',
            role: member.role || '',
            department: member.department || '',
            skills: member.skills || '',
            status: member.status || 'active',
            joined_date: member.joined_date || '',
          }
        : EMPTY,
    )
  }, [open, member, reset])

  async function onSubmit(values) {
    setError('')
    const payload = { ...values, joined_date: values.joined_date || null }

    try {
      if (member?.id) {
        await api.patch(`/team-members/${member.id}/`, payload)
      } else {
        await api.post('/team-members/', payload)
      }
      onSaved?.()
      onClose?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not save this team member.'))
    }
  }

  return (
    <Modal
      open={open}
      title={member ? `Edit ${member.name}` : 'New team member'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="team-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save member'}
          </button>
        </>
      }
    >
      <form id="team-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              className="input"
              {...register('name', { required: 'Name is required.' })}
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="role">
              Job title
            </label>
            <input
              id="role"
              className="input"
              placeholder="Software Developer"
              {...register('role')}
            />
          </div>

          <div>
            <label className="label" htmlFor="department">
              Department
            </label>
            <input
              id="department"
              className="input"
              placeholder="Engineering"
              {...register('department')}
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              {...register('email', {
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
              })}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input id="phone" className="input" {...register('phone')} />
          </div>

          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select id="status" className="input" {...register('status')}>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="joined_date">
              Joined date
            </label>
            <input id="joined_date" type="date" className="input" {...register('joined_date')} />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="skills">
              Skills
            </label>
            <input
              id="skills"
              className="input"
              placeholder="React, Django, PostgreSQL"
              {...register('skills')}
            />
            <p className="mt-1 text-xs text-slate-400">Separate skills with commas.</p>
          </div>
        </div>
      </form>
    </Modal>
  )
}
