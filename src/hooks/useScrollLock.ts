import { useEffect } from 'react'

let activeLockCount = 0
let lockedScrollY = 0

/** Freezes the page behind an overlay. Uses `position: fixed` because iOS
    still lets a touch drag an `overflow: hidden` page. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const body = document.body
    if (activeLockCount++ === 0) {
      lockedScrollY = window.scrollY
      body.style.position = 'fixed'
      body.style.top = `-${lockedScrollY}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
    }

    return () => {
      if (--activeLockCount > 0) return
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      // Restore instantly, even if smooth scrolling is set.
      const html = document.documentElement
      const behavior = html.style.scrollBehavior
      html.style.scrollBehavior = 'auto'
      window.scrollTo(0, lockedScrollY)
      html.style.scrollBehavior = behavior
    }
  }, [active])
}
