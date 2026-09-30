export interface SheetLayer {
  overlay: HTMLElement
  cover: (covered: boolean) => void
}

const stack: SheetLayer[] = []

export const stackDepth = () => stack.length

export const topLayer = (): SheetLayer | undefined => stack[stack.length - 1]

export const isTopLayer = (overlay: HTMLElement | null): boolean =>
  stack.length > 0 && stack[stack.length - 1].overlay === overlay

export function pushLayer(layer: SheetLayer): void {
  stack.push(layer)
}

export function removeLayer(overlay: HTMLElement): void {
  const at = stack.findIndex((layer) => layer.overlay === overlay)
  if (at !== -1) stack.splice(at, 1)
}
