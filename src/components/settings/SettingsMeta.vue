<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2">
      <v-btn
        color="success"
        rounded="xl"
        variant="flat"
        prepend-icon="mdi-plus"
        :text="t('meta.dialogs.add_new_meta')"
        @click="openCreateDialog"
      ></v-btn>

      <v-btn
        variant="text"
        size="small"
        color="primary"
        class="meta-docs-link"
        @click="showMetaDocs"
      >
        <v-icon start size="18">mdi-help-circle-outline</v-icon>
        {{ t('meta.dialogs.custom_metadata_docs') }}
      </v-btn>
    </div>

    <v-spacer class="my-6"></v-spacer>

    <div v-if="!meta.length" class="layout-img">
      <v-img src="/images/no-data.svg" max-height="40vh" class="my-4" contain></v-img>
      <div class="text-medium-emphasis">{{ t('meta.dialogs.meta_missing_add_first') }}</div>
    </div>

    <div v-if="initiated && meta.length" class="d-flex align-center flex-wrap ga-4 mb-2">
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        :placeholder="t('common.quick_search_placeholder')"
        hide-details
        autofocus
        clearable
        variant="filled"
        density="compact"
        max-width="300"
      ></v-text-field>

      <v-select
        :model-value="sortMode"
        @update:model-value="setSortMode"
        :items="sortOptions"
        :label="t('settings_labels.meta.sort_label')"
        hide-details
        variant="filled"
        density="compact"
        max-width="260"
      ></v-select>

      <v-switch
        v-model="detailed"
        :label="t('common.detailed')"
        class="mt-0"
        inset
        hide-details
        density="compact"
      />
    </div>

    <v-card
      v-for="(group, param) in filteredMeta"
      :key="`key_${metaKey}_param_${param}`"
      class="meta-group pa-4 mb-4 mt-4 rounded-xl"
      variant="flat"
    >
      <div class="d-flex align-center text-subtitle-2 text-medium-emphasis mb-3">
        <v-icon color="grey" start>{{ $readable.getIconDataType(param) }}</v-icon>
        <span>{{ $readable.getTextDataType(param) }}</span>
      </div>

      <div v-if="detailed">
        <v-row dense>
          <v-col
            v-for="m in group"
            :key="`key_${metaKey}_id_${m.id}`"
            cols="12"
            md="6"
          >
            <v-card
              @click="openEditDialog(m)"
              class="meta-item rounded-xl"
              variant="flat"
              hover
            >
              <v-card-title class="meta-item__title text-body-1 py-3">
                <v-icon start>mdi-{{ m.icon }}</v-icon>
                <span v-html="$readable.highlightChars(m.name)"/>
              </v-card-title>

              <v-card-text
                v-if="m.type === 'array'"
                class="meta-item__content pt-0"
                style="pointer-events: none;"
              >
                <div v-if="m.pinned.length" class="meta-item__section">
                  <div class="meta-item__label">{{ t('meta.fields.pinned_meta') }}</div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip
                      v-for="pm in m.pinned"
                      :key="`key_${metaKey}_pinned_id_${pm.meta.id}`"
                      variant="outlined"
                      size="small"
                    >
                      <v-icon class="mr-1" color="grey" size="small">mdi-{{ pm.meta.icon }}</v-icon>
                      <span class="text-medium-emphasis">{{ pm.meta.name }}</span>
                    </v-chip>
                  </div>
                </div>

                <v-chip v-else size="small" variant="outlined">
                  <v-icon start size="small" color="grey">mdi-pin-off-outline</v-icon>
                  <span class="text-medium-emphasis">{{ t('meta.fields.no_pinned_meta') }}</span>
                </v-chip>

                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip v-if="!m.hidden" size="small" variant="outlined">
                    <v-icon start color="success" size="small">mdi-check</v-icon>
                    <span class="text-medium-emphasis">{{ t('media.type.show_in_navbar') }}</span>
                  </v-chip>

                  <v-chip v-if="m.rating" size="small" variant="outlined">
                    <v-icon color="yellow-darken-2" start size="small">mdi-star</v-icon>
                    <span class="text-medium-emphasis">{{ t('meta.types.rating') }}</span>
                  </v-chip>

                  <v-chip v-if="m.favorite" size="small" variant="outlined">
                    <v-icon color="pink" start size="small">mdi-heart</v-icon>
                    <span class="text-medium-emphasis">{{ t('meta.sorting.favorite') }}</span>
                  </v-chip>

                  <v-chip v-if="m.bookmark" size="small" variant="outlined">
                    <v-icon color="red" start size="small">mdi-bookmark</v-icon>
                    <span class="text-medium-emphasis">{{ t('player.controls.bookmark') }}</span>
                  </v-chip>

                  <v-chip v-if="m.country" size="small" variant="outlined">
                    <v-icon color="grey" start size="small">mdi-flag</v-icon>
                    <span class="text-medium-emphasis">{{ t('meta.types.country') }}</span>
                  </v-chip>

                  <v-chip v-if="m.parser" size="small" variant="outlined">
                    <v-icon color="grey" start size="small">mdi-text-box-search</v-icon>
                    <span class="text-medium-emphasis">{{ t('meta.fields.parser') }}</span>
                  </v-chip>

                  <v-chip v-if="settingsStore.count_number_of_views === '1'" size="small" variant="outlined">
                    <v-icon color="primary" start size="small">mdi-eye</v-icon>
                    <span class="text-medium-emphasis">{{ m.views || 0 }}</span>
                  </v-chip>
                </div>
              </v-card-text>

              <v-rating
                v-if="m.type === 'rating'"
                :model-value="1.5"
                :length="m.ratingMax"
                :full-icon="`mdi-${m.ratingIcon}`"
                :empty-icon="`mdi-${m.ratingIconEmpty || m.ratingIcon}`"
                :color="m.ratingColor"
                :half-increments="m.ratingHalf"
                :half-icon="`mdi-${m.ratingIconHalf || m.ratingIcon}`"
                background-color="grey"
                class="mx-4 mb-3"
                density="compact"
                readonly
              />
            </v-card>
          </v-col>
        </v-row>
      </div>

      <v-chip-group v-else column>
        <v-chip
          v-for="m in group"
          :key="`key_${metaKey}__id_${m.id}`"
          @click="openEditDialog(m)"
          class="ma-1"
        >
          <v-icon size="20" start>mdi-{{ m.icon }}</v-icon>
          <span v-html="$readable.highlightChars(m.name)"/>
        </v-chip>
      </v-chip-group>
    </v-card>

    <div v-if="meta.length && isSearchEmpty" class="layout-img">
      <v-img src="/images/filters/filters-no-results-meta.svg" max-height="40vh" class="my-4" contain></v-img>
      <div class="text-medium-emphasis">{{ t('meta.dialogs.no_meta_found') }}</div>
    </div>

    <MetaManager
      :edit-mode="editMode"
      :meta="selectedMeta"
      :dialog="editDialog"
      @updated="getMeta"
      @close="closeEditDialog"
    />
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useEventBus} from '@/utils/eventBus'
import axios from 'axios'
import _ from 'lodash'
import MetaManager from '@/components/dialogs/DialogMetaManager.vue'
import {getMetaSortOptions, groupMetaByType, META_SORT_MODES} from '@/utils/metaSort'

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const eventBus = useEventBus()
const {t} = useI18n()

