import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useSettingsStore } from '@/stores/settings'

export function useNavigationLayout() {
  const { mobile } = useDisplay()
  const settingsStore = useSettingsStore()

  const useBottomBar = computed(() =>
    settingsStore.bottomBar === '1' || mobile.value,
  )

  return {
    mobile,
    useBottomBar,
  }
}
