<template>
  <v-navigation-drawer
    app
    clipped
    expand-on-hover
    permanent
    mini-variant
    rail
  >
    <div class="scrollable vertical">
      <div class="scrollable-child">
        <v-list nav
          density="compact">

          <!-- Home -->
          <v-list-item
            to="/"
            prepend-icon="mdi-home-outline"
            :title="t('navigation.home')"
            draggable="false"
            color="primary"
            link
          />

          <v-divider v-if="mediaTypes.length > 0"
            class="my-1"/>

          <!-- Media types -->
          <v-list-item
            v-for="mt in mediaTypes"
            :key="mt.id"
            :to="`/media?mediaTypeId=${mt.id}`"
            :prepend-icon="`mdi-${mt.icon}`"
            :title="getMediaTypeName(mt, t)"
            draggable="false"
            color="primary"
            exact
            link
          />

          <!-- Playlists/Markers -->
          <v-list-item
            v-if="settingsStore.showPlaylistsInNavigation === '1'"
            to="/playlists"
            prepend-icon="mdi-format-list-bulleted"
            :title="t('navigation.playlists')"
            draggable="false"
            color="primary"
            link
          />

          <v-list-item
            v-if="settingsStore.showMarkersInNavigation === '1'"
            to="/markers"
            prepend-icon="mdi-tooltip-outline"
            :title="t('navigation.markers')"
            draggable="false"
            color="primary"
            link
          />

          <v-divider v-if="meta_arr.length" class="my-1"/>

          <!-- Meta list with draggable -->
          <draggable
            v-model="meta_arr"
            @start="drag = true"
            @end="updateMetaOrder"
            v-bind="dragOptions"
            item-key="id"
            handle=".drag-handle"
          >
            <template #item="{ element: item }">
              <div class="mb-1">
                <!-- toggler -->
                <v-list-item
                  v-if="item.type === 'toggler'"
                  @click="isShowHidden = !isShowHidden"
                  :prepend-icon="`mdi-chevron-${isShowHidden ? 'up' : 'down'}`"
                  :title="t('navigation.toggle_hidden')"
                  class="drag-handle"
                  draggable="false"
                ></v-list-item>

                <!-- normal meta -->
                <v-list-item
                  v-else
                  :to="`/meta?metaId=${item.id}`"
                  :prepend-icon="`mdi-${item.icon}`"
                  :title="item.name"
                  :active="route.query.metaId == String(item.id)"
                  :class="{'d-none': item.hidden && !isShowHidden}"
                  color="primary"
                  class="drag-handle"
                  exact
                  link
                ></v-list-item>
              </div>
            </template>
          </draggable>

          <v-divider class="my-1"/>

          <!-- Settings -->
          <v-list-item
            to="/settings"
            prepend-icon="mdi-cog-outline"
            :title="t('headings.settings')"
            draggable="false"
            color="primary"
            link
          />

          <!-- Watcher folders -->
          <div
            v-if="watcherStore.files && watcherStore.files.length && settingsStore.watchFolders == '1'"
            @mouseover="folderHovered = true"
            @mouseleave="folderHovered = false"
          >
            <v-divider class="my-1"/>
            <v-list-item
              v-for="f in watcherStore.files"
              :key="f.folder.id"
              @click="openDialogFolder(f)"
              :disabled="watcherStore.busy"
            >
              <template #prepend>
                <v-badge
                  v-if="!watcherStore.busy"
                  :content="getBadgeVal(f.files, 'new')"
                  :model-value="getBadgeVal(f.files, 'new')"
                  :dot="!folderHovered"
                  color="success"
                  location="top right"
                >
                  <v-badge
                    v-if="!watcherStore.busy"
                    :content="getBadgeVal(f.files, 'lost')"
                    :model-value="getBadgeVal(f.files, 'lost')"
                    :dot="!folderHovered"
                    color="error"
                    location="bottom right"
                  >
                    <v-icon>mdi-folder-outline</v-icon>
                  </v-badge>
                </v-badge>

                <v-icon v-else>mdi-folder-sync-outline</v-icon>
              </template>

              <template #title>
                {{ f.folder.name }}
              </template>
            </v-list-item>
          </div>

        </v-list>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
