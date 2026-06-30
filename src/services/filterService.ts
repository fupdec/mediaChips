import { useItemsStore } from '@/stores/items'
import { typedApi } from '@/services/typedApi'
import type { SavedFilter } from '@/types/stores'

export async function getSavedFilters() {
  const itemsStore = useItemsStore()

  try {
    const ENV = itemsStore?.environment || {}

    const response = await typedApi.findSavedFiltersHydrated({
      mediaTypeId: ENV.media_type_id || null,
      metaId: ENV.meta_id || null,
      tagId: ENV.tag_id || null,
      tabId: ENV.tab_id || null,
    })

    if (itemsStore) {
      itemsStore.filters_saved = response.data || []
    }

    return itemsStore?.filters_saved || []
  } catch (error) {
    console.error('Ошибка при загрузке сохраненных фильтров:', error)
    return []
  }
}

export async function getFilters(savedFilterId: number | string) {
  if (!savedFilterId) {
    console.warn('getFilters вызван без savedFilterId')
    return []
  }

  const itemsStore = useItemsStore()
  let savedFilters = itemsStore?.filters_saved
  if (!savedFilters?.length) {
    savedFilters = await getSavedFilters()
  }

  const savedFilter = savedFilters.find(
    (filter: SavedFilter) => Number(filter.id) === Number(savedFilterId),
  )

  return savedFilter?.filters || []
}
