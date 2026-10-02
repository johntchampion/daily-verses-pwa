const TAB_LABELS = {
  '/': 'Today',
  '/practicing': 'Practicing',
  '/library': 'Library',
} as const

export type TabPath = keyof typeof TAB_LABELS

/** The tab a stack screen was opened from, carried as `{ from }` in location
    state. `null` for a deep link, a reload, or anywhere that isn't a tab. */
export function originOf(state: unknown): TabPath | null {
  const from = (state as { from?: unknown } | null)?.from
  if (typeof from !== 'string' || !Object.hasOwn(TAB_LABELS, from)) return null
  return from as TabPath
}

export const tabLabel = (tab: TabPath) => TAB_LABELS[tab]
