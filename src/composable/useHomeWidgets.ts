import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { parseHomeWidgetsConfig } from '@/utils/homeWidgets'

export function useHomeWidgets() {
  const settingsStore = useSettingsStore()

  const config = computed(() =>
    parseHomeWidgetsConfig(settingsStore.home_widgets_config),
  )

  const orderedEnabledWidgets = computed(() =>
    config.value.order.filter((id: string) => config.value.enabled[id as keyof typeof config.value.enabled] !== false),
  )

  const limits = computed(() => config.value.limits)

  const isWidgetEnabled = (id: string) => config.value.enabled[id as keyof typeof config.value.enabled] !== false

  return {
    config,
    orderedEnabledWidgets,
    limits,
    isWidgetEnabled,
  }
}
