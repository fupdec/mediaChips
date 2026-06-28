<template>
  <v-autocomplete
    ref="filtersRef"
    v-model="selectedFilter"
    v-model:search="search"
    :items="filtersGrouped"
    :disabled="disabled"
    hide-details
    :label="t('filters.add_new_filter')"
    density="compact"
    variant="outlined"
    color="primary"
    rounded
    return-object
    @click:append="add"
    @keyup.enter="add"
  >
    <!-- APPEND -->
    <template v-if="selectedFilter" #append>
      <v-btn @click="add" color="primary" rounded="xl" variant="flat">
        <v-icon start>mdi-plus</v-icon>
        {{ t('common.add') }}
      </v-btn>
    </template>

    <!-- SELECTED -->
    <template #selection="{ item }">
      <v-icon size="16" class="mr-1">
        mdi-{{ getFilterParam(item.raw).icon }}
      </v-icon>
      <span class="text-body-2">{{ getFilterText(getFilterParam(item.raw)) }}</span>
    </template>

    <!-- ITEM -->
    <template #item="{ item, props }">
      <template v-if="isGroupHeader(item.raw)">
        <v-list-subheader>
          {{ getGroupText(item.raw.header) }}
        </v-list-subheader>
      </template>

      <template v-else-if="isGroupDivider(item.raw)">
        <v-divider />
      </template>

      <template v-else>
        <v-list-item v-bind="props">
          <template #prepend>
            <v-icon size="22">
              mdi-{{ getFilterParam(item.raw).icon }}
            </v-icon>
          </template>

          <template #title>
            <div
              v-html="highlight(getFilterText(getFilterParam(item.raw)))"
              class="text-body-2"
            ></div>
            <div class="d-flex align-center text-caption">
              <v-icon size="12" class="mr-1">
                {{ getTypeIcon(getFilterParam(item.raw).type) }}
              </v-icon>
              {{ getTypeText(getFilterParam(item.raw).type) }}
            </div>
          </template>
        </v-list-item>
      </template>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { foundByChars, highlightChars } from '@/services/formatUtils'
import { getIconDataType } from '@/services/metaTypeUtils'
import {useSettingsStore} from '@/stores/settings'
import type { FilterListParam } from '@/types/common'

interface FilterGroupHeader {
  header: string
}

interface FilterGroupDivider {
  divider: true
}

type FilterGroupedItem = FilterListParam | FilterGroupHeader | FilterGroupDivider

const settingsStore = useSettingsStore()
const {t} = useI18n()

const props = defineProps({
  params: {
    type: Array as PropType<FilterListParam[]>,
    required: true,
  },
  disabled: Boolean,
})

const emit = defineEmits(['add'])

/* =========================
 * STATE
 * ========================= */

const selectedFilter = ref<FilterListParam | null>(null)
const search = ref('')
const filtersRef = ref<{ blur?: () => void } | null>(null)

/* =========================
 * COMPUTED
 * ========================= */

const filtersGrouped = computed((): FilterGroupedItem[] => {
  const is_default = settingsStore.typingFiltersDefault == "1"

  const params = props.params.filter((i: FilterListParam) =>
   is_default ? getFilterText(i).toLowerCase().indexOf(search.value.toLowerCase()) > -1 : foundByChars(getFilterText(i), search.value)
)
  const ordered = _.orderBy(params, [(i: FilterListParam) => getGroupText(i.group), (i: FilterListParam) => getFilterText(i)])
  const grouped = _.groupBy(ordered, 'group')

  const result: FilterGroupedItem[] = []

  for (const group in grouped) {
    result.push({ header: group })
    result.push(...grouped[group])
    result.push({ divider: true })
  }
  result.pop()
  return result
})

/* =========================
 * METHODS
 * ========================= */

const isGroupHeader = (item: unknown): item is FilterGroupHeader =>
  typeof item === 'object' && item !== null && 'header' in item

const isGroupDivider = (item: unknown): item is FilterGroupDivider =>
  typeof item === 'object' && item !== null && 'divider' in item

const getFilterParam = (item: unknown): FilterListParam => item as FilterListParam

const add = () => {
  if (!selectedFilter.value) return

  emit('add', [selectedFilter.value])
  selectedFilter.value = null
  filtersRef.value?.blur?.()
}

const getTypeIcon = (type?: string) => getIconDataType(type || '')

const highlight = (text: string) =>
  highlightChars(text, search.value, true)

const getFilterText = (item: FilterListParam) =>
  item?.textKey ? t(item.textKey) : item?.text || ''

const getGroupText = (group?: string) =>
  t(`filters.groups.${group}`, group || '')

const getTypeText = (type?: string) =>
  t(`meta.types.${type}`, type || '')
</script>
