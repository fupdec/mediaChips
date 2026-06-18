<template>
  <v-navigation-drawer
    v-model="filtersVisible"
    class="filters-drawer"
    :class="{'temporary': filtersStore.attached}"
    :temporary="filtersStore.attached"
    :scrim="false"
    disable-resize-watcher
    width="450"
    floating
  >
    <v-card variant="tonal" color="primary" class="filter-block" rounded="xl">

      <v-overlay
        :model-value="!ITEMS.isFiltersLoaded"
        :opacity="0.1"
        contained
        persistent
        class="d-flex justify-center align-center"
      >
        <v-progress-circular indeterminate size="170" width="10" color="primary"/>
      </v-overlay>

      <v-card-actions class="pt-3 pb-6">
        <div class="d-flex justify-center align-center">
          <v-icon start>mdi-filter</v-icon>
          <span class="text-h5">{{ t('filters.title') }}</span>
        </div>

        <v-spacer></v-spacer>

        <v-btn
          v-if="ITEMS.type === 'media'"
          @click="toggleDuplicates"
          :color="ITEMS.find_duplicates ? 'primary' : ''"
          rounded="xl"
          variant="flat"
          size="x-small"
        >
          <v-icon class="mr-1" size="x-small">mdi-file-multiple</v-icon>
          <span>{{ t('filters.duplicates') }}</span>
        </v-btn>

        <v-btn @click="filtersStore.attached = !filtersStore.attached" variant="text" icon size="small">
          <v-icon v-if="filtersStore.attached">mdi-pin</v-icon>
          <v-icon v-else>mdi-pin-outline</v-icon>
        </v-btn>

        <v-btn @click="filtersStore.visible = false" variant="text" icon size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>

      <div class="px-2">
        <div class="d-flex align-center justify-space-between">
          <v-btn-toggle rounded="xl" density="compact">
            <v-btn @click="dialogSave = true" variant="tonal" class="px-4">
              <v-icon start>mdi-content-save</v-icon>
              {{ t('common.save') }}
            </v-btn>
            <v-divider vertical></v-divider>
            <v-btn @click="dialogLoad = true" variant="tonal" class="px-4">
              {{ t('common.load') }}
              <v-icon end>mdi-content-save-move</v-icon>
            </v-btn>
          </v-btn-toggle>

          <v-btn
            @click="apply"
            :color="is_filters_changed ? 'success' : 'primary'"
            rounded="xl"
            variant="flat"
          >
            <v-icon start>mdi-check</v-icon>
            {{ t('common.apply') }}
          </v-btn>
        </div>

        <v-spacer class="py-2"></v-spacer>

        <FiltersAdd
          v-if="isReady"
          @add="add"
          :params="listBy"
          :disabled="ITEMS.find_duplicates"
          class="my-2"
        />

        <v-spacer class="py-2"></v-spacer>

        <div v-if="filters.length > 1" class="d-flex align-center justify-space-between mb-4">
          <v-btn @click="toggleRemovingAll" color="error" variant="tonal" rounded="xl">
            <v-icon start>mdi-close</v-icon>
            {{ t('common.remove_all') }}
          </v-btn>

          <v-btn @click="toggleActivationAll" color="success" variant="tonal" rounded="xl">
            {{ t('common.activate_all') }}
            <v-icon end>mdi-check-all</v-icon>
          </v-btn>
        </div>
      </div>

      <v-card-text v-if="isReady" :disabled="ITEMS.find_duplicates" class="filters-list">
        <FilterRow
          v-for="(f, i) in filters"
          :key="`filter-${i}-${updKey}`"
          :filter="f"
          :index="i"
          :list-by="listBy"
          @set-by="setBy($event, i)"
          @set-condition="setCondition($event, i)"
          @set-value="setValue($event, i)"
          @set-active="setActive($event, i)"
          @set-union="setUnion($event, i)"
          @remove="remove(i)"
          @pick-date="pickDate(i)"
          @valid="validate"
          ref="filterRows"
        ></FilterRow>

        <div v-if="filters.length === 0" class="text-center py-6 overline">
          <v-img src="/images/filters/filters-none.svg" class="my-4" contain/>
          <div>{{ t('filters.no_filters') }}</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Save Filter Dialog -->
    <v-dialog v-model="dialogSave" width="600" scrollable>
      <v-card>
        <DialogHeader
          @close="dialogSave = false"
          :header="t('filters.saving_filter')"
          :buttons="[
            {
              icon: 'content-save',
              text: t('common.save'),
              color: 'success',
              outlined: false,
              actions: save,
            },
          ]"
          closable
        />

        <v-card-text class="text-center py-4 px-2 px-sm-4">
          <v-form
            v-model="validName"
            ref="formSave"
            class="flex-grow-1"
            @submit.prevent
          >
            <v-text-field
              v-model="filterName"
              :rules="[nameRules]"
              :label="t('filters.filter_name')"
              autofocus
              rounded="lg"
              variant="filled"
            />
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Load Filter Dialog -->
    <DialogFiltersSaved
      v-if="dialogLoad"
      :dialog="dialogLoad"
      @close="dialogLoad = false"
      @apply="loadSavedFilter"
      @update="init"
    />

    <!-- Date Picker Dialog -->
    <v-dialog v-model="datePicker.dialog" width="auto">
      <v-date-picker
        @update:model-value="setDate"
        :model-value="datePicker.value"
        color="primary"
        rounded="xl"
      />
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted} from 'vue'
import {useI18n} from 'vue-i18n'
import dayjs from 'dayjs'
import _ from 'lodash'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'

