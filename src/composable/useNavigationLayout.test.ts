import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { useNavigationLayout } from './useNavigationLayout'

const mobileRef = ref(false)

vi.mock('vuetify', () => ({
  useDisplay: () => ({
    mobile: mobileRef,
  }),
}))

describe('useNavigationLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mobileRef.value = false
  })

  it('uses bottom bar when the setting is enabled', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const settingsStore = useSettingsStore()
    settingsStore.bottomBar = '1'

    const { useBottomBar } = useNavigationLayout()

    expect(useBottomBar.value).toBe(true)
  })

  it('uses bottom bar on mobile even when the setting is disabled', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const settingsStore = useSettingsStore()
    settingsStore.bottomBar = '0'
    mobileRef.value = true

    const { useBottomBar } = useNavigationLayout()

    expect(useBottomBar.value).toBe(true)
  })

  it('uses sidebar layout on desktop when bottom bar is disabled', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const settingsStore = useSettingsStore()
    settingsStore.bottomBar = '0'

    const { useBottomBar } = useNavigationLayout()

    expect(useBottomBar.value).toBe(false)
  })
})
