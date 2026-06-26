<script setup>
import {ref, computed, nextTick, onMounted, onBeforeUnmount, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useHotkey} from 'vuetify'
import {useI18n} from 'vue-i18n'
import {apiClient} from '@/services/apiClient'
import _ from 'lodash'
import {useEventBus} from '@/utils/eventBus'
import AppBarButton from '@/components/app/appbar/AppBarButton.vue'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {usePlayerStore} from '@/stores/player'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
import {getDefaultMediaTypeId, isAudioMediaType, isImageMediaType, isTextMediaType, isVideoMediaType} from '@/utils/mediaType'
import {highlightChars} from '@/services/formatUtils'
import {hideHoverImage, showHoverImage} from '@/services/hoverService'
import {openPath} from '@/services/shellService'

const {t} = useI18n()
const eventBus = useEventBus()
const router = useRouter()

useHotkey('slash', () => {
  if (playerStore.active) return
  showSearch()
})

const app = useAppStore()
const itemsStore = useItemsStore()
const playerStore = usePlayerStore()
const meta = computed(() => app.meta)
const mediaTypes = computed(() => app.mediaTypes)

const dialog = ref(false)
const query = ref('')
const loading = ref(false)
const results = ref([])
const searchField = ref(null)
const resultsScroller = ref(null)
const selectedIndex = ref(-1)

let abortController = null
const RESULT_LIMIT = 200
const ROW_HEIGHT = 30
const RESULTS_MAX_HEIGHT = 480

const totalResults = computed(() =>
  results.value.reduce((sum, group) => sum + group.data.length, 0),
)

const flatResults = computed(() => {
  const flat = []

  for (const group of results.value) {
    flat.push({kind: 'header', group, id: `h-${group.group_id}`})

    for (const item of group.data) {
      flat.push({
        kind: 'item',
        group,
        item,
        id: `${group.group_id}-${item.id}`,
      })
    }
  }

  return flat
})

const resultsScrollHeight = computed(() => {
  const contentHeight = flatResults.value.length * ROW_HEIGHT
  return Math.min(Math.max(contentHeight, 120), RESULTS_MAX_HEIGHT)
})

const navigableIndices = computed(() =>
  flatResults.value.reduce((indices, row, index) => {
    if (row.kind === 'item') indices.push(index)
    return indices
  }, []),
)

const status = computed(() => {
  const q = query.value.trim()
  if (!q) return t('globalSearch.startTyping')
  if (loading.value) return t('globalSearch.loading')
  if (!results.value.length) return t('globalSearch.noResult')
  return t('globalSearch.resultsCount', {count: totalResults.value})
})

function escapeLike(value) {
  return value.replace(/'/g, "''")
}

function showSearch() {
  dialog.value = true
  query.value = ''
  results.value = []
  focusSearchField()
}

onMounted(() => {
  eventBus.on('showGlobalSearch', showSearch)
})

onBeforeUnmount(() => {
  eventBus.off('showGlobalSearch', showSearch)
  abortController?.abort()
  runSearch.cancel()
})

async function focusSearchField() {
  await nextTick()
  searchField.value?.focus()
  setTimeout(() => searchField.value?.focus(), 50)
}

function resetState() {
  abortController?.abort()
  runSearch.cancel()
  query.value = ''
  results.value = []
  loading.value = false
  selectedIndex.value = -1
}

function hide() {
  dialog.value = false
  resetState()
}

function onDialogClose() {
  resetState()
}

function buildMediaGroups(data) {
  const grouped = _.groupBy(data, 'mediaTypeId')

  return Object.keys(grouped).map(id => {
    const type = mediaTypes.value.find(item => item.id == id)
    if (!type) return null

    return {
      data: grouped[id],
      name: getMediaTypeName(type, t),
      icon: type.icon,
      mediaTypeId: type.id,
      is_media: true,
      group_id: `media-${type.id}`,
    }
  }).filter(Boolean)
}

function buildTagGroups(data) {
  const grouped = _.groupBy(data, 'metaId')

  return Object.keys(grouped).map(metaId => {
    const m = meta.value.find(item => item.id == metaId)
    if (!m) return null

    return {
      data: grouped[metaId],
      name: m.name,
      icon: m.icon,
      metaId: m.id,
      is_media: false,
      group_id: `meta-${m.id}`,
    }
  }).filter(Boolean)
}

function sortGroups(groups) {
  return groups.sort((a, b) => {
    if (a.is_media !== b.is_media) return a.is_media ? -1 : 1

    if (a.is_media) {
      const ai = mediaTypes.value.findIndex(item => item.id === a.mediaTypeId)
      const bi = mediaTypes.value.findIndex(item => item.id === b.mediaTypeId)
      return ai - bi
    }

    const ai = meta.value.findIndex(item => item.id === a.metaId)
    const bi = meta.value.findIndex(item => item.id === b.metaId)
    return ai - bi
  })
}

async function search() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    loading.value = false
    return
  }

  if (!mediaTypes.value.length || !meta.value.length) {
    loading.value = false
    return
  }

  abortController?.abort()
  abortController = new AbortController()
  const {signal} = abortController

  loading.value = true
  results.value = []
  selectedIndex.value = -1

  const escaped = escapeLike(q)

  try {
    const [mediaRes, tagRes] = await Promise.all([
      apiClient.post(
        '/api/media/search',
        {
          query: `
            SELECT media.*,
              COALESCE(videoMetadata.width, imageMetadata.width) AS width,
              COALESCE(videoMetadata.height, imageMetadata.height) AS height
            FROM media
            LEFT JOIN videoMetadata ON media.id = videoMetadata.mediaId
            LEFT JOIN imageMetadata ON media.id = imageMetadata.mediaId
            WHERE media.name LIKE '%${escaped}%'
            LIMIT ${RESULT_LIMIT}
          `,
        },
        {signal},
      ),
      apiClient.post(
        '/api/tag/search',
        {
          query: `
            SELECT *
            FROM tags
            WHERE name LIKE '%${escaped}%'
               OR synonyms LIKE '%${escaped}%'
            LIMIT ${RESULT_LIMIT}
          `,
        },
        {signal},
      ),
    ])

    if (signal.aborted) return

    const mediaGroups = buildMediaGroups(mediaRes.data[0] || [])
    const tagGroups = buildTagGroups(tagRes.data[0] || [])
    results.value = sortGroups([...mediaGroups, ...tagGroups])
  } catch (e) {
    if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return
    console.error(e)
  } finally {
    if (!signal.aborted) loading.value = false
  }
}