const meta = ref([])
const search = ref('')
const detailed = ref(false)
const initiated = ref(false)
const selectedMeta = ref(null)
const editDialog = ref(false)
const editMode = ref(false)
const metaKey = ref(0)

const apiUrl = computed(() => appStore.localhost)
const sortMode = computed(() => settingsStore.meta_sort_mode || META_SORT_MODES.menu)
const sortOptions = computed(() => getMetaSortOptions(t))

const filteredMeta = computed(() => {
  const searchTerm = search.value?.toLowerCase() || ''

  const filtered = meta.value.filter(item => {
    if (!searchTerm) return true
    return item.name.toLowerCase().includes(searchTerm)
  })

  return groupMetaByType(filtered, sortMode.value)
})

const setSortMode = (value) => {
  $operable.setOption(value, 'meta_sort_mode')
}

const isSearchEmpty = computed(() => _.isEmpty(filteredMeta.value))

const getMeta = async (type) => {
  try {
    initiated.value = false

    const response = await axios.get(`${apiUrl.value}/api/Meta`)
    const metaList = response.data

    for (const item of metaList) {
      item.pinned = await getPinnedMeta(item.id)
    }

    meta.value = metaList

    if (type === 'array') {
      eventBus.emit('getMeta')
    }
    metaKey.value = Date.now()
  } catch (error) {
    console.error('Error fetching meta:', error)
  } finally {
    initiated.value = true
  }
}

const getPinnedMeta = async (metaId) => {
  try {
    const response = await axios.get(`${apiUrl.value}/api/PinnedMeta?metaId=${metaId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching pinned meta:', error)
    return []
  }
}

const openCreateDialog = () => {
  editMode.value = false
  editDialog.value = true
}

const openEditDialog = (metaItem) => {
  selectedMeta.value = metaItem
  editMode.value = true
  editDialog.value = true
}

const closeEditDialog = () => {
  editDialog.value = false
  selectedMeta.value = null
}

const showMetaDocs = () => {
  eventBus.emit('showDocumentation', 'meta')
}

onMounted(async () => {
  await getMeta()
})
</script>

<style scoped>
.layout-img {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.meta-group {
  background-color: rgb(120 120 120 / 5%) !important;
}

.meta-item {
  height: 100%;
  background-color: rgb(120 120 120 / 5%) !important;
}

.meta-item__title {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  line-height: 1.4;
  white-space: normal;
}

.meta-item__content {
  padding-bottom: 12px !important;
}

.meta-item__label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 8px;
}
</style>
