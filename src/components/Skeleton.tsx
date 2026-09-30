import type { CSSProperties } from 'react'

type Variant = 'block' | 'text' | 'circle' | 'chip'

interface Props {
  /** px when a number, any CSS length when a string. */
  w?: number | string
  /** px or CSS length; omit for `text`, which sizes to the font. */
  h?: number | string
  variant?: Variant
  className?: string
  style?: CSSProperties
}

export function Skeleton({
  w,
  h,
  variant = 'block',
  className,
  style,
}: Props) {
  const classes = ['sk']
  if (variant !== 'block') classes.push(`sk-${variant}`)
  if (className) classes.push(className)
  return (
    <span
      className={classes.join(' ')}
      aria-hidden='true'
      style={{ width: w, height: h, ...style }}
    />
  )
}

const LAST_LINE_WIDTH = '62%'

export function SkeletonText({
  lines = 3,
  widths,
  className,
  style,
}: {
  lines?: number
  widths?: (number | string)[]
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={className}
      aria-hidden='true'
      style={{ display: 'flex', flexDirection: 'column', ...style }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant='text'
          w={widths?.[i] ?? (i === lines - 1 ? LAST_LINE_WIDTH : '100%')}
        />
      ))}
    </span>
  )
}
