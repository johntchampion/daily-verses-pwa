/**
 * The inside of the current blank: what the keyboard has typed, laid over the
 * invisible text that sizes the blank. Both share one grid cell, so the blank
 * holds its width while typing and only grows if the typing outruns it.
 */
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
