import {useAppStore} from '@/stores/app'

export function isAppWindowFocused(): boolean {
  return useAppStore().window.focused
}

export function setAppWindowFocused(focused: boolean): void {
  const store = useAppStore()
  if (store.window.focused !== focused) {
    store.window.focused = focused
  }
}

export function syncAppWindowFocusedFromDocument(): void {
  setAppWindowFocused(!document.hidden && document.hasFocus())
}
