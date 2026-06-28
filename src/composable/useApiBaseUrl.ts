import { computed } from 'vue'
import { getApiBaseUrl } from '@/services/apiClient'

export function useApiBaseUrl() {
  return computed(() => getApiBaseUrl())
}
