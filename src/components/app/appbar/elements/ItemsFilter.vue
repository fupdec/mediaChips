<template>
  <AppBarButton
    :text="t('appbar.buttons.filter')"
    icon="filter-outline"
    :action="toggleFilters"
    :badge="badge"
    :active="filtersStore.visible"
  ></AppBarButton>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import AppBarButton from "@/components/app/appbar/AppBarButton.vue"
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'

// Композиции
const {t} = useI18n()
const itemsStore = useItemsStore()
const filtersStore = useAppStore().filters

// Computed properties
const badge = computed(() => {
  if (!itemsStore.filters) return 0
  const activeFilters = itemsStore.filters.filter(i => i.active)
  return activeFilters.length
})

// Methods
const toggleFilters = () => {
  filtersStore.visible = !filtersStore.visible
}
</script>