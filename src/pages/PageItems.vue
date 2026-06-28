<template>
  <LayoutItems
    v-if="appStore.localhost && appStore.is_app_ready"
    :items_type="itemsType"
    :mediaTypeId="mediaTypeId"
    :metaId="metaId"
    :tagId="tagId"
    :tabId="tabId"
  />
</template>

<script setup lang="ts">
import {ref, computed, watch, onBeforeUnmount} from 'vue'
import {useRoute} from 'vue-router'
import LayoutItems from '@/layouts/LayoutItems.vue'
import {useEventBus} from "@/utils/eventBus"

import {useItemsStore} from '@/stores/items'
import {useAppStore} from '@/stores/app'
import type {ItemsPageType} from '@/types/itemsPage'

const itemsStore = useItemsStore()
const appStore = useAppStore()
const eventBus = useEventBus()
const route = useRoute()

const upd = ref(0)

const env = computed(() => itemsStore.environment)

const readQueryId = (key: string): number | null => {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return value[0] ? Number(value[0]) : null
  }
  return value ? Number(value) : null
}

const mediaTypeId = computed(() => readQueryId('mediaTypeId') ?? undefined)
const metaId = computed(() => readQueryId('metaId') ?? undefined)
const tagId = computed(() => readQueryId('tagId') ?? undefined)
const tabId = computed(() => readQueryId('tabId') ?? undefined)

const itemsType = computed((): ItemsPageType => {
  if (route.query.mediaTypeId || route.path.startsWith('/media')) {
    return 'media'
  }
  if (route.query.metaId || route.path.startsWith('/meta')) {
    return 'tag'
  }
  return (itemsStore.type as ItemsPageType) || 'media'
})

function applyRouteContext() {
  env.value.media_type_id = readQueryId('mediaTypeId')
  env.value.meta_id = readQueryId('metaId')
  env.value.tag_id = readQueryId('tagId')
  env.value.tab_id = readQueryId('tabId')
}

function updateLayout() {
  upd.value = Date.now()
}

applyRouteContext()

watch(() => route.fullPath, () => {
  applyRouteContext()
  upd.value = Date.now()
})

eventBus.on("updateLayoutItems", updateLayout)

onBeforeUnmount(() => {
  eventBus.off("updateLayoutItems", updateLayout)
})
</script>
