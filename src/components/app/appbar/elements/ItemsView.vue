<template>
  <v-chip-group column>
    <v-chip
      v-for="(item, index) in viewOptions"
      @click="updateView(item.val)"
      :key="index"
      :variant="currentView == item.val ? 'flat' : 'outlined'"
      base-color="primary"
    >
      <v-icon start>mdi-{{ item.icon }}</v-icon>
      {{ t(item.textKey) }}
    </v-chip>
  </v-chip-group>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useItemsStore } from '@/stores/items'
import { useAppStore } from '@/stores/app'
import { getCurrentMediaType, isVideoMediaType } from '@/utils/mediaType'
import emitter from '@/utils/eventBus'

// Store
const itemsStore = useItemsStore()
const appStore = useAppStore()
const {t} = useI18n()

// State
const viewOptions = ref([
  {
    val: "1",
    icon: "view-module",
    textKey: "items.view.card",
  }
])

// Computed
const currentView = computed(() => itemsStore.view || "1")

const currentMediaType = computed(() => {
  if (itemsStore.type !== 'media') return null
  return getCurrentMediaType(appStore.mediaTypes, itemsStore.environment?.media_type_id)
})

// Methods
const initViewOptions = () => {
  // Сбрасываем к базовому варианту
  viewOptions.value = [
    {
      val: "1",
      icon: "view-module",
      textKey: "items.view.card",
    }
  ]

  // Таймлайн доступен только для видео
  if (itemsStore.type === 'media' && isVideoMediaType(currentMediaType.value)) {
    viewOptions.value.push({
      val: "2",
      icon: "view-sequential",
      textKey: "items.view.timeline",
    })
  } else if (itemsStore.type === 'tag') {
    viewOptions.value.push({
      val: "2",
      icon: "format-line-style",
      textKey: "items.view.chip",
    })
  }

  if (itemsStore.type === 'media' && !isVideoMediaType(currentMediaType.value) && currentView.value === '2') {
    updateView('1')
  }
}

const updateView = (val) => {
  // Обновляем в хранилище
  itemsStore.updateState({ key: 'view', value: val })

  // Отправляем событие через event bus
  emitter.emit('setItemsView', val)

  // Или отправляем кастомное событие
  const viewChangedEvent = new CustomEvent('items-view-changed', {
    detail: { view: val }
  })
  window.dispatchEvent(viewChangedEvent)
}

// Lifecycle
onMounted(() => {
  initViewOptions()
})

// Watchers
watch(() => itemsStore.type, () => {
  initViewOptions()
})

watch(
  () => [itemsStore.environment?.media_type_id, appStore.mediaTypes],
  () => {
    initViewOptions()
  },
  {deep: true},
)
</script>