/** The favicon artwork, drawn from theme tokens so it follows dark mode. */
export default function AppMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 1024 1024'
      aria-hidden='true'
      focusable='false'
    >
      <clipPath id='app-mark-clip'>
        <rect width='1024' height='1024' rx='224' ry='224' />
      </clipPath>
      <g clipPath='url(#app-mark-clip)'>
        <rect width='1024' height='1024' fill='var(--coral-line)' />
        <rect y='800' width='1024' height='224' fill='var(--coral-text)' />
      </g>
    </svg>
  )
}
