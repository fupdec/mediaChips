import _ from 'lodash'
import { parseCountries } from '@/utils/country'
import { parseExtList } from '@/utils/ext'
import { useItemsStore } from '@/stores/items'
import { apiClient } from '@/services/apiClient'
import type { FilterObject } from '@/types/common'
import type { SavedFilter } from '@/types/stores'

function normalizeFilterParam(param: unknown) {
  if (param === null || param === undefined) return param
  if (typeof param === 'number' && Number.isFinite(param)) return param

  const trimmed = String(param).trim()
  if (!trimmed) return param
  if (/^\d+$/.test(trimmed)) return Number(trimmed)

  const num = Number(trimmed)
  if (Number.isFinite(num) && Number.isInteger(num)) return num

  return param
}

export async function getFilters(savedFilterId: number | string) {
  if (!savedFilterId) {
    console.warn('getFilters вызван без savedFilterId')
    return []
  }

  try {
    const response = await apiClient.get<Array<{ filterRow?: FilterObject & Record<string, unknown> }>>(
      `/api/FilterRowsInSavedFilter?filterId=${savedFilterId}`,
    )

    const filters = response.data || []

    const processedFilters = await Promise.all(
      filters.map(async (filterItem) => {
        const filterRow = _.cloneDeep(filterItem.filterRow || {}) as FilterObject & Record<string, unknown>

        if (filterRow.type !== 'array') {
          return filterRow
        }

        if (filterRow.param === 'country' && filterRow.val) {
          filterRow.val = parseCountries(String(filterRow.val))
          return filterRow
        }

        if (filterRow.param === 'ext') {
          filterRow.val = parseExtList(String(filterRow.val))
          return filterRow
        }

        if (filterRow.type === 'array' && filterRow.param !== 'country' && filterRow.param !== 'ext') {
          try {
            const tagsResponse = await apiClient.get<Array<{ tagId: number }>>(
              `/api/TagsInFilterRow?rowId=${filterRow.id}`,
            )

            const tags = tagsResponse.data || []
            filterRow.val = tags.length > 0 ? tags.map((tag) => tag.tagId) : []
          } catch (tagsError) {
            console.error(`Ошибка при загрузке тегов для фильтра ${filterRow.id}:`, tagsError)
            filterRow.val = []
          }
        }

        if (filterRow.param != null) {
          filterRow.param = normalizeFilterParam(filterRow.param) as string | null
        }

        const { createdAt, updatedAt, ...cleanedFilter } = filterRow as FilterObject & {
          createdAt?: unknown
          updatedAt?: unknown
        }
        return cleanedFilter
      }),
    )

    return processedFilters.filter((filter): filter is FilterObject => filter != null)
  } catch (error) {
    console.error(`Ошибка при загрузке фильтров для savedFilterId=${savedFilterId}:`, error)
    return []
  }
}

export async function getSavedFilters() {
  const itemsStore = useItemsStore()

  try {
    const ENV = itemsStore?.environment || {}

    const response = await apiClient.post<SavedFilter[]>('/api/SavedFilter/findAll', {
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
        filter.filters = await getFilters(filter.id as number)
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
