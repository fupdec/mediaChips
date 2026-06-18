<script setup>
import {ref, computed, nextTick} from 'vue'
import {useRouter} from 'vue-router'
import {useHotkey} from 'vuetify'
import {useI18n} from 'vue-i18n'
import axios from 'axios'
import _ from 'lodash'

const {t} = useI18n()

useHotkey('slash', () => {
  showSearch()
})

import AppBarButton from '@/components/app/appbar/AppBarButton.vue'

// Pinia stores
import {useAppStore} from '@/stores/app'
import {useItemsStore} from "@/stores/items";
import {getMediaTypeName} from '@/utils/mediaTypeI18n'

const router = useRouter()

const app = useAppStore()
const itemsStore = useItemsStore()
const meta = computed(() => app.meta)
const mediaTypes = computed(() => app.mediaTypes)

// UI
const dialog = ref(false)
const query = ref('')
const loading = ref(false)
const results = ref([])
const searchField = ref(null)
let debounceTimer = null

const apiUrl = computed(() => app.localhost)

// Status
const status = computed(() => {
  if (!query.value) return t('globalSearch.startTyping')
  if (loading.value) return t('globalSearch.loading')
  if (!loading.value && results.value.length === 0) return t('globalSearch.noResult')
  return ''
})

function showSearch() {
  dialog.value = true
  query.value = ''
  results.value = []
  focusSearchField()
}

async function focusSearchField() {
  await nextTick()
  searchField.value?.focus()
  setTimeout(() => searchField.value?.focus(), 50)
}

function hide() {
  dialog.value = false
  query.value = ''
  results.value = []
}

async function search() {
  if (!query.value) {
    results.value = []
    return
  }

  loading.value = true
  results.value = []

  if (!mediaTypes.value.length || !meta.value.length) {
    loading.value = false
    return
  }

  //
  // 1) MEDIA SEARCH
  //
  try {
    const res = await axios.post(apiUrl.value + '/api/media/search', {
      query: 'SELECT * ' + `FROM media WHERE name LIKE '%${query.value}%'`
    })

    let data = res.data[0]
    const grouped = _.groupBy(data, 'mediaTypeId')

    const groups = Object.keys(grouped).map(id => {
      const type = mediaTypes.value.find(t => t.id == id)

      return {
        data: grouped[id],
        limit: 10,
        name: getMediaTypeName(type, t),
        icon: type.icon,
        mediaTypeId: type.id,
        is_media: true,
        group_id: Date.now()
      }
    })

    results.value.push(...groups)
  } catch (e) {
    console.error(e)
  }

  //
  // 2) TAG SEARCH
  //
  try {
    const res = await axios.post(apiUrl.value + '/api/tag/search', {
      query: `
        SELECT *
        FROM tags
        WHERE name LIKE '%${query.value}%'
           OR synonyms LIKE '%${query.value}%'
      `
    })

    const data = res.data[0]
    const grouped = _.groupBy(data, 'metaId')

    const groups = Object.keys(grouped).map(metaId => {
      const m = meta.value.find(x => x.id == metaId)

      return {
        data: grouped[metaId],
        limit: 10,
        name: m.name,
        icon: m.icon,
        metaId: m.id,
        is_media: false,
        group_id: Date.now()
      }
    })

    results.value.push(...groups)
  } catch (e) {
    console.error(e)
  }

  loading.value = false
}

function run() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(search, 200)
}

//
// CLICK ACTIONS
//
function openMedia(media) {
  itemsStore.playVideo({
    video: media,
  })
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
  $readable.hideHoverImage()
  router.push(`/tag?metaId=${tag.metaId}&tagId=${tag.id}&mediaTypeId=1`)
  hide()
}

function getNameHighlighted(text) {
  return $readable.highlightChars(text, query.value, true)
}
</script>

<template>
  <v-dialog v-model="dialog" width="680">
    <template #activator="{ props: activatorProps }">
      <AppBarButton
        v-bind="activatorProps"
        :action="showSearch"
        :text="t('appbar.buttons.search')"
        icon="magnify"
        hotkey="slash"
      />
    </template>
    <template #default>
      <v-card class="pa-4" rounded="xl">

        <v-text-field
          ref="searchField"
          v-model="query"
          @input="run"
          :loading="loading"
          :placeholder="t('globalSearch.enterText')"
          clearable
          autofocus
          variant="outlined"
          density="compact"
          rounded
          color="primary"
          hide-details
        />

        <div class="text-center text-medium-emphasis mt-2">{{ status }}</div>

        <div v-for="group in results" :key="group.group_id">
          <v-card class="pa-3 mt-4" variant="tonal" rounded="xl">

            <!-- MEDIA GROUP -->
            <template v-if="group.is_media">
              <v-btn
                @click="openMediaPage(group.mediaTypeId)"
                color="primary"
                variant="flat"
                rounded="xl"
              >
                <v-icon start>mdi-{{ group.icon }}</v-icon>
                {{ group.name }} ({{ group.data.length }})
              </v-btn>

              <v-chip-group column class="mt-2 pb-0">
                <v-chip
                  v-for="file in group.data.slice(0, group.limit)"
                  :key="file.id"
                  density="compact"
                  @click="openMedia(file)"
                  @mouseover.stop="$readable.showHoverImage($event, group.mediaTypeId, file.id, 'media')"
                  @mouseleave.stop="$readable.hideHoverImage"
                >
                  <span v-html="getNameHighlighted(file.name)"/>
                </v-chip>
              </v-chip-group>
            </template>

            <!-- TAG GROUP -->
            <template v-else>
              <v-btn
                @click="openMeta(group.metaId)"
                color="primary"
                variant="flat"
                rounded="xl"
              >
                <v-icon start>mdi-{{ group.icon }}</v-icon>
                {{ group.name }} ({{ group.data.length }})
              </v-btn>

              <v-chip-group column class="mt-2 pb-0">
                <v-chip
                  v-for="tag in group.data.slice(0, group.limit)"
                  :key="tag.id"
                  class="global-search-tag-chip"
                  density="compact"
                  @click="openTag(tag)"
                  @mouseover.stop="$readable.showHoverImage($event, tag.metaId, tag.id)"
                  @mouseleave.stop="$readable.hideHoverImage"
                >
                  <span class="global-search-tag-chip__text">
                    <span v-html="getNameHighlighted(tag.name)"/>
                    <span
                      class="text-medium-emphasis ml-1"
                      v-if="tag.synonyms"
                      v-html="'; ' + getNameHighlighted(tag.synonyms)"
                    />
                  </span>
                </v-chip>
              </v-chip-group>
            </template>

            <!-- Show more -->
            <v-btn
              v-if="group.data.length > group.limit"
              @click="group.limit += 10"
              variant="tonal"
              color="primary"
              class="mt-2"
              rounded="xl"
              block
            >
              {{ t('globalSearch.showMore') }} {{ group.data.length - group.limit }}
            </v-btn>

          </v-card>
        </div>

      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped>
.global-search-tag-chip {
  max-width: 100%;
}

.global-search-tag-chip :deep(.v-chip__content) {
  display: block;
  min-width: 0;
  overflow: hidden;
}

.global-search-tag-chip__text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
