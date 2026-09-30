import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { MeResponse } from '../api/types'
import Alert from './Alert'
import TabBar from './TabBar'
import TopNav from './TopNav'

type Layout = 'plain' | 'stack' | 'tabbed'

const SHELL: Record<Layout, string> = {
  plain: 'shell',
  stack: 'shell stack',
  tabbed: 'shell shell-tabbed',
}

interface Props {
  layout?: Layout
  className?: string

  leading?: ReactNode
  title?: ReactNode
  trailing?: ReactNode
  sub?: ReactNode
  me?: MeResponse | null
  subStyle?: CSSProperties

  loading?: boolean
  loadingLabel?: string

  error?: string | null
  onRetry?: () => void
  errorActions?: ReactNode

  children: ReactNode
}

export default function Screen({
  layout = 'plain',
  className,
  leading,
  title,
  trailing,
  sub,
  subStyle,
  me = null,
  loading = false,
  loadingLabel,
  error = null,
  onRetry,
  errorActions,
  children,
}: Props) {
  const shell = className ? `${SHELL[layout]} ${className}` : SHELL[layout]
  const hasHeader = leading || title || trailing

  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const dismiss = () => setDismissedError(error)

  const main = (
    <main className={shell} aria-busy={loading}>
      {hasHeader && (
        <header className='screen-header' style={{ marginBottom: 0 }}>
          {leading}
          {title}
          <span style={{ flex: 1 }} />
          {trailing}
        </header>
      )}

      {sub !== undefined && (
        <p className='view-sub' style={subStyle}>
          {sub}
        </p>
      )}

      {loading && loadingLabel && (
        <span className='sr-only' role='status'>
          {loadingLabel}
        </span>
      )}

      {children}

      <Alert
        open={error !== null && error !== dismissedError}
        title='Something went wrong'
        message={error ?? ''}
        tone='warning'
        primaryLabel={onRetry ? 'Try again' : 'OK'}
        onPrimary={onRetry ?? dismiss}
        secondaryLabel={onRetry && !errorActions ? 'Dismiss' : undefined}
        onSecondary={onRetry && !errorActions ? dismiss : undefined}
        onClose={dismiss}
        extra={errorActions}
      />
    </main>
  )

  if (layout !== 'tabbed') return main
  return (
    <>
      <TopNav me={me} />
      {main}
      <TabBar />
    </>
  )
}

export function BackButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button className='icon-btn' aria-label={label} onClick={onClick}>
      ←
    </button>
  )
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className='icon-btn' aria-label={label}>
      ←
    </Link>
  )
}
