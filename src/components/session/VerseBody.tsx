import type { RefObject } from 'react'
import { cx } from '../../lib/cx'
import type { VerseChunk } from '../../lib/exercise'
import TypedBlank from './TypedBlank'

export default function VerseBody({
  chunks,
  filledBlanks,
  currentBlankRef,
  typed = '',
  typedWrong = false,
}: {
  chunks: VerseChunk[]
  filledBlanks: number
  currentBlankRef: RefObject<HTMLSpanElement | null>
  typed?: string
  typedWrong?: boolean
}) {
  return (
    <p className='verse-text'>
      {chunks.map((chunk, index) => {
        const space = index > 0 ? ' ' : ''

        if (chunk.kind === 'text') {
          return (
            <span key={index}>
              {space}
              {chunk.text}
            </span>
          )
        }

        if (chunk.blankIndex < filledBlanks) {
          return (
            <span key={index}>
              {space}
              <span className='blank-group'>
                {chunk.blank.punctBefore}
                <span className='blank-filled'>{chunk.blank.answer}</span>
                {chunk.blank.punctAfter}
              </span>
            </span>
          )
        }

        const isCurrent = chunk.blankIndex === filledBlanks
        return (
          <span key={index}>
            {space}
            <span className='blank-group'>
              {chunk.blank.punctBefore}
              <span
                ref={isCurrent ? currentBlankRef : undefined}
                className={cx(
                  'blank',
                  isCurrent && 'blank-current',
                  isCurrent && typedWrong && 'blank-wrong',
                )}
                aria-label='blank'
              >
                {isCurrent ? (
                  <TypedBlank sizer={chunk.blank.answer} typed={typed} />
                ) : (
                  chunk.blank.answer
                )}
              </span>
              {chunk.blank.punctAfter}
            </span>
          </span>
        )
      })}
    </p>
  )
}
