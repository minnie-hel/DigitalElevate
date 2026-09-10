import { useEffect, useState } from 'react'

import { SearchIcon } from './Icons.jsx'

/** Debounced search box, so typing does not fire a request per keystroke. */
export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  const [text, setText] = useState(value || '')

  useEffect(() => {
    setText(value || '')
  }, [value])

  useEffect(() => {
    if (text === (value || '')) return undefined
    const timer = setTimeout(() => onChange(text), 350)
    return () => clearTimeout(timer)
  }, [text, value, onChange])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <SearchIcon className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="input pl-9"
        aria-label={placeholder}
      />
    </div>
  )
}
