export const MAIN_SCROLL_SELECTOR = '.main-scroll'

export function getMainScrollEl() {
  return document.querySelector(MAIN_SCROLL_SELECTOR)
}

export function scrollMainTo(options = {}) {
  const el = getMainScrollEl()
  const top = typeof options === 'number' ? options : options.top ?? 0
  const behavior = typeof options === 'number' ? 'smooth' : options.behavior ?? 'smooth'

  if (el) {
    el.scrollTo({ top, behavior })
    return
  }

  window.scrollTo({ top, behavior })
}
