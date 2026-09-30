/** Typed text laid over an invisible sizer that holds the blank's width. */
export default function TypedBlank({
  sizer,
  typed,
}: {
  sizer: string
  typed: string
}) {
  if (typed === '') return sizer

  return (
    <span className='blank-stack'>
      <span className='blank-sizer' aria-hidden='true'>
        {sizer}
      </span>
      <span className='blank-typed'>{typed}</span>
    </span>
  )
}