const runSearch = _.debounce(search, 250)

function onQueryInput() {
  if (!query.value.trim()) {
    abortController?.abort()
    runSearch.cancel()
    results.value = []
    loading.value = false
    selectedIndex.value = -1
    return
  }

  loading.value = true
  selectedIndex.value = -1
  runSearch()
}

watch(query, (value) => {
  if (!value) onQueryInput()
})

function openGroup(group) {
  if (group.is_media) openMediaPage(group.mediaTypeId)
  else openMeta(group.metaId)
}

function openMedia(media, mediaTypeId) {
  const type = mediaTypes.value.find(item => item.id === Number(mediaTypeId || media.mediaTypeId))

  if (isImageMediaType(type)) {
    itemsStore.viewImage({image: media})
  } else if (isVideoMediaType(type) || isAudioMediaType(type)) {
    itemsStore.playVideo({video: media})
  } else if (isTextMediaType(type) && media.path) {
    openPath(media.path)
  } else {
    router.push(`/media?mediaTypeId=${mediaTypeId || media.mediaTypeId}`)
  }

  hide()
}

function openMeta(metaId) {
  router.push(`/meta?metaId=${metaId}`)
  hide()
}

function openMediaPage(mediaTypeId) {
  router.push(`/media?mediaTypeId=${mediaTypeId}`)
  hide()
}

function openTag(tag) {
  hideHoverImage()
  router.push(`/tag?metaId=${tag.metaId}&tagId=${tag.id}&mediaTypeId=${getDefaultMediaTypeId(mediaTypes.value)}`)
  hide()
}

function openFirstResult() {
  const row = flatResults.value.find(entry => entry.kind === 'item')
  if (!row) return

  if (row.group.is_media) openMedia(row.item, row.group.mediaTypeId)
  else openTag(row.item)
}

function openSelectedResult() {
  const row = flatResults.value[selectedIndex.value]
  if (!row || row.kind !== 'item') {
    openFirstResult()
    return
  }

  if (row.group.is_media) openMedia(row.item, row.group.mediaTypeId)
  else openTag(row.item)
}

function scrollSelectedIntoView() {
  nextTick(() => {
    if (selectedIndex.value >= 0) {
      resultsScroller.value?.scrollToIndex(selectedIndex.value)
    }
  })
}

function moveSelection(direction) {
  const indices = navigableIndices.value
  if (!indices.length) return

  if (selectedIndex.value === -1) {
    selectedIndex.value = direction > 0 ? indices[0] : indices[indices.length - 1]
  } else {
    const pos = indices.indexOf(selectedIndex.value)
    const nextPos = (pos === -1 ? 0 : pos) + direction

    if (nextPos >= 0 && nextPos < indices.length) {
      selectedIndex.value = indices[nextPos]
    }
  }

  scrollSelectedIntoView()
}

function onSearchKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveSelection(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveSelection(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    openSelectedResult()
  }
}

function onItemMouseenter(row, index) {
  if (row.kind !== 'item') return
  selectedIndex.value = index
}

function showResultHover(event, row) {
  if (row.group.is_media) {
    const type = mediaTypes.value.find(item => item.id === row.group.mediaTypeId)
    showHoverImage(event, row.group.mediaTypeId, row.item.id, 'media', {
      width: row.item.width,
      height: row.item.height,
      isVideo: isVideoMediaType(type),
    })
    return
  }

  showHoverImage(event, row.item.metaId, row.item.id)
}

