import { forwardRef, useState } from 'react'

import { EyeIcon, EyeOffIcon } from './Icons.jsx'

/**
 * Password field with show/hide toggle. Works with react-hook-form via ref + spread register().
 */
const PasswordInput = forwardRef(function PasswordInput(
  { className = '', id, disabled, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={`input pr-10 ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg
          text-slate-400 hover:text-slate-600 disabled:pointer-events-none dark:hover:text-slate-300"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  )
})

export default PasswordInput
