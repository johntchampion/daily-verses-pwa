import type { VerseListItem } from '../api/types'

const SNIPPET_CHARS = 60

export function truncate(text: string): string {
  if (text.length <= SNIPPET_CHARS) return text
  const cut = text.slice(0, SNIPPET_CHARS)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 1))}…`
}

/** Excludes relearning verses, which still report `status: 'review'`. */
export function isMemorized(verse: VerseListItem): boolean {
  if (verse.needsRelearning) return false
  return verse.status === 'review' || verse.status === 'mastered'
}