function getNameHighlighted(text) {
  return highlightChars(text, query.value.trim(), true)
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    max-width="720"
    @after-leave="onDialogClose"
  >
    <template #activator="{ props: activatorProps }">
      <AppBarButton
        v-bind="activatorProps"
        :action="showSearch"
        :text="t('appbar.buttons.search')"
        icon="magnify"
        hotkey="slash"
      />
    </template>

    <v-card class="global-search" rounded="xl">
      <div class="global-search__header pa-4 pb-2">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-h6">{{ t('appbar.globalSearch') }}</div>
          <v-hotkey keys="slash" variant="flat"/>
        </div>

        <v-text-field
          ref="searchField"
          v-model="query"
          @update:model-value="onQueryInput"
          @keydown="onSearchKeydown"
          :placeholder="t('globalSearch.enterText')"
          clearable
          autofocus
          variant="outlined"
          density="compact"
          rounded
          color="primary"
          hide-details
          prepend-inner-icon="mdi-magnify"
        />
      </div>

      <v-divider/>

      <v-card-text class="global-search__body pa-0">
        <div
          class="global-search__status text-center text-medium-emphasis py-3 px-4"
          :class="{'global-search__status--empty': !query.trim() || (!loading && !results.length)}"
        >
          <v-icon
            v-if="!query.trim()"
            class="mb-2"
            size="32"
            color="medium-emphasis"
          >
            mdi-text-search
          </v-icon>
          <v-icon
            v-else-if="!loading && !results.length"
            class="mb-2"
            size="32"
            color="medium-emphasis"
          >
            mdi-file-search-outline
          </v-icon>
          <div class="text-caption">{{ status }}</div>
        </div>

        <v-progress-linear
          v-if="loading"
          color="primary"
          indeterminate
          height="2"
        />

        <v-virtual-scroll
          v-if="flatResults.length"
          ref="resultsScroller"
          :items="flatResults"
          :item-height="ROW_HEIGHT"
          :height="resultsScrollHeight"
          :bench="10"
          item-key="id"
          class="virtual-scroller global-search__results"
        >
          <template #default="{ item: row, index }">
            <div
              v-if="row.kind === 'header'"
              class="global-search__group-header d-flex align-center px-3 text-caption"
              @click="openGroup(row.group)"
            >
              <v-icon size="14" start>mdi-{{ row.group.icon }}</v-icon>
              <span class="font-weight-medium">{{ row.group.name }}</span>
              <v-chip class="ml-2" size="x-small" variant="tonal" color="primary">
                {{ row.group.data.length }}
              </v-chip>
              <v-spacer/>
              <v-icon size="14" class="text-medium-emphasis">mdi-chevron-right</v-icon>
            </div>

            <div
              v-else
              class="global-search__item d-flex align-center px-3 text-caption"
              :class="{'global-search__item--active': index === selectedIndex}"
              @mouseenter="onItemMouseenter(row, index); showResultHover($event, row)"
              @mouseleave.stop="hideHoverImage"
              @click="row.group.is_media
                ? openMedia(row.item, row.group.mediaTypeId)
                : openTag(row.item)"
            >
              <v-icon size="14" class="text-medium-emphasis mr-2">
                mdi-{{ row.group.is_media ? 'file-outline' : 'tag-outline' }}
              </v-icon>

              <div class="global-search__item-title">
                <span v-html="getNameHighlighted(row.item.name)"/>
                <span
                  v-if="!row.group.is_media && row.item.synonyms"
                  class="text-medium-emphasis ml-1"
                  v-html="'; ' + getNameHighlighted(row.item.synonyms)"
                />
              </div>
            </div>
          </template>
        </v-virtual-scroll>
      </v-card-text>

      <v-divider/>

      <v-card-actions class="global-search__footer px-4 py-2 text-caption text-medium-emphasis">
        <v-hotkey keys="esc" variant="flat"/>
        <span class="ml-1">{{ t('globalSearch.hintEsc') }}</span>
        <v-spacer/>
        <v-hotkey keys="up" variant="flat"/>
        <v-hotkey keys="down" variant="flat" class="ml-2"/>
        <span class="ml-1">{{ t('globalSearch.hintArrows') }}</span>
        <v-spacer/>
        <v-hotkey keys="enter" variant="flat"/>
        <span class="ml-1">{{ t('globalSearch.hintEnter') }}</span>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.global-search__header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
}

.global-search__body {
  min-height: 120px;
}

.global-search__results {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.global-search__results :deep(.v-virtual-scroll__item) {
  border-bottom: thin solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}

.global-search__status--empty {
  padding-top: 28px !important;
  padding-bottom: 28px !important;
}

.global-search__group-header {
  cursor: pointer;
  height: 30px;
  font-size: 0.75rem;
  background: rgba(var(--v-theme-surface-variant), 0.2);
  transition: background-color 0.15s ease;
}

.global-search__group-header:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.global-search__item {
  height: 30px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.global-search__item:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

.global-search__item--active {
  background: rgba(var(--v-theme-primary), 0.12);
}

.global-search__item--active:hover {
  background: rgba(var(--v-theme-primary), 0.14);
}

.global-search__item-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-search__footer {
  position: sticky;
  bottom: 0;
  background: rgb(var(--v-theme-surface));
}
</style>
