import {onBeforeUnmount} from 'vue'
import {handlePlayerKeydown, shouldHandlePlayerShortcut} from '@/utils/playerHotkeys'

export function usePlayerHotkeys(getContext) {
  let attached = false

  function onKeydown(event) {
    const ctx = getContext()
    if (!shouldHandlePlayerShortcut(event, ctx.playerStore)) return

    if (handlePlayerKeydown(event, ctx)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function attach() {
    if (attached) return
    window.addEventListener('keydown', onKeydown)
    attached = true
  }

  function detach() {
    if (!attached) return
    window.removeEventListener('keydown', onKeydown)
    attached = false
  }

  onBeforeUnmount(detach)

  return {attach, detach}
}
