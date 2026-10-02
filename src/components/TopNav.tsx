import { NavLink } from 'react-router-dom'
import type { MeResponse } from '../api/types'
import type { TabPath } from '../lib/origin'
import AppMark from './AppMark'
import SettingsLink from './SettingsLink'
import StreakChip from './StreakChip'

const TABS = [
  { to: '/', label: 'Today' },
  { to: '/practicing', label: 'Practicing' },
  { to: '/library', label: 'Library' },
]

export default function TopNav({
  me,
  activeTab = null,
}: {
  me: MeResponse | null
  activeTab?: TabPath | null
}) {
  return (
    <nav className='top-nav' aria-label='Main'>
      <div className='top-nav-inner'>
        <span className='top-nav-brand'>
          <AppMark className='top-nav-mark' />
          <span className='wordmark'>Daily Verses</span>
        </span>

        <div className='top-nav-tabs'>
          {TABS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                isActive || to === activeTab
                  ? 'top-nav-tab top-nav-tab-active'
                  : 'top-nav-tab'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className='top-nav-actions'>
          {me && <StreakChip me={me} />}
          <SettingsLink />
        </div>
      </div>
    </nav>
  )
}
