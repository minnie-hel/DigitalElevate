import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import Alert from '../components/Alert.jsx'
import Logo from '../components/Logo.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import Spinner from '../components/Spinner.jsx'
import { MoonIcon, SunIcon } from '../components/Icons.jsx'
import api, { apiErrorMessage } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const { isDark, toggleMode } = useTheme()
  const [checkingSetup, setCheckingSetup] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [error, setError] = useState('')

  const signInForm = useForm({ defaultValues: { email: '', password: '' } })
  const setupForm = useForm({
    defaultValues: { email: '', password: '', first_name: '', last_name: '' },
  })

  useEffect(() => {
    let cancelled = false

    async function loadSetupState() {
      try {
        const { data } = await api.get('/auth/setup/')
        if (!cancelled) setNeedsSetup(Boolean(data.needs_setup))
      } catch {
        if (!cancelled) setError('Could not reach the API. Is the backend running?')
      } finally {
        if (!cancelled) setCheckingSetup(false)
      }
    }

    loadSetupState()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSignIn(values) {
    setError('')
    const result = await login(values.email.trim(), values.password)
    if (!result.ok) setError(result.error)
  }

  async function onSetup(values) {
    setError('')
    try {
      await api.post('/auth/setup/', {
        email: values.email.trim(),
        password: values.password,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
      })
      const result = await login(values.email.trim(), values.password)
      if (!result.ok) {
        setNeedsSetup(false)
        setError('Account created. Sign in with the password you chose.')
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not create the administrator account.'))
    }
  }

  const busy = signInForm.formState.isSubmitting || setupForm.formState.isSubmitting

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 dark:bg-slate-950">
      <button
        type="button"
        onClick={toggleMode}
        className="absolute right-4 top-4 rounded-lg p-2 text-slate-300 hover:bg-slate-800
          hover:text-white"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <Logo className="mx-auto w-60 max-w-full" />

          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {needsSetup ? 'Create administrator' : 'Sign in'}
            </h2>
            <p className="mt-1 text-muted-xs">
              {needsSetup
                ? 'No accounts exist yet. Create the first administrator, then add clients and projects from the app.'
                : 'Use your Elevate Digital work email.'}
            </p>
          </div>

          {checkingSetup ? (
            <div className="flex justify-center py-10">
              <Spinner label="Checking system..." />
            </div>
          ) : needsSetup ? (
            <form
              onSubmit={setupForm.handleSubmit(onSetup)}
              className="mt-6 space-y-4"
              noValidate
            >
              {error && <Alert tone="error">{error}</Alert>}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="first_name">
                    First name
                  </label>
                  <input
                    id="first_name"
                    className="input"
                    autoFocus
                    {...setupForm.register('first_name')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="last_name">
                    Last name
                  </label>
                  <input id="last_name" className="input" {...setupForm.register('last_name')} />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="setup_email">
                  Work email
                </label>
                <input
                  id="setup_email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  {...setupForm.register('email', {
                    required: 'Email is required.',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Enter a valid email address.',
                    },
                  })}
                />
                {setupForm.formState.errors.email && (
                  <p className="field-error">{setupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="setup_password">
                  Password
                </label>
                <PasswordInput
                  id="setup_password"
                  autoComplete="new-password"
                  {...setupForm.register('password', {
                    required: 'Password is required.',
                    minLength: { value: 8, message: 'Use at least 8 characters.' },
                  })}
                />
                {setupForm.formState.errors.password && (
                  <p className="field-error">{setupForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Creating account...' : 'Create account and continue'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={signInForm.handleSubmit(onSignIn)}
              className="mt-6 space-y-4"
              noValidate
            >
              {error && <Alert tone="error">{error}</Alert>}

              <div>
                <label className="label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  className="input"
                  {...signInForm.register('email', {
                    required: 'Email is required.',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Enter a valid email address.',
                    },
                  })}
                />
                {signInForm.formState.errors.email && (
                  <p className="field-error">{signInForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  {...signInForm.register('password', { required: 'Password is required.' })}
                />
                {signInForm.formState.errors.password && (
                  <p className="field-error">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-muted-xs">
          Elevate Digital internal system. Authorised staff only.
        </p>
      </div>
    </div>
  )
}
