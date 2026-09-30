import { Navigate, Route, Routes, type Location } from 'react-router-dom'
import { tokenIsExpired } from './api/client'
import NavStack from './components/NavStack'
import { useAuth } from './context/auth'
import { useIsDesktop } from './hooks/useIsDesktop'
import AllVerses from './routes/AllVerses'
import Login from './routes/Login'
import Onboarding from './routes/onboarding/Onboarding'
import ForgotPassword from './routes/ForgotPassword'
import Practicing from './routes/Practicing'
import Queue from './routes/Queue'
import ResetPassword from './routes/ResetPassword'
import Session from './routes/Session'
import Settings from './routes/Settings'
import Signup from './routes/Signup'
import Today from './routes/Today'
import VerseDetail from './routes/VerseDetail'

/** Once signed out, always goes to /login: a revoked token can still look
    unexpired, and `fallback` would send a returning user to onboarding. */
function RequireAuth({
  children,
  fallback = '/login',
}: {
  children: React.ReactNode
  fallback?: string
}) {
  const { token, signedOut } = useAuth()
  if (!token || tokenIsExpired(token)) {
    return <Navigate to={signedOut ? '/login' : fallback} replace />
  }
  return children
}

function QueueRoute() {
  const desktop = useIsDesktop()
  if (desktop) return <Navigate to='/practicing' replace />
  return <Queue />
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (token && !tokenIsExpired(token)) return <Navigate to='/' replace />
  return children
}

/** Uses the given location, not the current one, so a screen animating away
    keeps rendering its own route. */
function AppRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route
        path='/welcome'
        element={
          <RedirectIfAuthed>
            <Onboarding />
          </RedirectIfAuthed>
        }
      />
      <Route
        path='/login'
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path='/signup'
        element={
          <RedirectIfAuthed>
            <Signup />
          </RedirectIfAuthed>
        }
      />
      <Route
        path='/forgot-password'
        element={
          <RedirectIfAuthed>
            <ForgotPassword />
          </RedirectIfAuthed>
        }
      />
      {/* Unguarded: the emailed link may open in a signed-in browser. */}
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route
        path='/'
        element={
          <RequireAuth fallback='/welcome'>
            <Today />
          </RequireAuth>
        }
      />
      <Route
        path='/practicing'
        element={
          <RequireAuth>
            <Practicing />
          </RequireAuth>
        }
      />
      <Route
        path='/queue'
        element={
          <RequireAuth>
            <QueueRoute />
          </RequireAuth>
        }
      />
      <Route
        path='/library'
        element={
          <RequireAuth>
            <AllVerses />
          </RequireAuth>
        }
      />
      <Route
        path='/session'
        element={
          <RequireAuth>
            <Session />
          </RequireAuth>
        }
      />
      <Route path='/verses' element={<Navigate to='/library' replace />} />
      <Route path='/all' element={<Navigate to='/library' replace />} />
      <Route
        path='/verses/:id'
        element={
          <RequireAuth>
            <VerseDetail />
          </RequireAuth>
        }
      />
      <Route
        path='/settings'
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default function App() {
  return <NavStack render={(location) => <AppRoutes location={location} />} />
}
