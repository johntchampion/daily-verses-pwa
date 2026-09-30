/**
 * The keyboard line under the bank: the legend while nothing is typed, and the
 * filter's readout once something is.
 *
 * Drawn only where a fine pointer implies a keyboard (`word-bank.css`) — the
 * keys themselves are always live, since there is nothing on a phone that can
 * press them, but a phone shouldn't be told to.
 *
 * A live region, but only for the parts worth hearing: the legend is a visual
 * aid for a sighted user who hasn't noticed the bank is drivable, and a screen
 * reader gets the same tiles by tabbing.
 */
export default function BankKeys({
  query,
  matches,
  isDone,
}: {
  query: string
  matches: number
  isDone: boolean
}) {
  if (isDone) {
    return (
      <p className='bank-keys' role='status'>
        <span>
          <kbd aria-hidden='true'>↵</kbd> Press Enter to continue
        </span>
      </p>
    )
  }

  if (query === '') {
    return (
      <p className='bank-keys' role='status'>
        <span aria-hidden='true'>Type to filter</span>
        <span className='bank-keys-sep' aria-hidden='true' />
        <span aria-hidden='true'>
          <kbd>←</kbd>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>→</kbd> to move
        </span>
        <span className='bank-keys-sep' aria-hidden='true' />
        <span aria-hidden='true'>
          <kbd>↵</kbd> to place
        </span>
      </p>
    )
  }

  return (
    <p className='bank-keys' role='status'>
      <span className='bank-keys-query'>{query}</span>
      <span>
        {matches} {matches === 1 ? 'tile' : 'tiles'} left
      </span>
      <span className='bank-keys-sep' aria-hidden='true' />
      <span aria-hidden='true'>
        <kbd>esc</kbd> to clear
      </span>
    </p>
  )
}
