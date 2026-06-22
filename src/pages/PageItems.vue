<template>
  <LayoutItems
    :items_type="itemsType"
    :mediaTypeId="env.media_type_id"
    :metaId="env.meta_id"
    :tagId="env.tag_id"
    :tabId="env.tab_id"
    :key="route.fullPath + upd"
  />
</template>

<script setup>
import {ref, computed, watch, onBeforeUnmount} from 'vue'
import {useRoute} from 'vue-router'
import LayoutItems from '@/layouts/LayoutItems.vue'
import {useEventBus} from "@/utils/eventBus"

import {useItemsStore} from '@/stores/items'

const itemsStore = useItemsStore()
const eventBus = useEventBus()
const route = useRoute()

const upd = ref(0)

const env = computed(() => itemsStore.environment)
const itemsType = computed(() => {
  if (route.query.mediaTypeId || route.path.startsWith('/media')) {
    return 'media'
  }
  if (route.query.metaId || route.path.startsWith('/meta')) {
    return 'tag'
  }
  return itemsStore.type || 'media'
})

function applyRouteContext() {
  env.value.media_type_id = $readable.getUrlParam('mediaTypeId')
  env.value.meta_id = $readable.getUrlParam('metaId')
  env.value.tag_id = $readable.getUrlParam('tagId')
  env.value.tab_id = $readable.getUrlParam('tabId')

  if (route.query.mediaTypeId) {
    itemsStore.type = 'media'
  } else if (route.query.metaId || route.path.startsWith('/meta')) {
    itemsStore.type = 'tag'
  } else if (route.path.startsWith('/media')) {
    itemsStore.type = 'media'
  }
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
