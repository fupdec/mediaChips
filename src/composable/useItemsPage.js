import {ref, computed, nextTick} from 'vue'
import _ from 'lodash'
import {useI18n} from 'vue-i18n'
import {useItemsStore} from '@/stores/items'
import {apiClient} from '@/services/apiClient'
import {scrollMainTo, getMainScrollEl} from '@/utils/mainScroll'
import {
  getDuplicatesGroupKey,
  normalizeSortBy,
} from '@/utils/mediaSortFilter'

export const INFINITE_PAGE_SIZE = 25

export function getNextInfiniteMediaPage(itemCount, pageSize = INFINITE_PAGE_SIZE) {
  if (!itemCount) return 1
  return Math.floor(itemCount / pageSize) + 1
}

export function isAbortError(error) {
  return error?.code === 'ERR_CANCELED'
    || error?.name === 'CanceledError'
}

export function useItemsPage({
  props,
  mediaType,
  container,
  updatePageSetting,
}) {
  const itemsStore = useItemsStore()
  const {t} = useI18n()

  const total = ref(1)
  const totalInDb = ref(0)
  const pages = ref(0)
  const loader = ref({
    show: false,
    timeout: 0,
    is_busy: false,
  })
  const is_not_full_height = ref(false)
  const isLoadingMore = ref(false)
  const scrollRoot = ref(null)

  let listFetchSeq = 0
  let listAbortController = null
  let mediaScrollEl = null

  const ITEMS = computed(() => itemsStore)
  const is_infinite_scroll = computed(() => ITEMS.value.limit === 101)
  const showPagination = computed(() => (
    ITEMS.value.itemsOnPage.length > 0 && !is_infinite_scroll.value && pages.value > 0
  ))
  const paginationPage = computed({
    get: () => ITEMS.value.page,
    set: (value) => {
      itemsStore.updateState({key: 'page', value})
    },
  })
  const paginationJumpPage = computed({
    get: () => ITEMS.value.jumpPage,
    set: (value) => {
      itemsStore.updateState({key: 'jumpPage', value})
    },
  })

  const abortPendingListFetch = () => {
    listAbortController?.abort()
    listAbortController = null
  }

  const resetMediaListState = () => {
    itemsStore.updateState({key: 'itemsOnPage', value: []})
    itemsStore.updateState({key: 'entities', value: []})
    itemsStore.updateState({key: 'navigationItems', value: []})
    itemsStore.updateState({key: 'totalFiltered', value: 0})
    total.value = 0
    totalInDb.value = 0
  }

  const applyMediaListResponse = (response, {append = false, requestedPage = 1} = {}) => {
    const pageItems = response.data.items || []
    const responseTotalFiltered = response.data.totalFiltered

    if (
      !append
      && pageItems.length === 0
      && responseTotalFiltered != null
      && responseTotalFiltered > 0
      && requestedPage <= 1
    ) {
      return false
    }

    if (response.data.navigation) {
      itemsStore.updateState({
        key: 'navigationItems',
        value: response.data.navigation,
      })
    }

    if (response.data.totalFiltered != null) {
      itemsStore.updateState({
        key: 'totalFiltered',
        value: response.data.totalFiltered,
      })
      total.value = response.data.totalFiltered
    } else if (!append) {
      itemsStore.updateState({
        key: 'totalFiltered',
        value: pageItems.length,
      })
      total.value = pageItems.length
    }

    if (response.data.totalFilesize != null) {
      itemsStore.updateState({
        key: 'totalFilesize',
        value: response.data.totalFilesize || 0,
      })
    }

    if (response.data.total != null) {
      totalInDb.value = response.data.total || 0
    }

    if (response.data.pages != null) {
      pages.value = response.data.pages || 1
    }

    const nextItems = append
      ? _.uniqBy([...ITEMS.value.itemsOnPage, ...pageItems], 'id')
      : pageItems

    itemsStore.updateState({key: 'entities', value: nextItems})
    itemsStore.updateState({key: 'itemsOnPage', value: nextItems})
    itemsStore.updateState({key: 'isFiltersLoaded', value: true})
    return true
  }

  const getItemsFromDb = async (ids) => {
    let url = '/api/'
    const query = {}

    if (props.items_type === 'tag') {
      url += 'tag/items/'
      query.metaId = props.metaId
    } else if (props.items_type === 'media') {
      url += 'media/items'
      query.mediaTypeId = props.mediaTypeId
    }

    query.filters = _.cloneDeep(ITEMS.value.filters || [])
    query.sortBy = normalizeSortBy(
      ITEMS.value.sortBy || 'id',
      props.items_type,
      mediaType.value,
      'createdAt',
    ) || 'id'
    query.direction = ITEMS.value.sortDir || 'desc'
    query.find_duplicates = ITEMS.value.find_duplicates || false

    if (props.items_type === 'media') {
      query.duplicates_by = getDuplicatesGroupKey(mediaType.value)
    }

    query.ids = ids || []

    const appendMediaPage = props.items_type === 'media'
      && is_infinite_scroll.value
      && ITEMS.value.page > 1
      && ITEMS.value.itemsOnPage.length > 0
      && (!ids || !ids.length)

    if (props.items_type === 'media') {
      query.includeNavigation = false
      const pageLimit = is_infinite_scroll.value ? INFINITE_PAGE_SIZE : ITEMS.value.limit

      if (is_infinite_scroll.value && !appendMediaPage && (!ids || !ids.length)) {
        itemsStore.updateState({key: 'page', value: 1})
        query.page = 1
      } else {
        query.page = ITEMS.value.page || 1
      }

      query.limit = pageLimit
      query.skipTotals = appendMediaPage
    }

    if (ids && ids.length > 0) {
      query.filters = []
      try {
        const res = await apiClient.post(url, query)

        for (const id of ids) {
          const item = res.data.items.find((entry) => Number(entry.id) === Number(id))
          itemsStore.updateItem({id, item})
        }
      } catch (e) {
        console.error('Error fetching specific items:', e)
      } finally {
        loader.value.is_busy = false
      }
      return
    }

    abortPendingListFetch()
    const requestSeq = ++listFetchSeq
    const abortController = new AbortController()
    listAbortController = abortController

    if (!appendMediaPage) {
      itemsStore.updateState({key: 'isFiltersLoaded', value: false})
      loader.value.is_busy = true
      loader.value.show = false
    }

    const postListQuery = (payload, signal) => apiClient.post(url, payload, {signal})

    try {
      let response = await postListQuery(query, abortController.signal)

      if (requestSeq !== listFetchSeq) {
        return
      }

      if (!appendMediaPage) {
        clearTimeout(loader.value.timeout)
        loader.value.timeout = setTimeout(() => {
          loader.value.show = true
        }, 500)
      }

      if (props.items_type === 'media') {
        const previousCount = appendMediaPage ? ITEMS.value.itemsOnPage.length : 0
        let applied = applyMediaListResponse(response, {
          append: appendMediaPage,
          requestedPage: query.page,
        })

        if (
          !applied
          && !appendMediaPage
          && query.page === 1
          && requestSeq === listFetchSeq
        ) {
          query.page = 1
          itemsStore.updateState({key: 'page', value: 1})
          response = await postListQuery(query, abortController.signal)
          if (requestSeq === listFetchSeq) {
            applied = applyMediaListResponse(response, {
              append: false,
              requestedPage: 1,
            })
          }
        }

        if (!applied && requestSeq === listFetchSeq) {
          return
        }

        if (response.data.page != null) {
          itemsStore.updateState({key: 'page', value: response.data.page})
        }

        if (appendMediaPage && response.data.items?.length === 0) {
          itemsStore.updateState({
            key: 'totalFiltered',
            value: ITEMS.value.itemsOnPage.length,
          })
          total.value = ITEMS.value.itemsOnPage.length
        } else if (appendMediaPage && ITEMS.value.itemsOnPage.length === previousCount) {
          itemsStore.updateState({
            key: 'totalFiltered',
            value: ITEMS.value.itemsOnPage.length,
          })
          total.value = ITEMS.value.itemsOnPage.length
        } else if (appendMediaPage) {
          await nextTick()
          maybeLoadMoreIfNearBottom()
        } else if (is_infinite_scroll.value) {
          await nextTick()
          maybeLoadMoreIfNearBottom()
        }
      } else {
        itemsStore.updateState({
          key: 'entities',
          value: response.data.items || [],
        })
        totalInDb.value = response.data.total || 0
        itemsStore.updateState({key: 'itemsOnPage', value: []})

        if (is_infinite_scroll.value) {
          itemsStore.updateState({key: 'page', value: 1})
        }

        getEntitiesOnPage()
      }
    } catch (error) {
      if (isAbortError(error) || requestSeq !== listFetchSeq) {
        return
      }

      itemsStore.updateState({key: 'isFiltersLoaded', value: true})

      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification(t('notifications_text.server_error_logs'), 'error')
      }

      if (props.items_type === 'media') {
        resetMediaListState()
      } else {
        itemsStore.updateState({key: 'entities', value: []})
        totalInDb.value = 0
        getEntitiesOnPage()
      }

      throw error
    } finally {
      if (requestSeq === listFetchSeq) {
        loader.value.is_busy = false
      }
    }
  }

  const getEntitiesOnPage = (ids_remove = []) => {
    for (const id of ids_remove) {
      itemsStore.removeItem(id)
      totalInDb.value -= 1
    }

    const container_height = container.value?.clientHeight || 100
    const difference_height = window.screen.height - container_height + 48
    is_not_full_height.value = difference_height > 0

    const items = ITEMS.value.entities
    total.value = items.length
    itemsStore.updateState({key: 'totalFiltered', value: items.length})

    const limit = is_infinite_scroll.value ? INFINITE_PAGE_SIZE : ITEMS.value.limit
    const pagesCount = Math.ceil(total.value / limit)
    pages.value = pagesCount

    if (ITEMS.value.page > pagesCount) {
      itemsStore.updateState({key: 'page', value: 1})
    }

    const start = (ITEMS.value.page - 1) * limit
    const end = start + limit
    const new_items_on_page = items.slice(start, end)

    const items_concat = is_infinite_scroll.value
      ? _.uniqBy([...ITEMS.value.itemsOnPage, ...new_items_on_page], 'id')
      : new_items_on_page

    itemsStore.updateState({key: 'itemsOnPage', value: items_concat})
    itemsStore.updateState({key: 'isFiltersLoaded', value: true})
  }

  const scrollTop = () => {
    scrollMainTo({top: 0, behavior: 'smooth'})
  }

  const changePage = (val) => {
    itemsStore.updateState({key: 'page', value: val})

    if (props.items_type === 'media') {
      updatePageSetting({page: val})
      getItemsFromDb()
      scrollTop()
      return
    }

    getEntitiesOnPage()
    updatePageSetting({page: val})
    scrollTop()
  }

  const jumpToPage = (value = ITEMS.value.jumpPage) => {
    if (value === null || value === undefined) return

    let val = Number(value)
    if (val < 1) val = 1
    else if (val > pages.value) val = pages.value

    if (val !== ITEMS.value.page) {
      itemsStore.updateState({key: 'page', value: val})
    }

    itemsStore.updateState({key: 'jumpPage', value: val})
    changePage(val)
  }

  const refreshScrollRoot = () => {
    scrollRoot.value = getMainScrollEl()
    return scrollRoot.value
  }

  const loadNextInfinitePage = async () => {
    if (!is_infinite_scroll.value) return
    if (loader.value.is_busy || isLoadingMore.value) return
    if (ITEMS.value.totalFiltered <= 0) return
    if (ITEMS.value.itemsOnPage.length >= ITEMS.value.totalFiltered) return

    isLoadingMore.value = true
    try {
      if (props.items_type === 'media') {
        itemsStore.updateState({
          key: 'page',
          value: getNextInfiniteMediaPage(ITEMS.value.itemsOnPage.length),
        })
        await getItemsFromDb()
      } else {
        itemsStore.updateState({
          key: 'page',
          value: ITEMS.value.page + 1,
        })
        getEntitiesOnPage()
      }
    } finally {
      isLoadingMore.value = false
    }
  }

  const maybeLoadMoreIfNearBottom = () => {
    if (!is_infinite_scroll.value) return
    if (loader.value.is_busy || isLoadingMore.value) return
    if (ITEMS.value.totalFiltered <= 0) return
    if (ITEMS.value.itemsOnPage.length >= ITEMS.value.totalFiltered) return

    const el = refreshScrollRoot() || getMainScrollEl()
    if (!el) return

    const threshold = 400
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
    const shortPage = el.scrollHeight <= el.clientHeight + threshold

    if (nearBottom || shortPage) {
      loadNextInfinitePage()
    }
  }

  const infiniteScrolling = (isIntersecting) => {
    if (isIntersecting === false) return
    loadNextInfinitePage()
  }

  const infiniteIntersectOptions = computed(() => ({
    handler: infiniteScrolling,
    options: {
      root: scrollRoot.value,
      rootMargin: '400px 0px',
      threshold: 0,
    },
  }))

  const onMediaInfiniteScroll = _.throttle(() => {
    if (!is_infinite_scroll.value || props.items_type !== 'media') return
    const el = getMainScrollEl()
    if (!el) return

    const threshold = 400
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
    if (nearBottom) loadNextInfinitePage()
  }, 150)

  const bindMediaInfiniteScroll = () => {
    unbindMediaInfiniteScroll()
    if (!is_infinite_scroll.value || props.items_type !== 'media') return
    mediaScrollEl = refreshScrollRoot()
    mediaScrollEl?.addEventListener('scroll', onMediaInfiniteScroll, {passive: true})
  }

  const unbindMediaInfiniteScroll = () => {
    if (mediaScrollEl) {
      mediaScrollEl.removeEventListener('scroll', onMediaInfiniteScroll)
      mediaScrollEl = null
    }
    onMediaInfiniteScroll.cancel()
  }

  const disposeListFetching = () => {
    abortPendingListFetch()
    listFetchSeq += 1
  }

  return {
    total,
    totalInDb,
    pages,
    loader,
    isLoadingMore,
    is_not_full_height,
    scrollRoot,
    is_infinite_scroll,
    showPagination,
    paginationPage,
    paginationJumpPage,
    infiniteIntersectOptions,
    getItemsFromDb,
    getEntitiesOnPage,
    changePage,
    jumpToPage,
    scrollTop,
    resetMediaListState,
    abortPendingListFetch,
    disposeListFetching,
    bindMediaInfiniteScroll,
    unbindMediaInfiniteScroll,
    maybeLoadMoreIfNearBottom,
    refreshScrollRoot,
  }
}
