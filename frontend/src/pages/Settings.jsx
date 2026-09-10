import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import Alert from '../components/Alert.jsx'
import PageHeader from '../components/PageHeader.jsx'
import api, { apiErrorMessage } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { humanise } from '../utils/format.js'

export default function Settings() {
  const { user } = useAuth()
  const [profileMessage, setProfileMessage] = useState(null)
  const [passwordMessage, setPasswordMessage] = useState(null)

  const profileForm = useForm({
    defaultValues: { first_name: '', last_name: '', email: '' },
  })
  const passwordForm = useForm({
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  useEffect(() => {
    if (!user) return
    profileForm.reset({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    })
  }, [user, profileForm])

  async function saveProfile(values) {
    setProfileMessage(null)
    try {
      await api.patch('/auth/me/', values)
      setProfileMessage({ tone: 'success', text: 'Your details have been saved.' })
    } catch (error) {
      setProfileMessage({ tone: 'error', text: apiErrorMessage(error, 'Could not save.') })
    }
  }

  async function changePassword(values) {
    setPasswordMessage(null)
    if (values.new_password !== values.confirm_password) {
      setPasswordMessage({ tone: 'error', text: 'The new passwords do not match.' })
      return
    }
    try {
      await api.post('/auth/change-password/', {
        current_password: values.current_password,
        new_password: values.new_password,
      })
      passwordForm.reset({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordMessage({ tone: 'success', text: 'Your password has been changed.' })
    } catch (error) {
      setPasswordMessage({
        tone: 'error',
        text: apiErrorMessage(error, 'Could not change your password.'),
      })
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Your account details and password." />

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        <p className="mt-1 text-xs text-slate-500">
          Signed in as {user?.email} · role {humanise(user?.role)}
        </p>

        <form
          onSubmit={profileForm.handleSubmit(saveProfile)}
          className="mt-4 space-y-4"
          noValidate
        >
          {profileMessage && <Alert tone={profileMessage.tone}>{profileMessage.text}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="first_name">
                First name
              </label>
              <input id="first_name" className="input" {...profileForm.register('first_name')} />
            </div>
            <div>
              <label className="label" htmlFor="last_name">
                Last name
              </label>
              <input id="last_name" className="input" {...profileForm.register('last_name')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                {...profileForm.register('email', {
                  required: 'Email is required.',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
                })}
              />
              {profileForm.formState.errors.email && (
                <p className="field-error">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={profileForm.formState.isSubmitting}
          >
            {profileForm.formState.isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Change password</h2>

        <form
          onSubmit={passwordForm.handleSubmit(changePassword)}
          className="mt-4 space-y-4"
          noValidate
        >
          {passwordMessage && <Alert tone={passwordMessage.tone}>{passwordMessage.text}</Alert>}

          <div>
            <label className="label" htmlFor="current_password">
              Current password
            </label>
            <input
              id="current_password"
              type="password"
              autoComplete="current-password"
              className="input"
              {...passwordForm.register('current_password', {
                required: 'Enter your current password.',
              })}
            />
            {passwordForm.formState.errors.current_password && (
              <p className="field-error">
                {passwordForm.formState.errors.current_password.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="new_password">
                New password
              </label>
              <input
                id="new_password"
                type="password"
                autoComplete="new-password"
                className="input"
                {...passwordForm.register('new_password', {
                  required: 'Enter a new password.',
                  minLength: { value: 8, message: 'Use at least 8 characters.' },
                })}
              />
              {passwordForm.formState.errors.new_password && (
                <p className="field-error">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="confirm_password">
                Confirm new password
              </label>
              <input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                className="input"
                {...passwordForm.register('confirm_password', {
                  required: 'Confirm your new password.',
                })}
              />
              {passwordForm.formState.errors.confirm_password && (
                <p className="field-error">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={passwordForm.formState.isSubmitting}
          >
            {passwordForm.formState.isSubmitting ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  )
}
