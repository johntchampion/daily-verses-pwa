const DIALOG_RISE_PX = 24
const DIALOG_HIDDEN_SCALE = 0.96

/** How a sheet panel shows the spring's offset: 0 is fully open. */
export interface SheetPresentation {
  closedOffset: (panel: HTMLElement) => number
  applyOffset: (panel: HTMLElement, offset: number) => void
}

export const bottomSheet: SheetPresentation = {
  closedOffset: (panel) => panel.offsetHeight,
  applyOffset: (panel, offset) => {
    panel.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`
    panel.style.opacity = ''
  },
}

export const centeredDialog: SheetPresentation = {
  closedOffset: () => DIALOG_RISE_PX,
  applyOffset: (panel, offset) => {
    const hiddenFraction = offset / DIALOG_RISE_PX
    const scale = 1 - hiddenFraction * (1 - DIALOG_HIDDEN_SCALE)
    panel.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
    panel.style.opacity = Math.min(1, 1 - hiddenFraction).toFixed(3)
  },
}
