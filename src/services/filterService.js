import _ from 'lodash'
import {parseCountries} from '@/utils/country'
import {useItemsStore} from '@/stores/items'
import {apiClient} from '@/services/apiClient'

export async function getFilters(savedFilterId) {
  if (!savedFilterId) {
    console.warn('getFilters вызван без savedFilterId')
    return []
  }

  try {
    const response = await apiClient.get(
      `/api/FilterRowsInSavedFilter?filterId=${savedFilterId}`,
    )

    const filters = response.data || []

    const processedFilters = await Promise.all(
      filters.map(async (filterItem) => {
        const filterRow = _.cloneDeep(filterItem.filterRow || {})

        if (filterRow.type !== 'array') {
          return filterRow
        }

        if (filterRow.param === 'country' && filterRow.val) {
          filterRow.val = parseCountries(filterRow.val)
          return filterRow
        }

        if (filterRow.type === 'array' && filterRow.param !== 'country') {
          try {
            const tagsResponse = await apiClient.get(
              `/api/TagsInFilterRow?rowId=${filterRow.id}`,
            )

            const tags = tagsResponse.data || []
            filterRow.val = tags.length > 0 ? tags.map((tag) => tag.tagId) : []
          } catch (tagsError) {
            console.error(`Ошибка при загрузке тегов для фильтра ${filterRow.id}:`, tagsError)
            filterRow.val = []
          }
        }

        if (filterRow.param != null && /^\d+$/.test(String(filterRow.param))) {
          filterRow.param = Number(filterRow.param)
        }

        const {createdAt, updatedAt, ...cleanedFilter} = filterRow
        return cleanedFilter
      }),
    )

    return processedFilters.filter((filter) => filter != null)
  } catch (error) {
    console.error(`Ошибка при загрузке фильтров для savedFilterId=${savedFilterId}:`, error)
    return []
  }
}

export async function getSavedFilters() {
  const itemsStore = useItemsStore()

  try {
    const ENV = itemsStore?.environment || {}

    const response = await apiClient.post('/api/SavedFilter/findAll', {
      mediaTypeId: ENV.media_type_id || null,
      metaId: ENV.meta_id || null,
      tagId: ENV.tag_id || null,
      tabId: ENV.tab_id || null,
    })

    if (itemsStore) {
      itemsStore.filters_saved = response.data || []
    }

    if (itemsStore?.filters_saved) {
      const filterPromises = itemsStore.filters_saved.map(async (filter) => {
        filter.filters = await getFilters(filter.id)
        return filter
      })

      await Promise.all(filterPromises)
    }

    return itemsStore?.filters_saved || []
  } catch (error) {
    console.error('Ошибка при загрузке сохраненных фильтров:', error)
    return []
  }
}
