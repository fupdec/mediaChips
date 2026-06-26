<template>
  <v-autocomplete
    v-bind="attrs"
    @update:model-value="setVal"
    :model-value="modelValue"
    :items="countries"
    :custom-filter="filterCountry"
    :rules="[rules]"
    :disabled="disabled"
    :prepend-icon="showIcons && !purpose ? 'mdi-flag' : ''"
    :label="purpose === 'filter' ? '' : 'Country'"
    :hide-details="purpose ? true : false"
    :rounded="view.rounded"
    :variant="view.filled ? 'filled' : 'outlined'"
    :density="view.dense ? 'compact' : 'default'"
    :append-icon="view.hideIcon ? '' : 'mdi-chevron-down'"
    item-text="name"
    item-value="name"
    ref="field"
    class="val"
    hide-selected
    multiple
    clearable
    chips
    closable-chips
  >
    <template v-slot:chip="{ item }">
      <v-chip
        @click:close="remove(item)"
        class="pl-0 ma-1"
        label
        size="small"
        closable
      >
        <country-flag :country="item.raw.code" size="normal" class="lang-flag"/>
        <span>{{ item.value }}</span>
      </v-chip>
    </template>

    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props" density="compact">
        <template v-slot:prepend>
          <country-flag :country="item.raw.code" size="normal" class="lang-flag  mr-1"/>
        </template>
        <template v-slot:title>
          {{ item.raw.name }}
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup>
import {ref, computed, onMounted, watch, useAttrs} from 'vue'
import {foundByChars} from '@/services/formatUtils'
import {useSettingsStore} from '@/stores/settings'
import CountryFlag from 'vue-country-flag-next'
import Countries from '@/assets/Countries.js'

const attrs = useAttrs()

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  purpose: {
    type: String,
    default: ''
  },
  cond: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:model-value'])

// Stores
const settingsStore = useSettingsStore()

// Refs
const field = ref(null)
const val = ref([])
const countries = ref(Countries)

const view = ref({
  persistentHint: true,
  hideDetails: false,
  filled: false,
  rounded: false,
  dense: false,
  hideIcon: false
})

// Computed
const showIcons = computed(() =>
  settingsStore.showIconsInsteadTextOnFiltersChips === '1'
)

const typingFiltersDefault = computed(() =>
  settingsStore.typingFiltersDefault === '1'
)

// Methods
const setVal = (newVal) => {
  if (field.value) {
    field.value.lazySearch = null
  }
  val.value = newVal
  emit('update:model-value', newVal)
}

const remove = (country) => {
  const index = val.value.indexOf(country.name)
  if (index > -1) {
    const newVal = [...val.value]
    newVal.splice(index, 1)
    setVal(newVal)
  }
}

const filterCountry = (title, queryText, item) => {
  const country = item.raw.name.toLowerCase()
  const code = item.raw.code.toLowerCase()
  const query = queryText.toLowerCase()

  if (typingFiltersDefault.value) {
    return country.includes(query) || code.includes(query)
  } else {
    return foundByChars(country, query) || foundByChars(code, query)
  }
}

const rules = () => {
  if (props.purpose !== 'filter') return true
  if (val.value !== null && val.value.length > 0) return true
  else if (props.cond === 'is null' || props.cond === 'null') return true
  else return 'Value is required'
}

// Lifecycle
onMounted(() => {
  // Настройка view в зависимости от purpose
  if (props.purpose === 'filter') {
    view.value = {
      persistentHint: false,
      hideDetails: true,
      filled: true,
      rounded: true,
      dense: true,
      hideIcon: true
    }
  }

  // Инициализация значения
  val.value = props.modelValue
})

// Watchers
watch(() => props.modelValue, (newVal) => {
  val.value = newVal
}, { immediate: true })

// Expose methods if needed
defineExpose({
  setVal,
  remove
})
</script>

<style scoped>
.lang-flag {
  display: inline-block;
  vertical-align: middle;
}
</style>