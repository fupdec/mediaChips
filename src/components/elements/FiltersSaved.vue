<template>
  <div v-if="savedFilters.length" :key="route.fullPath + 'sf'" class="sf-chips d-flex flex-wrap">
    <v-chip
      v-for="sf in savedFilters"
      @click="activate(sf)"
      :key="sf.id"
      class="ma-1"
      variant="tonal"
      color="primary"
    >
      {{ sf.name }}
    </v-chip>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useEventBus } from '@/utils/eventBus'

// Components (если нужно)
// import FiltersChips from '@/components/elements/FiltersChips.vue'

// Router
const route = useRoute()

// Store
const itemsStore = useItemsStore()
const eventBus = useEventBus()

// Computed properties
const savedFilters = computed(() => itemsStore.filters_saved || [])

// Methods
const activate = (savedFilter) => {
  let filters = savedFilter.filters
  // Удаляем id из фильтров
  if (filters && Array.isArray(filters)) {
    filters = filters.map(filter => ({ ...filter, id: null }))
  }

  // Emit event (можно использовать provide/inject или событие через event bus)
  eventBus.emit('applySavedFilter', filters)
}

// Cleanup
onBeforeUnmount(() => {
  itemsStore.clearSavedFilters()
})
</script>

<style lang="scss" scoped>
.sf-chips {
  margin-bottom: 16px;

  .v-chip {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>