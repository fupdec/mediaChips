export const MAIN_SCROLL_SELECTOR = '.main-scroll'

export function getMainScrollEl(): Element | null {
  return document.querySelector(MAIN_SCROLL_SELECTOR)
}

interface ScrollMainToOptions {
  top?: number
  behavior?: ScrollBehavior
}

export function scrollMainTo(options: number | ScrollMainToOptions = {}): void {
  const el = getMainScrollEl()
  const top = typeof options === 'number' ? options : options.top ?? 0
  const behavior = typeof options === 'number' ? 'smooth' : options.behavior ?? 'smooth'

  if (el) {
    el.scrollTo({ top, behavior })
    return
  }

  window.scrollTo({ top, behavior })
}
