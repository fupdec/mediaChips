import {computed} from 'vue'
import {useSettingsStore} from '@/stores/settings'
import {parseHomeWidgetsConfig} from '@/utils/homeWidgets'

export function useHomeWidgets() {
  const settingsStore = useSettingsStore()

  const config = computed(() =>
    parseHomeWidgetsConfig(settingsStore.home_widgets_config),
  )

  const orderedEnabledWidgets = computed(() =>
    config.value.order.filter((id) => config.value.enabled[id] !== false),
  )

  const limits = computed(() => config.value.limits)

  const isWidgetEnabled = (id) => config.value.enabled[id] !== false

  return {
    config,
    orderedEnabledWidgets,
    limits,
    isWidgetEnabled,
  }
}
