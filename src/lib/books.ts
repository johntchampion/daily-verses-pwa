import { shuffle } from './exercise'

/** Canon order, spelled as the curriculum spells them ("Psalm", not "Psalms"). */
export const BOOKS: readonly string[] = [
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1 Samuel',
  '2 Samuel',
  '1 Kings',
  '2 Kings',
  '1 Chronicles',
  '2 Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalm',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  '2 Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1 Peter',
  '2 Peter',
  '1 John',
  '2 John',
  '3 John',
  'Jude',
  'Revelation',
]

function withoutNumeral(book: string): string {
  return book.replace(/^[1-3]\s+/, '')
}

/** Shuffled decoys: numbered siblings ("1 John" for "John") first, then the
    nearest books in canon order. */
export function bookChoices(book: string, count = 5): string[] {
  const at = BOOKS.indexOf(book)
  if (at === -1) return [book]

  const picks: string[] = []
  const add = (candidate: string) => {
    if (candidate !== book && !picks.includes(candidate)) picks.push(candidate)
  }

  const base = withoutNumeral(book)
  for (const other of BOOKS) {
    if (withoutNumeral(other) === base) add(other)
  }

  for (let step = 1; step < BOOKS.length && picks.length < count - 1; step++) {
    if (BOOKS[at - step]) add(BOOKS[at - step])
    if (BOOKS[at + step]) add(BOOKS[at + step])
  }

  return shuffle([book, ...picks.slice(0, count - 1)])
}