import cols from "../../../app/configs/filter-cols.mjs";

// Components
import DialogHeader from '@/components/elements/DialogHeader.vue'
import FilterRow from '@/components/app/FilterRow.vue'
import DialogFiltersSaved from '@/components/dialogs/filters/DialogFiltersSaved.vue'
import FiltersAdd from '@/components/dialogs/filters/FiltersAdd.vue'

/**
 обозначения ключей для объекта "фильтр":
 id - уникальный номер взятый из таблицы БД,
 param - параметр, по которому будет производиться фильтрация,
 type - тип данных для фильтрации,
 cond - условие,
 val - значение,
 note - дополнительная информация,
 favorite - избранное, отображение на панели инструментов,
 active - состояние фильтра,
 lock - блокировка от удаления пользователем,
 */

// Props
const props = defineProps({
  isReady: Boolean
})

// Stores
const filtersStore = useAppStore().filters
const itemsStore = useItemsStore()
const eventBus = useEventBus()
const {t} = useI18n()

// Reactive data
const updKey = ref(0)
const filters = ref([])
const listBy = ref([])
const valid = ref(true)
const datePicker = ref({
  dialog: false,
  index: -1,
  value: null
})
const dialogSave = ref(false)
const validName = ref(false)
const filterRows = ref(null)
const filterName = ref('')
const dialogLoad = ref(false)
const filtersPreviousState = ref([])
const removeAllState = ref(true)
const deactivateAllState = ref(true)
const formSave = ref(null)

// Computed
const filtersVisible = computed(() => filtersStore.visible)

const ITEMS = computed(() => itemsStore)
const ENV = computed(() => ITEMS.value.environment)
const apiUrl = computed(() => useAppStore().localhost)

const is_filters_changed = computed(() => {
  const a = _.cloneDeep(filtersPreviousState.value).sort()
  const b = _.cloneDeep(filters.value).sort()
  return JSON.stringify(a) !== JSON.stringify(b)
})

// Methods
const filterTextKeys = {
  rating: 'filters.sort.rating',
  favorite: 'meta.sorting.favorite',
  bookmark: 'player.controls.bookmark',
  views: 'filters.sort.views',
  viewedAt: 'filters.sort.viewed_date',
  createdAt: 'filters.sort.date_added',
  updatedAt: 'filters.sort.date_updated',
  name: 'filters.sort.name',
  synonyms: 'filters.sort.synonyms',
  country: 'meta.types.country',
  color: 'settings_labels.appearance.colors',
  path: 'filters.sort.file_path',
  filesize: 'filters.sort.filesize',
  duration: 'filters.sort.duration',
  width: 'filters.sort.width',
  height: 'filters.sort.height',
  bitrate: 'filters.sort.bitrate',
  fps: 'filters.sort.framerate',
  codec: 'filters.sort.codec',
}

const withFilterI18n = (items, group) => items.map(item => ({
  ...item,
  group,
  textKey: filterTextKeys[item.param],
}))

const translateFilterText = item => item.textKey ? t(item.textKey) : item.text

