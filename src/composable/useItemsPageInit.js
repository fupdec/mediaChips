import {ref, computed} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import _ from 'lodash'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {apiClient} from '@/services/apiClient'
import {getFilterObject} from '@/services/formatUtils'
import {getFilters as loadSavedFilterRows, getSavedFilters} from '@/services/filterService'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
import {normalizeSortBy} from '@/utils/mediaSortFilter'

export function useItemsPageInit({
  props,
  mediaType,
  meta,
}) {
  const appStore = useAppStore()
  const itemsStore = useItemsStore()
  const {t} = useI18n()
  const route = useRoute()

  const isFiltersReady = ref(false)

  const ITEMS = computed(() => itemsStore)
  const ENV = computed(() => ITEMS.value.environment)
  const apiUrl = computed(() => appStore.localhost)

  const updatePageSetting = async (data) => {
    await apiClient.put('/api/PageSetting', {
      data,
      query: {
        tagId: props.tagId,
        mediaTypeId: props.mediaTypeId,
        metaId: props.metaId,
        tabId: props.tabId,
      },
    })
  }

  const getMeta = async () => {
    await apiClient
      .get(`/api/meta/${props.metaId}`)
      .then((res) => {
        const metaData = _.cloneDeep(res.data)
        meta.value = metaData
        itemsStore.updateState({key: 'meta', value: metaData})
        itemsStore.updateState({key: 'name', value: metaData.name})
        itemsStore.updateState({key: 'icon', value: metaData.icon})
      })
      .catch((e) => {
        console.log(e)
      })
  }

  const getMediaType = async () => {
    await apiClient
      .get(`/api/MediaType/${props.mediaTypeId}`)
      .then((res) => {
        mediaType.value = res.data
        itemsStore.updateState({key: 'name', value: getMediaTypeName(res.data, t)})
        itemsStore.updateState({key: 'icon', value: res.data.icon})
      })
      .catch((e) => {
        console.log(e)
      })
  }

  const initFilterForTagPage = () => {
    const index = ITEMS.value.filters.findIndex(
      (i) => i.param == meta.value?.id && i.lock == true
    )

    if (index < 0) {
      const metaIdParam = route.query.metaId ? +route.query.metaId : null
      const fltr = getFilterObject({
        param: metaIdParam,
        type: 'array',
        cond: 'in all',
        lock: true,
        val: [Number(props.tagId)],
      })
      itemsStore.updateState({
        key: 'filters',
        value: [...ITEMS.value.filters, fltr],
      })
    }
  }

  const getFilters = async () => {
    let savedFilter = {}

    await apiClient.post('/api/SavedFilter', {
      name: null,
      mediaTypeId: ENV.value.media_type_id,
      metaId: ENV.value.meta_id,
      tagId: ENV.value.tag_id,
      tabId: ENV.value.tab_id,
    })
      .then((res) => {
        savedFilter = res.data[0]
      })
      .catch((e) => {
        console.log(e)
      })

    if (_.isEmpty(savedFilter)) {
      return
    }

    const filters = await loadSavedFilterRows(savedFilter.id)

    itemsStore.updateState({key: 'filters', value: filters})
    itemsStore.updateState({key: 'savedFilter', value: savedFilter})

    if (props.tagId) {
      initFilterForTagPage()
    }

    itemsStore.updateState({key: 'isFiltersLoaded', value: true})
  }

  const getPageSettings = async () => {
    await apiClient.post('/api/PageSetting', {
      tagId: props.tagId,
      mediaTypeId: props.mediaTypeId,
      metaId: props.metaId,
      tabId: props.tabId,
    })
      .then((res) => {
        if (!res.data?.[0]) return

        const vals = ['page', 'limit', 'size', 'view', 'sortBy', 'sortDir']

        for (const i of vals) {
          let value = res.data[0][i]
          if (value === undefined || value === null) continue

          if (i === 'page' && props.items_type === 'media' && Number(res.data[0].limit) === 101) {
            value = 1
          }

          if (i === 'sortBy' && props.items_type === 'media') {
            value = normalizeSortBy(value, props.items_type, mediaType.value, 'createdAt')
          }
          itemsStore.updateState({
            key: i,
            value,
          })
        }

        if (
          props.items_type === 'media' &&
          res.data[0].sortBy &&
          res.data[0].sortBy !== itemsStore.sortBy
        ) {
          updatePageSetting({sortBy: itemsStore.sortBy})
        }

        if (res.data[1]) {
          updatePageSetting({filterId: ITEMS.value.savedFilter?.id})
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }

  const getPinnedMeta = async () => {
    let url = '/api/'
    if (props.items_type === 'media') {
      url += `MetaInMediaType?mediaTypeId=${props.mediaTypeId}`
    } else if (props.items_type === 'tag') {
      url += `PinnedMeta?metaId=${props.metaId}`
    }

    await apiClient
      .get(url)
      .then((res) => {
        itemsStore.updateState({
          key: 'assigned',
          value: res.data,
        })
        isFiltersReady.value = true
      })
      .catch((e) => {
        console.log(e)
      })
  }

  const loadSavedFilters = () => {
    getSavedFilters().catch((error) => {
      console.error('Failed to load saved filters:', error)
    })
  }

  const init = async ({
    disposeListFetching,
    resetMediaListState,
    getItemsFromDb,
  }) => {
    if (!apiUrl.value) {
      return
    }
    if (props.items_type === 'media' && !props.mediaTypeId) {
      return
    }
    if (props.items_type === 'tag' && !props.metaId) {
      return
    }

    itemsStore.updateState({key: 'type', value: props.items_type})

    disposeListFetching()

    if (props.items_type === 'media') {
      resetMediaListState()
    }

    if (props.items_type === 'tag') {
      await getMeta()
      if (!props.tagId && meta.value?.id) {
        await itemsStore.countViewNumber(meta.value, 'meta')
      }
    } else if (props.items_type === 'media') {
      await getMediaType()
    }

    await getFilters()
    await getPageSettings()
    await getPinnedMeta()
    await getItemsFromDb()
  }

  return {
    isFiltersReady,
    updatePageSetting,
    init,
    loadSavedFilters,
    getFilters,
    getPinnedMeta,
  }
}
