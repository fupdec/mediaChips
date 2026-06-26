import {computed, watch, onMounted, onBeforeUnmount, nextTick, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {
  getDefaultMediaTypeId,
  isAudioMediaType,
  isImageMediaType,
  isTextMediaType,
  isVideoMediaType,
} from '@/utils/mediaType'
import {openPath} from '@/services/shellService'

export function useItemsPageEvents({
  props,
  mediaType,
  meta,
  loader,
  total,
  totalInDb,
  is_infinite_scroll,
  init,
  loadSavedFilters,
  updatePageSetting,
  getFilters,
  getPinnedMeta,
  getItemsFromDb,
  getEntitiesOnPage,
  bindMediaInfiniteScroll,
  unbindMediaInfiniteScroll,
  disposeListFetching,
  maybeLoadMoreIfNearBottom,
  refreshScrollRoot,
}) {
  const itemsStore = useItemsStore()
  const appStore = useAppStore()
  const router = useRouter()
  const eventBus = useEventBus()

  const ITEMS = computed(() => itemsStore)
  let initPromise = null
  const pageInitialized = ref(false)

  const runInitSafely = async () => {
    if (initPromise) {
      return initPromise
    }

    pageInitialized.value = false

    initPromise = (async () => {
      try {
        await init()
        loadSavedFilters()
      } catch (error) {
        console.error('Failed to initialize items page:', error)
      } finally {
        loader.value.is_busy = false
        pageInitialized.value = true
        initPromise = null
      }
    })()

    return initPromise
  }

  const handleGetItemsFromDb = (event) => {
    const {ids, type} = event
    if (props.items_type !== type) return
    if (Array.isArray(ids) && ids.length === 0 && loader.value.is_busy) {
      return
    }
    getItemsFromDb(ids)
  }

  const handleSetItemsFilters = async (event) => {
    const val = event
    itemsStore.updateState({key: 'page', value: 1})
    await updatePageSetting({
      page: 1,
      query: val,
    })
    await getFilters()
    await getItemsFromDb()
  }

  const handleSetItemsLimit = (event) => {
    const val = event
    itemsStore.updateState({
      key: 'page',
      value: 1,
    })
    if (val == 101) itemsStore.updateState({key: 'itemsOnPage', value: []})
    updatePageSetting({
      page: 1,
      limit: val,
    })

    if (props.items_type === 'media') {
      getItemsFromDb()
      return
    }

    getEntitiesOnPage()
  }

  const handleRemoveEntitiesFromState = (event) => {
    const {ids, type} = event
    if (type !== props.items_type) return

    if (props.items_type === 'media') {
      for (const id of ids) {
        itemsStore.removeItem(id)
      }
      total.value = ITEMS.value.totalFiltered
      totalInDb.value = Math.max(0, totalInDb.value - ids.length)
      return
    }

    getEntitiesOnPage(ids)
  }

  const handleSetItemsSortDir = (event) => {
    itemsStore.updateState({
      key: 'page',
      value: 1,
    })
    updatePageSetting({
      page: 1,
      sortDir: event,
    })
    getItemsFromDb()
  }

  const handleSetItemsSortBy = (event) => {
    itemsStore.updateState({
      key: 'page',
      value: 1,
    })
    updatePageSetting({
      page: 1,
      sortBy: event,
    })
    getItemsFromDb()
  }

  const handleSetItemsView = (event) => {
    const val = event
    updatePageSetting({
      view: val,
    })
  }

  const handleUpdateAssignedMeta = async () => {
    await getPinnedMeta()
  }

  const handleOpenRandomItem = (event) => {
    const id = event
    const navigationPool = ITEMS.value.navigationItems.length
      ? ITEMS.value.navigationItems
      : ITEMS.value.entities

    if (props.items_type === 'tag') {
      const url = `/tag?metaId=${meta.value.id}&tagId=${id}&mediaTypeId=${getDefaultMediaTypeId(appStore.mediaTypes)}`
      router.push(url)
    } else if (props.items_type === 'media') {
      const media = navigationPool.find((i) => i.id === id)
      if (isImageMediaType(mediaType.value)) {
        itemsStore.viewImage({image: media})
      } else if (isVideoMediaType(mediaType.value) || isAudioMediaType(mediaType.value)) {
        itemsStore.playVideo({
          video: media,
        })
      } else if (isTextMediaType(mediaType.value) && media?.path) {
        openPath(media.path)
      }
    }
  }

  const eventHandlers = [
    ['getItemsFromDb', handleGetItemsFromDb],
    ['setItemsFilters', handleSetItemsFilters],
    ['setItemsLimit', handleSetItemsLimit],
    ['removeEntitiesFromState', handleRemoveEntitiesFromState],
    ['setItemsSortDir', handleSetItemsSortDir],
    ['setItemsSortBy', handleSetItemsSortBy],
    ['setItemsView', handleSetItemsView],
    ['updateAssignedMeta', handleUpdateAssignedMeta],
    ['openRandomItem', handleOpenRandomItem],
  ]

  const bindEvents = () => {
    for (const [name, handler] of eventHandlers) {
      eventBus.on(name, handler)
    }
  }

  const unbindEvents = () => {
    for (const [name, handler] of eventHandlers) {
      eventBus.off(name, handler)
    }
  }

  onMounted(async () => {
    itemsStore.updateState({key: 'isSelect', value: false})
    itemsStore.updateState({key: 'selection', value: []})

    if (props.items_type === 'media' && ITEMS.value.limit === 101) {
      itemsStore.updateState({key: 'page', value: 1})
    }

    bindEvents()

    await nextTick()
    await nextTick()
    await runInitSafely()

    refreshScrollRoot()

    if (props.items_type === 'media' && is_infinite_scroll.value) {
      await nextTick()
      maybeLoadMoreIfNearBottom()
    }

    bindMediaInfiniteScroll()
  })

  onBeforeUnmount(() => {
    pageInitialized.value = false
    disposeListFetching()
    unbindMediaInfiniteScroll()
    if (is_infinite_scroll.value) updatePageSetting({page: 1})
    itemsStore.updateState({
      key: 'isFiltersLoaded',
      value: false,
    })

    itemsStore.find_duplicates = false

    unbindEvents()
  })

  watch(() => ITEMS.value.size, (val, old) => {
    if (val === old) return
    updatePageSetting({size: val})
  })

  watch(is_infinite_scroll, () => {
    bindMediaInfiniteScroll()
  })

  watch(
    () => [props.items_type, props.mediaTypeId, props.metaId, props.tagId, props.tabId],
    async (next, prev) => {
      if (!prev) return
      if (JSON.stringify(next) === JSON.stringify(prev)) return
      if (props.items_type === 'media' && !props.mediaTypeId) return
      if (props.items_type === 'tag' && !props.metaId) return

      await runInitSafely()
    },
  )

  return {
    pageInitialized,
  }
}
