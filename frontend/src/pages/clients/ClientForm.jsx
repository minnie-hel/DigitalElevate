import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import api, { apiErrorMessage } from '../../services/api.js'

const EMPTY = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  industry: '',
  status: 'active',
  address: '',
  notes: '',
}

export default function ClientForm({ open, client, onClose, onSaved }) {
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY })

  // Reload the form whenever a different client is opened for editing.
  useEffect(() => {
    if (!open) return
    setError('')
    reset(
      client
        ? {
            name: client.name || '',
            contact_person: client.contact_person || '',
            email: client.email || '',
            phone: client.phone || '',
            industry: client.industry || '',
            status: client.status || 'active',
            address: client.address || '',
            notes: client.notes || '',
          }
        : EMPTY,
    )
  }, [open, client, reset])

  async function onSubmit(values) {
    setError('')
    try {
      if (client?.id) {
        await api.patch(`/clients/${client.id}/`, values)
      } else {
        await api.post('/clients/', values)
      }
      onSaved?.()
      onClose?.()
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not save this client.'))
    }
  }

  return (
    <Modal
      open={open}
      title={client ? `Edit ${client.name}` : 'New client'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="client-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save client'}
          </button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Company name
            </label>
            <input
              id="name"
              className="input"
              placeholder="ABC Tanzania Ltd"
              {...register('name', { required: 'Company name is required.' })}
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="contact_person">
              Contact person
            </label>
            <input id="contact_person" className="input" {...register('contact_person')} />
          </div>

          <div>
            <label className="label" htmlFor="industry">
              Industry
            </label>
            <input
              id="industry"
              className="input"
              placeholder="Manufacturing"
              {...register('industry')}
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
            <input
              id="phone"
              className="input"
              placeholder="+255 712 345 678"
              {...register('phone')}
            />
          </div>

          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select id="status" className="input" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">
              Address
            </label>
            <textarea id="address" rows={2} className="input" {...register('address')} />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea id="notes" rows={3} className="input" {...register('notes')} />
          </div>
        </div>
      </form>
    </Modal>
  )
}
