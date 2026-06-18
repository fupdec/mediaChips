<template>
  {{modelValue}}
  <v-rating
    @update:model-value="setVal"
    :model-value="internalValue"
    :readonly="read_only"
    :length="meta?.ratingMax"
    :full-icon="fullIcon"
    :empty-icon="emptyIcon"
    :half-increments="meta?.ratingHalf"
    :half-icon="halfIcon"
    :active-color="meta?.ratingColor"
    color="grey"
    density="compact"
    :class="{ 'in-card': in_card }"
    clearable
    hover
  ></v-rating>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import axios from 'axios'
import _ from 'lodash'
import {useAppStore} from '@/stores/app'

// Props
const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: 0
  },
  meta_id: {
    type: Number,
    required: true
  },
  read_only: {
    type: Boolean,
    default: false
  },
  in_card: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:model-value'])

// Stores
const appStore = useAppStore()
const metaStore = useAppStore().meta

// Reactive state
const meta = ref({})

// Computed properties
const internalValue = computed(() => props.modelValue || 0)

const fullIcon = computed(() => {
  return `mdi-${meta.value?.ratingIcon || 'star'}`
})

const emptyIcon = computed(() => {
  const icon = meta.value?.ratingIconEmpty || meta.value?.ratingIcon || 'star'
  return `mdi-${icon}`
})

const halfIcon = computed(() => {
  const icon = meta.value?.ratingIconHalf || meta.value?.ratingIcon || 'star'
  return `mdi-${icon}`
})

// Methods
const setVal = (val) => {
  emit('update:model-value', val)
}

const getMeta = async () => {
  if (!props.meta_id) return

  try {
    // Пробуем получить мету из store
    const metaFromStore = _.find(metaStore, props.meta_id)

    if (metaFromStore) {
      meta.value = metaFromStore
    } else {
      // Если нет в store, запрашиваем с сервера
      const response = await axios.get(appStore.localhost + "/api/meta/" + props.meta_id)
      meta.value = response.data
    }
  } catch (error) {
    console.error('Error fetching meta:', error)
  }
}

// Lifecycle
onMounted(() => {
  getMeta()
})

// Watch for meta_id changes
import {watch} from 'vue'

watch(() => props.meta_id, (newId) => {
  if (newId) {
    getMeta()
  }
})
</script>