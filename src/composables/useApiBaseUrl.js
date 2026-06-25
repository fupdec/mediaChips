import {computed} from 'vue'
import {useAppStore} from '@/stores/app'
import {resolveApiBaseUrl} from '@/utils/apiBaseUrl'

export function useApiBaseUrl() {
  const appStore = useAppStore()

  return computed(() => (
    resolveApiBaseUrl(appStore.config) || appStore.localhost
  ))
}
