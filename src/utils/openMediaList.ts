import { useRouter } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useEventBus } from '@/utils/eventBus'
import { getDefaultMediaTypeId } from '@/utils/mediaType'
import { useAppStore } from '@/stores/app'

interface OpenMediaListOptions {
  sortBy?: string
  sortDir?: string
  mediaTypeId?: number
}

export function useOpenMediaList() {
  const router = useRouter()
  const itemsStore = useItemsStore()
  const appStore = useAppStore()
  const eventBus = useEventBus()

  const openMediaList = async ({ sortBy, sortDir = 'desc', mediaTypeId }: OpenMediaListOptions = {}) => {
    const targetMediaTypeId = mediaTypeId ?? getDefaultMediaTypeId(appStore.mediaTypes)

    await router.push(`/media?mediaTypeId=${targetMediaTypeId}`)

    if (sortBy) {
      itemsStore.updateState({ key: 'sortBy', value: sortBy })
      itemsStore.updateState({ key: 'sortDir', value: sortDir })
      eventBus.emit('setItemsSortBy', sortBy)
      eventBus.emit('setItemsSortDir', sortDir)
    }
  }

  return { openMediaList }
}