const init = () => {
  let listByArray = []

  if (ITEMS.value.type === 'media') {
    let media = withFilterI18n(cols.media || [], "File")
    media.sort((a, b) => translateFilterText(a) > translateFilterText(b) ? 1 : translateFilterText(b) > translateFilterText(a) ? -1 : 0)
    listByArray = [...listByArray, ...media]

    if (ENV.value.media_type_id === 1) {
      let video = withFilterI18n(cols.video || [], "Video")
      video.sort((a, b) => translateFilterText(a) > translateFilterText(b) ? 1 : translateFilterText(b) > translateFilterText(a) ? -1 : 0)
      listByArray = [...listByArray, ...video]
    }
  } else if (ITEMS.value.type === 'tag') {
    let metaTag = withFilterI18n(cols.metaTag || [], "Tag")
    metaTag.sort((a, b) => translateFilterText(a) > translateFilterText(b) ? 1 : translateFilterText(b) > translateFilterText(a) ? -1 : 0)
    listByArray = [...listByArray, ...metaTag]
  }

  // так называемые заводские фильтры, типа закладок, даты создания, избранное...
  let defaults = withFilterI18n(cols.standart || [], "Preset meta")
  defaults.sort((a, b) => translateFilterText(a) > translateFilterText(b) ? 1 : translateFilterText(b) > translateFilterText(a) ? -1 : 0)
  listByArray = [...listByArray, ...defaults]

  let pinned = ITEMS.value.assigned;

  for (let i of pinned) {
    if (i.meta && i.meta.id) {
      listByArray.push({
        param: i.meta.id,
        type: i.meta.type || 'array',
        icon: i.meta.icon || 'mdi-tag',
        text: i.meta.name || t('meta.unnamed_tag'),
        group: "Pinned meta",
      });
    }
  }

  listBy.value = listByArray
  filters.value = _.cloneDeep(ITEMS.value.filters)
  filtersPreviousState.value = _.cloneDeep(filters.value)
}

const add = (params) => {
  for (let i of params) {
    let cond = $readable.getListCond(i.type)
    if (cond) cond = cond[0].cond
    let filter_obj = $readable.getFilterObject({
      param: i.param,
      type: i.type,
      cond: cond
    })
    filters.value.push(filter_obj)
  }
}

const setBy = (value, index) => {
  filters.value[index].param = value
  let found = listBy.value.findIndex(i => i.param === value)
  if (found > -1) filters.value[index].type = listBy.value[found].type
  filters.value[index].cond = null
  filters.value[index].val = null
  if (typeof value === "number") filters.value[index].metaId = value
}

const setCondition = (value, index) => {
  filters.value[index].cond = value
}

const setValue = (value, index) => {
  filters.value[index].val = value
}

const setActive = (value, index) => {
  filters.value[index].active = value
}

const setUnion = (value, index) => {
  filters.value[index].union = value
}

const remove = (index) => {
  filters.value[index].removed = !filters.value[index].removed
  updKey.value += Date.now()
}

const removeAll = (state) => {
  const is_removed = state === undefined ? true : state
  filters.value.forEach(i => {
    if (!i.lock) i.removed = is_removed
  })
  updKey.value += Date.now()
}

const toggleRemovingAll = () => {
  removeAll(removeAllState.value)
  removeAllState.value = !removeAllState.value
}

const deactivateAll = (state) => {
  const is_active = state === undefined ? false : state
  const updatedFilters = filters.value.map(i =>
    i.lock ? i : {...i, active: is_active}
  )
  filters.value = _.cloneDeep(updatedFilters)
  updKey.value += Date.now()
}

const toggleActivationAll = () => {
  deactivateAll(deactivateAllState.value)
  deactivateAllState.value = !deactivateAllState.value
}

const validateFilters = () => {
  if (!dialogSave.value || filters.value.length === 0) {
    valid.value = true
    return
  }
  if (filterRows.value) {
    for (let i of filterRows.value) {
      i.validate()
    }
  }
}

const apply = async () => {
  if (ITEMS.value.find_duplicates) {
    eventBus.emit('setItemsFilters', {filters: filters.value})

    return
  } else {
    validateFilters()
    if (!valid.value) {
      return
    }
  }

  let savedFilter = ITEMS.value.savedFilter
  await addFilterRows(savedFilter?.id)

  const removed_filters = filters.value.filter(i => i.removed)
  for (let f of removed_filters) {
    if (f.id) {
      await axios.delete(`${apiUrl.value}/api/FilterRow/${f.id}`)
    }
  }

  itemsStore.updateState({key: "filters", value: _.cloneDeep(filters.value)})
  eventBus.emit('setItemsFilters', {filters: filters.value})
}