/* Vue / Utilities */
import {ref, computed, watch, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import draggable from 'vuedraggable' // vuedraggable@next
import axios from 'axios'
import orderBy from 'lodash/orderBy'

/* Pinia stores — adjust names to your stores */
import {useAppStore} from '@/stores/app' // optional, or read from central store
import {useWatcherStore} from '@/stores/watcher'
import {useSettingsStore} from '@/stores/settings'

/* i18n */
import {useI18n} from 'vue-i18n'
import {useEventBus} from "@/utils/eventBus";
import {getMediaTypeName} from '@/utils/mediaTypeI18n'

/* local state */
const isShowHidden = ref(false)
const folderHovered = ref(false)
const meta_arr = ref([])
const drag = ref(false)

const dragOptions = {
  animation: 200,
  group: 'description',
  ghostClass: 'ghost',
}

/* route + i18n */
const route = useRoute()
const {t} = useI18n()

/* stores */
const store = useAppStore()
const watcherStore = useWatcherStore()
const settingsStore = useSettingsStore()
const eventBus = useEventBus()

/* computed from stores (adapt property names if your stores differ) */
const mediaTypes = computed(() =>
  (store.mediaTypes || []).filter(i => !i.hidden)
)

/* meta disordered comes from metaStore (replace with your store shape) */
const metaDisordered = computed(() => {
  // expecting metaStore.meta array
  const items = store.meta.filter(i => i.type === 'array')
  // keep original hidden property unchanged
  return items.map(i => ({...i}))
})

/* helpers */
function reorderMeta(items) {
  // order by hidden then order
  let sorted = orderBy(items, ['hidden', 'order'], ['asc', 'asc'])
  // if there is more than one visible -> insert toggler after visible useItemsStore
  if (sorted.length > 1) {
    const visibleCount = sorted.filter(i => !i.hidden).length
    const arr = [...sorted]
    arr.splice(visibleCount, 0, {type: 'toggler', id: 'toggler'})
    return arr
  }
  return sorted
}

/* lifecycle */
onMounted(() => {
  meta_arr.value = reorderMeta(metaDisordered.value)
})

watch(metaDisordered, (v) => {
  meta_arr.value = reorderMeta(v)
})

/* methods */
async function updateMetaOrder(evt) {
  drag.value = false

  // prepare payload: skip toggler item
  const indexToggler = meta_arr.value.findIndex(i => i.type === 'toggler')

  const payload = meta_arr.value
    .map((i, idx) => {
      // toggler is not a real meta
      if (i.type === 'toggler') return null

      let hidden = i.hidden
      // heuristic similar to original: if moved across toggler adjust hidden
      if (indexToggler >= 0) {
        hidden = idx >= indexToggler
      }
      return {
        id: i.id,
        order: idx,
        hidden,
      }
    })
    .filter(Boolean)

  // send updates sequentially (original did it one-by-one)
  for (const p of payload) {
    try {
      await axios.put(`${store.localhost}/api/meta/${p.id}`, {
        order: p.order,
        hidden: p.hidden,
      })
    } catch (e) {
      console.error('Failed updating meta', p.id, e)
    }
  }

  eventBus.emit('getMeta')
}

function openDialogFolder(folder) {
  console.log('openDialogFolder', folder)

  watcherStore.folder = folder
  watcherStore.dialogFolder = true
}

function getBadgeVal(files = [], type = 'new') {
  let value = 0
  for (const f of files) value += (f[type] || []).length
  return value
}
</script>

<style scoped
  lang="scss">
.scrollable {
  overflow-y: auto;
  height: calc(100vh - 64px);
}

.ghost {
  opacity: 0.6;
}

.d-none {
  display: none !important;
}
</style>
