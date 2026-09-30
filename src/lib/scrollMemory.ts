const scrollMemory = new Map<string, number>()

export const rememberScroll = (key: string, y: number) =>
  scrollMemory.set(key, y)

export const recallScroll = (key: string) => scrollMemory.get(key) ?? 0

const RESTORE_TIMEOUT_MS = 1500

const USER_TAKEOVER_EVENTS = ['wheel', 'touchstart', 'keydown'] as const

/** Scrolls to `y`, retrying as the still-loading page grows, until it gets
    there, the user takes over, or it times out. */
export function restoreScroll(y: number) {
  window.scrollTo(0, y)
  if (y === 0 || window.scrollY >= y - 1) return

  let done = false
  const stop = () => {
    if (done) return
    done = true
    observer.disconnect()
    clearTimeout(timer)
    for (const event of USER_TAKEOVER_EVENTS) window.removeEventListener(event, stop)
  }

  const observer = new ResizeObserver(() => {
    window.scrollTo(0, y)
    if (window.scrollY >= y - 1) stop()
  })
  const timer = setTimeout(stop, RESTORE_TIMEOUT_MS)
  for (const event of USER_TAKEOVER_EVENTS) {
    window.addEventListener(event, stop, { passive: true })
  }
  observer.observe(document.documentElement)
}
