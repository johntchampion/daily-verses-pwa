import { useCallback, useState } from 'react'
import { messageOf } from '../lib/errors'

/** An account preference picked locally, then saved to the server. */
export interface Preference {
  value: string
  choose: (next: string) => void
  submit: () => Promise<void>
  saving: boolean
  error: string | null
  saved: boolean
  dirty: boolean
}

export function usePreference(
  current: string,
  save: (value: string) => Promise<unknown>,
  onSaved: () => void,
  failureMessage: string,
): Preference {
  const [pending, setPending] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const value = pending ?? current

  const choose = useCallback((next: string) => {
    setPending(next)
    setSaved(false)
  }, [])

  const submit = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await save(value)
      setSaved(true)
      setPending(null)
      onSaved()
    } catch (err) {
      setError(messageOf(err, failureMessage))
    } finally {
      setSaving(false)
    }
  }, [save, value, onSaved, failureMessage])

  return {
    value,
    choose,
    submit,
    saving,
    error,
    saved,
    dirty: value !== current,
  }
}
