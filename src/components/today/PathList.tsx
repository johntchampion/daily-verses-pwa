import { useEffect, useRef, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import type { PathNode } from '../../lib/path'
import { Skeleton } from '../Skeleton'

/** Matches the fade band on `.path-scroll`; a stop inside it counts as hidden. */
const FADE_PX = 30

function Stop({
  node,
  ref,
}: {
  node: PathNode
  ref?: RefObject<HTMLAnchorElement | null>
}) {
  const body = (
    <>
      <span className='path-mark' aria-hidden='true'>
        {node.state === 'done' ? '✓' : node.index + 1}
      </span>
      <span className='path-text'>
        <span className='path-ref'>{node.reference}</span>
        <span className='path-meta'>{node.meta}</span>
      </span>
      {node.state === 'current' && (
        <span className='path-pill'>
          {node.index === 0 ? 'Start here' : 'You’re here'}
        </span>
      )}
    </>
  )

  if (node.state === 'current') {
    return (
      <Link
        ref={ref}
        to='/session'
        className='path-row path-row-current'
        aria-label={`Continue with ${node.reference} — ${node.meta}`}
      >
        {body}
      </Link>
    )
  }
  return <div className={`path-row path-row-${node.state}`}>{body}</div>
}

function PathSkeleton() {
  return (
    <div className='path-scroll'>
      <div className='path-list' aria-hidden='true'>
        <span className='path-group'>
          <Skeleton w={112} h={10} />
        </span>
        {[0, 1, 2, 3].map((i) => (
          <div className='path-row' key={i}>
            <Skeleton variant='circle' w={56} h={56} />
            <span className='path-text'>
              <Skeleton variant='text' w={132} h={15} />
              <Skeleton variant='text' w={84} h={11} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Today's stops down a scrolling rail, centred on the current stop. */
export default function PathList({ nodes }: { nodes: PathNode[] | null }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLAnchorElement>(null)
  const currentIndex = nodes
    ? nodes.findIndex((node) => node.state === 'current')
    : -1

  useEffect(() => {
    const scroller = scrollRef.current
    const row = currentRef.current
    if (!scroller || !row) return

    const view = scroller.getBoundingClientRect()
    const box = row.getBoundingClientRect()
    if (box.top >= view.top + FADE_PX && box.bottom <= view.bottom - FADE_PX) return

    scroller.scrollTop += box.top - view.top - (view.height - box.height) / 2
  }, [currentIndex])

  if (!nodes) return <PathSkeleton />
  if (nodes.length === 0) return null

  return (
    <div className='path-scroll' ref={scrollRef}>
      <div className='path-list'>
        {nodes.map((node) => (
          <div className='path-step' key={node.index}>
            {node.group && <span className='path-group'>{node.group}</span>}
            <Stop
              node={node}
              ref={node.state === 'current' ? currentRef : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
