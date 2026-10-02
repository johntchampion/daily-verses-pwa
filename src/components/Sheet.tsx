import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../lib/cx'
import { bottomSheet, centeredDialog } from '../lib/sheetPresentation'
import type { SheetLayer } from '../lib/sheetStack'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useOverflows } from '../hooks/useOverflows'
import { useSheetDrag } from '../hooks/useSheetDrag'
import { useSheetSpring } from '../hooks/useSheetSpring'
import { useSheetStack } from '../hooks/useSheetStack'

interface Props {
  open: boolean
  label: string
  onClose: () => void
  onExited?: () => void
  footer?: React.ReactNode
  /** False disables closing by backdrop, Escape and drag. */
  dismissible?: boolean
  size?: 'auto' | 'tall' | 'full'
  children: React.ReactNode
}

/** Bottom sheet over a dimmed backdrop, dismissed by dragging down, tapping
    outside or pressing Escape. On desktop it is a centered dialog instead. */
export default function Sheet({
  open,
  label,
  onClose,
  onExited,
  footer,
  dismissible = true,
  size = 'auto',
  children,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const belowRef = useRef<SheetLayer | undefined>(undefined)
  const pointerDownOnBackdrop = useRef(false)

  const desktop = useIsDesktop()
  const draggable = !desktop
  const showsGrip = dismissible && draggable

  const { mounted, depth, panelRef, springRef, closedOffsetRef, closingRef } =
    useSheetSpring({
      open,
      onClose,
      onExited,
      overlayRef,
      belowRef,
      presentation: desktop ? centeredDialog : bottomSheet,
    })

  const covered = useSheetStack({
    mounted,
    dismissible,
    onClose,
    overlayRef,
    panelRef,
    belowRef,
  })

  const scrolls = useOverflows(bodyRef, mounted)

  const draggedRef = useSheetDrag({
    mounted,
    enabled: draggable,
    dismissible,
    onClose,
    panelRef,
    bodyRef,
    springRef,
    closedOffsetRef,
    closingRef,
  })

  if (!mounted) return null

  return createPortal(
    <div
      className='sheet-overlay'
      ref={overlayRef}
      style={{ opacity: 0 }}
      onPointerDown={(e) => {
        pointerDownOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (!dismissible || e.target !== e.currentTarget) return
        if (pointerDownOnBackdrop.current) onClose()
      }}
    >
      {/* The spring owns the panel's transform, so receding needs a wrapper. */}
      <div
        className={covered ? 'sheet-riser sheet-riser-back' : 'sheet-riser'}
        style={{ '--sheet-depth': depth } as React.CSSProperties}
      >
        <div
          className={cx('sheet', `sheet-${size}`, !showsGrip && 'sheet-plain')}
          ref={panelRef}
          role='dialog'
          aria-modal='true'
          aria-label={label}
          tabIndex={-1}
          style={{ transform: 'translate3d(0, 100%, 0)' }}
          onClickCapture={(e) => {
            if (!draggedRef.current) return
            draggedRef.current = false
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          {showsGrip && (
            <div className='sheet-grip' aria-hidden='true'>
              <span className='sheet-handle' />
            </div>
          )}
          <div
            className={footer ? 'sheet-body sheet-body-docked' : 'sheet-body'}
            ref={bodyRef}
          >
            {children}
          </div>
          {footer && (
            <div
              className={scrolls ? 'sheet-footer sheet-footer-cut' : 'sheet-footer'}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
