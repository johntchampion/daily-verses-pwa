import { NavLink, useLocation } from 'react-router-dom'

/** Passes the current tab along so Settings can return to it. */
export default function SettingsLink() {
  const { pathname, state } = useLocation()
  return (
    <NavLink
      to='/settings'
      state={pathname === '/settings' ? state : { from: pathname }}
      className={({ isActive }) =>
        isActive ? 'icon-btn icon-btn-active' : 'icon-btn'
      }
      aria-label='Settings'
    >
      <svg width='16' height='16' viewBox='0 0 16 16' aria-hidden='true'>
        <line x1='2.2' y1='4.6' x2='13.8' y2='4.6' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        <line x1='2.2' y1='11.4' x2='13.8' y2='11.4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        <circle cx='10.4' cy='4.6' r='2.5' fill='var(--card)' stroke='currentColor' strokeWidth='1.5' />
        <circle cx='5.6' cy='11.4' r='2.5' fill='var(--card)' stroke='currentColor' strokeWidth='1.5' />
      </svg>
    </NavLink>
  )
}
