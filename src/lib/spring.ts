export interface SpringConfig {
  tension: number
  friction: number
  mass: number
  /** Stop on reaching the target instead of settling into it. */
  clamp?: boolean
}

export const SETTLE: SpringConfig = { tension: 220, friction: 22, mass: 1 }

export const CLOSE: SpringConfig = {
  tension: 320,
  friction: 30,
  mass: 1,
  clamp: true,
}

const REST_OFFSET_PX = 0.5
const REST_VELOCITY_PX_PER_S = 8

const INTEGRATION_STEP_MS = 1000 / 120

/** Caps the huge frame delta a backgrounded tab hands back. */
const MAX_FRAME_MS = 64

export interface Spring {
  set: (value: number) => void
  /** Velocity is px/s and defaults to the current velocity. */
  to: (target: number, velocity?: number, config?: SpringConfig) => void
  stop: () => void
  readonly value: number
  readonly moving: boolean
}

export function createSpring(
  onFrame: (value: number) => void,
  onRest?: () => void,
): Spring {
  let value = 0
  let velocity = 0
  let target = 0
  let config = SETTLE
  let raf = 0
  let prev = 0
  let direction = 0
  let unsimulatedMs = 0

  const stop = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    unsimulatedMs = 0
  }

  const step = (now: number) => {
    raf = 0
    unsimulatedMs += Math.min(now - prev, MAX_FRAME_MS)
    prev = now

    let arrived = false
    while (unsimulatedMs >= INTEGRATION_STEP_MS) {
      unsimulatedMs -= INTEGRATION_STEP_MS
      const dt = INTEGRATION_STEP_MS / 1000
      const force =
        -config.tension * (value - target) - config.friction * velocity
      velocity += (force / config.mass) * dt
      value += velocity * dt
      if (config.clamp && (value - target) * direction >= 0) {
        arrived = true
        break
      }
    }

    if (
      arrived ||
      (Math.abs(value - target) < REST_OFFSET_PX &&
        Math.abs(velocity) < REST_VELOCITY_PX_PER_S)
    ) {
      value = target
      velocity = 0
      unsimulatedMs = 0
      onFrame(value)
      onRest?.()
      return
    }

    onFrame(value)
    raf = requestAnimationFrame(step)
  }

  return {
    set(next) {
      stop()
      value = next
      velocity = 0
      onFrame(value)
    },
    to(next, nextVelocity = velocity, nextConfig = SETTLE) {
      direction = Math.sign(next - value) || 1
      target = next
      velocity = nextVelocity
      config = nextConfig
      if (raf) return
      prev = performance.now()
      unsimulatedMs = 0
      raf = requestAnimationFrame(step)
    },
    stop,
    get value() {
      return value
    },
    get moving() {
      return raf !== 0
    },
  }
}
