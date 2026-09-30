import { BOOKS, bookChoices } from './books'
import { shuffle } from './exercise'

export interface ParsedReference {
  book: string
  chapter: string
  /** "3" or "3-4", always with a plain hyphen. */
  verses: string
}

/** "<book> <chapter>:<verse>[-<verse>]", e.g. "1 Corinthians 15:3-4". The book
    group is lazy so multi-word names like "Song of Solomon" stay whole. */
const REFERENCE_RE =
  /^([1-3]?\s*\p{L}[\p{L}\s]*?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/u

/** Hyphen, non-breaking hyphen, figure/en/em dash and minus sign. */
const DASH_VARIANTS = /[‐‑‒–—−]/g

function normalizePunctuation(reference: string): string {
  return reference
    .replace(DASH_VARIANTS, '-')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripLeadingZeros(digits: string): string {
  return String(Number(digits))
}

export function parseReference(reference: string): ParsedReference | null {
  const match = REFERENCE_RE.exec(normalizePunctuation(reference))
  if (!match) return null

  const [, book, chapter, start, end] = match
  const first = stripLeadingZeros(start)
  const last = end === undefined ? first : stripLeadingZeros(end)

  return {
    book: book.replace(/\s+/g, ' ').trim(),
    chapter: stripLeadingZeros(chapter),
    verses: last === first ? first : `${first}-${last}`,
  }
}

function numbersAround(
  answer: number,
  offsets: readonly number[],
  count: number,
): number[] {
  const picks = [answer]
  for (const offset of shuffle([...offsets])) {
    if (picks.length >= count) break
    const candidate = answer + offset
    if (candidate >= 1 && !picks.includes(candidate)) picks.push(candidate)
  }
  return picks.sort((a, b) => a - b)
}

const NEAR_OFFSETS = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]

export function chapterChoices(chapter: string, count = 6): string[] {
  return numbersAround(Number(chapter), NEAR_OFFSETS, count).map(String)
}

/** Nearby verses; a range answer gets range decoys of the same span. */
export function verseChoices(verses: string, count = 6): string[] {
  const [start, end] = verses.split('-').map(Number)
  const span = (Number.isFinite(end) ? end : start) - start
  return numbersAround(start, NEAR_OFFSETS, count).map((first) =>
    span > 0 ? `${first}-${first + span}` : String(first),
  )
}

export type ReferenceStepKind = 'book' | 'chapter' | 'verse'

export interface ReferenceStep {
  kind: ReferenceStepKind
  answer: string
  choices: string[]
}

/** The book, chapter and verse steps of the drill, or null when the reference
    can't be drilled. */
export function buildReferenceSteps(reference: string): ReferenceStep[] | null {
  const parsed = parseReference(reference)
  if (!parsed || !BOOKS.includes(parsed.book)) return null

  return [
    { kind: 'book', answer: parsed.book, choices: bookChoices(parsed.book) },
    {
      kind: 'chapter',
      answer: parsed.chapter,
      choices: chapterChoices(parsed.chapter),
    },
    {
      kind: 'verse',
      answer: parsed.verses,
      choices: verseChoices(parsed.verses),
    },
  ]
}

const BOOK_ALIASES: Record<string, string> = {
  psalms: 'psalm',
  'song of songs': 'song of solomon',
  canticles: 'song of solomon',
}

function normalizeBook(book: string): string {
  const spelled = normalizePunctuation(book)
    .toLowerCase()
    .replace(/^(iii|3rd)\b/, '3')
    .replace(/^(ii|2nd)\b/, '2')
    .replace(/^(i|1st)\b/, '1')
    .replace(/\s+/g, ' ')
    .trim()
  return BOOK_ALIASES[spelled] ?? spelled
}

const MIN_BOOK_PREFIX_LENGTH = 3

function booksMatch(typed: string, canonical: string): boolean {
  const t = normalizeBook(typed)
  const c = normalizeBook(canonical)
  return t === c || (t.length >= MIN_BOOK_PREFIX_LENGTH && c.startsWith(t))
}

function normalizeReferenceText(text: string): string {
  return normalizePunctuation(text)
    .toLowerCase()
    // Anything but letters, digits, spaces, ':' and '-' becomes a space.
    .replace(/[^\p{L}\p{N}\s:-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Ignores case, punctuation and abbreviated or roman-numeralled book names;
    chapter and verse must match exactly. */
export function referencesMatch(input: string, reference: string): boolean {
  const typed = parseReference(input)
  const answer = parseReference(reference)
  if (!typed || !answer) {
    return normalizeReferenceText(input) === normalizeReferenceText(reference)
  }

  return (
    booksMatch(typed.book, answer.book) &&
    typed.chapter === answer.chapter &&
    typed.verses === answer.verses
  )
}
