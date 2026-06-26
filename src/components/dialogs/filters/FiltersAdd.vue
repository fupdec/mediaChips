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
    <template v-if="selectedFilter" #append="{ item }">
      <v-btn @click="add" color="primary" rounded="xl" variant="flat">
        <v-icon start>mdi-plus</v-icon>
        {{ t('common.add') }}
      </v-btn>
    </template>

    <!-- SELECTED -->
    <template #selection="{ item }">
      <v-icon size="16" class="mr-1">
        mdi-{{ item.raw.icon }}
      </v-icon>
      <span class="text-body-2">{{ getFilterText(item.raw) }}</span>
    </template>

    <!-- ITEM -->
    <template #item="{ item, props }">
      <template v-if="item.raw.header">
        <v-list-subheader>
          {{ getGroupText(item.raw.header) }}
        </v-list-subheader>
      </template>

      <template v-else-if="item.raw.divider">
        <v-divider />
      </template>

      <template v-else>
        <v-list-item v-bind="props">
          <template #prepend>
            <v-icon size="22">
              mdi-{{ item.raw.icon }}
            </v-icon>
          </template>

          <template #title>
            <div
              v-html="highlight(getFilterText(item.raw))"
              class="text-body-2"
            ></div>
            <div class="d-flex align-center text-caption">
              <v-icon size="12" class="mr-1">
                {{ getTypeIcon(item.raw.type) }}
              </v-icon>
              {{ getTypeText(item.raw.type) }}
            </div>
          </template>
        </v-list-item>
      </template>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { foundByChars, highlightChars } from '@/services/formatUtils'
import { getIconDataType } from '@/services/metaTypeUtils'
import {useSettingsStore} from '@/stores/settings'

const settingsStore = useSettingsStore()
const {t} = useI18n()

const props = defineProps({
  params: {
    type: Array,
    required: true,
  },
  disabled: Boolean,
})

const emit = defineEmits(['add'])

/* =========================
 * STATE
 * ========================= */

const selectedFilter = ref(null)
const search = ref('')
const filtersRef = ref(null)

/* =========================
 * COMPUTED
 * ========================= */

const filtersGrouped = computed(() => {
  const is_default = settingsStore.typingFiltersDefault == "1"

  const params = props.params.filter(i =>
   is_default ? getFilterText(i).toLowerCase().indexOf(search.value.toLowerCase()) > -1 : foundByChars(getFilterText(i), search.value)

  // {
  //   console.log(i.text)
  //   return true
  // }
)
  const ordered = _.orderBy(params, [i => getGroupText(i.group), i => getFilterText(i)])
  const grouped = _.groupBy(ordered, 'group')

  const result = []

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

const add = () => {
  if (!selectedFilter.value) return

  emit('add', [selectedFilter.value])
  selectedFilter.value = null
  filtersRef.value?.blur()
}

const getTypeIcon = type => getIconDataType(type)

const highlight = text =>
  highlightChars(text, search.value, true)

const getFilterText = item =>
  item?.textKey ? t(item.textKey) : item?.text || ''

const getGroupText = group =>
  t(`filters.groups.${group}`, group || '')

const getTypeText = type =>
  t(`meta.types.${type}`, type || '')
</script>
