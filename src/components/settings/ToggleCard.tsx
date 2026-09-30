import type { ReactNode } from 'react'

interface Props {
  eyebrow: string
  description: ReactNode
  checked: boolean
  busy?: boolean
  /** Shown instead of the switch when it can't work here. */
  unavailable?: ReactNode
  hint?: ReactNode
  error?: string | null
  onChange: (next: boolean) => void
  children?: ReactNode
}

/** An on/off account setting that saves as soon as it's flipped. */
export default function ToggleCard({
  eyebrow,
  description,
  checked,
  busy = false,
  unavailable,
  hint,
  error = null,
  onChange,
  children,
}: Props) {
  return (
    <section className='card stack' aria-label={eyebrow}>
      <div>
        <p className='eyebrow'>{eyebrow}</p>
        <p className='small muted' style={{ fontWeight: 600, marginTop: 6 }}>
          {description}
        </p>
      </div>

      {unavailable ? (
        <p className='small muted' style={{ fontWeight: 700 }}>
          {unavailable}
        </p>
      ) : (
        <>
          <label className='toggle-row'>
            <input
              type='checkbox'
              role='switch'
              className='toggle-input'
              checked={checked}
              disabled={busy}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className='toggle-track' aria-hidden='true'>
              <span className='toggle-thumb' />
            </span>
            <span className='toggle-label'>
              {busy ? 'Saving…' : checked ? 'On' : 'Off'}
            </span>
          </label>

          {hint && (
            <p className='small muted' style={{ fontWeight: 600 }}>
              {hint}
            </p>
          )}
          {error && (
            <p className='error-text' role='alert'>
              {error}
            </p>
          )}
          {children}
        </>
      )}
    </section>
  )
}
