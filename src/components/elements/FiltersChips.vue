<template>
  <div class="d-flex">
    <!-- DUPLICATES MODE -->
    <v-switch
      v-if="itemsStore.find_duplicates"
      v-model="itemsStore.find_duplicates"
      @click="switchOffDuplicates"
      color="primary"
      class="mt-0 ml-2"
      hide-details
      density="compact"
      inset
    >
      <template #label>
        <div class="ml-2 text-medium-emphasis">{{ duplicatesLabel }}</div>
      </template>
    </v-switch>

    <!-- FILTER CHIPS -->
    <div
      v-else
      class="d-flex flex-wrap align-center"
    >
      <!-- DEACTIVATE ALL -->
      <div v-if="activeFilters.length && !readonly">
        <v-tooltip v-if="isTooltip" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              color="primary"
              class="mr-2"
              :disabled="!itemsStore.isFiltersLoaded"
              @click="deactivateAll"
            >
              <v-icon>mdi-filter-remove</v-icon>
            </v-btn>
          </template>
          <span>{{ t('filters.deactivate_all_filters') }}</span>
        </v-tooltip>

        <v-btn
          v-else
          variant="text"
          rounded
          size="small"
          class="mr-2"
          color="primary"
          :disabled="!itemsStore.isFiltersLoaded"
          @click="deactivateAll"
        >
          <v-icon start>mdi-filter-remove</v-icon>
          {{ t('filters.deactivate_all_filters') }}
        </v-btn>
      </div>

      <!-- FILTER CHIP -->
      <v-chip
        v-for="(filter, index) in filters"
        :key="index"
        v-show="shouldShowFilter(filter)"
        class="ma-1 px-2"
        :class="{
          readonly: isTooltip,
          'filter-chip--inactive': isTooltip && !isFilterRowActive(filter),
        }"
        :color="getChipColor(filter)"
        size="small"
        :variant="getChipVariant(filter)"
        :disabled="(filter.lock && !isTooltip) || !itemsStore.isFiltersLoaded"
        :title="getChipTitle(filter)"
        @click="deactivate(index)"
      >
        <!-- LOCK -->
        <v-icon
          v-if="filter.lock"
          size="14"
          class="mr-1"
        >
          mdi-lock
        </v-icon>

        <!-- ICON MODE -->
        <span v-if="showIcons" class="d-flex align-center">
          <v-icon size="14" class="mr-1">
            mdi-{{ getBy(filter.param, 'icon') }}
          </v-icon>
          <v-icon size="14">
            mdi-{{ getCond(filter.type, filter.cond, 'icon') }}
          </v-icon>
        </span>

        <!-- TEXT MODE -->
        <span v-else>
          <span class="mr-1">
            "{{ getBy(filter.param, 'text') }}"
          </span>
          <span>
            {{ getCond(filter.type, filter.cond, 'text') }}
          </span>
        </span>

        <!-- VALUE -->
        <span v-if="filter.type === 'array'" class="ml-1">
          <template v-if="filter.param === 'country'">
            "{{ filter.val ? filter.val.join(', ') : '' }}"
          </template>
          <template v-else>
            "{{ getTagName(filter.param, filter.val) }}"
          </template>
        </span>

        <span v-else-if="filter.type === 'number'" class="ml-1">
          <span v-html="getValForTypeNumber(filter.param, filter.val)"/>
        </span>

        <span v-else-if="filter.type !== 'boolean'" class="ml-1">
          "{{ filter.val }}"
        </span>
      </v-chip>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import Cols from '../../../app/configs/filter-cols.mjs'

import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useEventBus} from '@/utils/eventBus'
import {getCurrentMediaType} from '@/utils/mediaType'
import {getListCond, getReadableFileSize, getReadableDuration} from '@/services/formatUtils'
import {getDuplicatesModeLabelKey} from '@/utils/mediaSortFilter'

/* =========================
 * PROPS
 * ========================= */

const props = defineProps({
  filters: {
    type: Array,
    required: true,
  },
  isTooltip: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const colsCache = ref(null)

/* =========================
 * STORES
 * ========================= */

const itemsStore = useItemsStore()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const eventBus = useEventBus()
const {t} = useI18n()

/* =========================
 * COMPUTED
 * ========================= */

const activeFilters = computed(() =>
  props.filters.filter(f => f.active && !f.lock)
)

const showIcons = computed(() =>
  settingsStore.showIconsInsteadTextOnFiltersChips === '1'
)

const duplicatesLabel = computed(() => {
  if (itemsStore.type !== 'media') {
    return t('filters.show_only_duplicates_by_filesize')
  }

  const mediaType = getCurrentMediaType(
    appStore.mediaTypes,
    itemsStore.environment?.media_type_id
  )
  return t(getDuplicatesModeLabelKey(mediaType))
})

const meta = computed(() => appStore.meta)
const tags = computed(() => appStore.tags)

/* =========================
 * METHODS
 * ========================= */

const switchOffDuplicates = () => {
  itemsStore.find_duplicates = false
  eventBus.emit("applyFilters")
}

const deactivateAll = () => {
  eventBus.emit("deactivateAllFilters")
}

const deactivate = index => {
  eventBus.emit("deactivateFilter", index);
}

const isFilterRowActive = (filter) => filter.active !== false && !filter.removed

const shouldShowFilter = (filter) => {
  if (filter.removed) return false
  if (props.isTooltip) return true
  return isFilterRowActive(filter)
}

const getChipVariant = (filter) => {
  if (!props.isTooltip) return 'tonal'
  return isFilterRowActive(filter) ? 'flat' : 'outlined'
}

const getChipColor = (filter) => {
  if (!props.isTooltip) return 'primary'
  return isFilterRowActive(filter) ? 'primary' : 'default'
}

const getChipTitle = (filter) => {
  if (!props.isTooltip) return t('filters.deactivate_filter')
  if (isFilterRowActive(filter)) return t('filters.filter_row_active')
  return t('filters.filter_row_inactive')
}

const getBy = (param, show) => {
  const isMeta = /\d/.test(param.toString())

  if (isMeta) {
    const key = show === 'text' ? 'name' : show
    const m = meta.value.find(i => i.id == param)
    return m?.[key] || ''
  }

  // Кешируйте cols для производительности
  if (!colsCache.value) {
    colsCache.value = Object.values(Cols).flat()
  }

  const col = colsCache.value.find(i => i.param === param)
  if (show === 'text' && col?.textKey) return t(col.textKey)
  return col?.[show] || ''
}


const getCond = (type, cond, show) => {
  try {
    const conds = getListCond(type)
    const found = conds.find(i => i.cond === cond)
    if (show === 'text' && found?.text) {
      const key = found.text.replaceAll(' ', '_')
      return t(`filters.conditions.${key}`, found.text)
    }
    return found?.[show] || ''
  } catch (error) {
    console.error('Error getting condition:', error)
    return ''
  }
}

const getTagName = (metaId, val) => {
  const list = tags.value.filter(t => t.metaId == metaId)
  if (!val) return ''

  return val
    .map(id => list.find(t => t.id === id)?.name || '')
    .join(', ')
}

const getValForTypeNumber = (parameter, number) => {
  if (parameter === 'filesize') {
    return getReadableFileSize(number)
  }
  if (parameter === 'duration') {
    return getReadableDuration(number)
  }
  return number
}
</script>

<style scoped lang="scss">
.readonly {
  pointer-events: none;
}

.filter-chip--inactive {
  opacity: 0.55;
}
</style>
