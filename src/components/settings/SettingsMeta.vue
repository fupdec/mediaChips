<template>
  <div>
    <SettingsCategoryDivider
      :title="t('settings.tabs.meta')"
      icon="shape-outline"
    />

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
    </div>

    <v-card
      v-for="(group, param) in filteredMeta"
      :key="`key_${metaKey}_param_${param}`"
      class="meta-group pa-2 mb-3 mt-3 rounded-xl"
      variant="flat"
    >
      <div class="meta-group__label d-flex align-center text-subtitle-2 text-medium-emphasis ps-2 mb-1">
        <v-icon color="grey" start>{{ $readable.getIconDataType(param) }}</v-icon>
        <span>{{ $readable.getTextDataType(param) }}</span>
      </div>

      <v-chip-group column>
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
import SettingsCategoryDivider from '@/components/ui/SettingsCategoryDivider.vue'
import {getMetaSortOptions, groupMetaByType, META_SORT_MODES} from '@/utils/metaSort'

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const eventBus = useEventBus()
const {t} = useI18n()

const meta = ref([])
const search = ref('')
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
    meta.value = response.data

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

  &__label {
    line-height: 1.2;
    letter-spacing: 0.02em;
  }
}
</style>
