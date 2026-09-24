/**
 * The app icon, inline. Same artwork as public/favicon.svg — a blush field with
 * a coral bar along the bottom — but drawn from tokens so it follows the dark
 * theme, which a raw <img> of the favicon could not.
 */
export default function AppMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 1024 1024'
      aria-hidden='true'
      focusable='false'
    >
      {/* All four corners, unlike the favicon: nothing masks this one. */}
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