const addFilterRows = async (filterId, isSavedFilter = false) => {
  const filterRows = _.cloneDeep(filters.value.filter(i => !i.lock && !i.removed))
  for (let f of filterRows) {
    if (isSavedFilter) f.id = null
    try {
      await axios({
        method: "post",
        url: `${apiUrl.value}/api/FilterRow`,
        data: {
          filter: f,
          filterId: filterId,
          rowId: isSavedFilter ? null : f.id
        }
      })
    } catch (error) {
      console.error('Error adding filter row:', error)
    }
  }
}

const save = async () => {
  if (!formSave.value) return

  const {valid} = await formSave.value.validate()
  if (!valid) return

  let savedFilter = {}

  try {
    const response = await axios({
      method: "post",
      url: `${apiUrl.value}/api/SavedFilter`,
      data: {
        name: filterName.value,
        mediaTypeId: ENV.value.media_type_id,
        metaId: ENV.value.meta_id,
        tagId: ENV.value.tag_id,
        tabId: ENV.value.tab_id
      }
    })
    savedFilter = response.data[0]
  } catch (error) {
    console.error('Error saving filter:', error)
    return
  }

  if (!_.isEmpty(savedFilter)) {
    await addFilterRows(savedFilter.id, true)
  }

  dialogSave.value = false
  filterName.value = ''

  // получаем актуальные сохраненные наборы фильтров
  await $operable.getSavedFilters()
}

const loadSavedFilter = (loadedFilters) => {
  dialogLoad.value = false
  removeAll()
  let old_filters = _.cloneDeep(filters.value.filter(i => !i.lock))
  filters.value = [...loadedFilters, ...old_filters]
  updKey.value += Date.now()
}

const pickDate = (index) => {
  datePicker.value.dialog = true
  datePicker.value.value = filters.value[index].val
  datePicker.value.index = index
}

const setDate = (date) => {
  datePicker.value.dialog = false
  filters.value[datePicker.value.index].val = dayjs(date).format('YYYY-MM-DD')
}

const validate = (val) => {
  valid.value = val
}

const nameRules = (string) => {
  return $readable.validateName(string)
}

const toggleDuplicates = () => {
  itemsStore.updateState({
    key: "find_duplicates",
    value: !ITEMS.value.find_duplicates
  })
  apply()
}

// Event listeners
const handleApplySavedFilter = (filters) => {
  loadSavedFilter(filters)
  apply()
}

const handleDeactivateFilter = (index) => {
  filters.value[index].active = false
  apply()
}

const handleDeactivateAllFilters = () => {
  deactivateAll()
  apply()
}

const handleApplyFilters = () => {
  apply()
}

// Lifecycle
onMounted(() => {
  eventBus.on('applySavedFilter', handleApplySavedFilter)
  eventBus.on('deactivateFilter', handleDeactivateFilter)
  eventBus.on('deactivateAllFilters', handleDeactivateAllFilters)
  eventBus.on('applyFilters', handleApplyFilters)

  if (props.isReady) init()
})

onUnmounted(() => {
  eventBus.off('applySavedFilter', handleApplySavedFilter)
  eventBus.off('deactivateFilter', handleDeactivateFilter)
  eventBus.off('deactivateAllFilters', handleDeactivateAllFilters)
  eventBus.off('applyFilters', handleApplyFilters)
})

// Watchers
watch(() => itemsStore.filters, (val) => {
  filters.value = _.cloneDeep(val)
  filtersPreviousState.value = _.cloneDeep(val)
  updKey.value += Date.now()
}, {deep: true})

watch(() => props.isReady, (val) => {
  if (val) init()
})
</script>

<style lang="scss">
.filters-drawer {
  max-height: 100%;
  padding: 16px 4px 16px 16px;
  background: transparent;
  pointer-events: none;

  .v-navigation-drawer__content {
    overflow: visible !important;
  }
  .filter-block {
    pointer-events: all;
    box-shadow:  0px 4px 6px -3px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), -3px 9px 14px 1px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 5px 5px 18px 3px var(--v-shadow-key-ambient-opacity, rgba(0, 0, 0, 0.12)) !important;
    background-color: rgba(var(--v-theme-background), 0.8);
    backdrop-filter: blur(20px);
  }

  &.temporary {
    background: transparent;
    overflow: visible !important;
    padding: 16px;
  }

  .filter-block {
    padding: 8px 8px 16px;
    display: grid;
    grid-template-rows: auto auto 1fr;
    overflow: hidden;
    max-height: 100%;
    height: 100%;
  }
}

.filters-list {
  overflow-y: auto;
  min-height: 0;
  padding: 0 8px;
  .v-form:last-of-type {
    .filter {
      margin-bottom: 0 !important;
    }
  }
}
</style>