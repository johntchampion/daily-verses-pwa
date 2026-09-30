/** The keyboard legend under the bank, or the filter's status once something
    is typed. Hidden by CSS below the desktop breakpoint and on devices
    without a fine pointer. */
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
        <span aria-hidden='true'>Type a word</span>
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
      <span className='sr-only'>{query}</span>
      <span>
        {matches} {matches === 1 ? 'tile' : 'tiles'} left
      </span>
      <span className='bank-keys-sep' aria-hidden='true' />
      <span aria-hidden='true'>
        <kbd>space</kbd> to place
      </span>
      <span className='bank-keys-sep' aria-hidden='true' />
      <span aria-hidden='true'>
        <kbd>esc</kbd> to clear
      </span>
    </p>
  )
}
