<template>
  <LayoutItems
    v-if="appStore.localhost"
    :items_type="itemsType"
    :mediaTypeId="mediaTypeId"
    :metaId="metaId"
    :tagId="tagId"
    :tabId="tabId"
  />
</template>

<script setup>
import {ref, computed, watch, onBeforeUnmount} from 'vue'
import {useRoute} from 'vue-router'
import LayoutItems from '@/layouts/LayoutItems.vue'
import {useEventBus} from "@/utils/eventBus"

import {useItemsStore} from '@/stores/items'
import {useAppStore} from '@/stores/app'

const itemsStore = useItemsStore()
const appStore = useAppStore()
const eventBus = useEventBus()
const route = useRoute()

const upd = ref(0)

const env = computed(() => itemsStore.environment)

const readQueryId = (key) => {
  const value = route.query[key]
  return value ? Number(value) : null
}

const mediaTypeId = computed(() => readQueryId('mediaTypeId'))
const metaId = computed(() => readQueryId('metaId'))
const tagId = computed(() => readQueryId('tagId'))
const tabId = computed(() => readQueryId('tabId'))

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
