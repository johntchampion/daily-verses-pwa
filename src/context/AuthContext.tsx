import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  api,
  clearSession,
  getToken,
  getUserId,
  setUnauthorizedHandler,
  storeSession,
  tokenIsExpired,
} from '../api/client'
import { AuthContext } from './auth'

function initialSession(): { token: string | null; userId: string | null } {
  const token = getToken()
  if (!token || tokenIsExpired(token)) {
    clearSession()
    return { token: null, userId: null }
  }
  return { token, userId: getUserId() }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(initialSession)
  const [signedOut, setSignedOut] = useState(false)

  // `signedOut` sends a revoked session to sign-in rather than onboarding.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession({ token: null, userId: null })
      setSignedOut(true)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    storeSession(res.token, res.userId)
    setSession({ token: res.token, userId: res.userId })
    setSignedOut(false)
  }, [])

  const signup = useCallback(async (email: string, password: string, timezone?: string) => {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const res = await api.signup(email, password, tz)
    storeSession(res.token, res.userId)
    setSession({ token: res.token, userId: res.userId })
    setSignedOut(false)
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    // Cleared first so the reset isn't sent with this browser's token.
    clearSession()
    setSession({ token: null, userId: null })

    const res = await api.resetPassword(token, password)
    storeSession(res.token, res.userId)
    setSession({ token: res.token, userId: res.userId })
    setSignedOut(false)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession({ token: null, userId: null })
    setSignedOut(true)
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...session, signedOut, login, signup, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
