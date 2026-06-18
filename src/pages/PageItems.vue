<template>
  <LayoutItems
    v-if="isInit"
    :items_type="itemsType"
    :mediaTypeId="env.media_type_id"
    :metaId="env.meta_id"
    :tagId="env.tag_id"
    :tabId="env.tab_id"
    :key="route.fullPath + upd"
  />
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted} from 'vue'
import {useRoute} from 'vue-router'
import LayoutItems from '@/layouts/LayoutItems.vue'
import {useEventBus} from "@/utils/eventBus"

import {useItemsStore} from '@/stores/items'

/* stores */
const itemsStore = useItemsStore()
const eventBus = useEventBus()

/* router */
const route = useRoute()

/* local state */
const isInit = ref(false)
const upd = ref(0)

/* computed */
const env = computed(() => itemsStore.environment)
const itemsType = computed(() => itemsStore.type)

/* helpers */
function updateLayout() {
  upd.value = Date.now()
}

/* lifecycle */
onMounted(() => {
  /* ENV */
  env.value.media_type_id = $readable.getUrlParam('mediaTypeId')
  env.value.meta_id = $readable.getUrlParam('metaId')
  env.value.tag_id = $readable.getUrlParam('tagId')
  env.value.tab_id = $readable.getUrlParam('tabId')

  /* type */
  if ($readable.checkCurrentPage('meta')) {
    itemsStore.type = 'tag'
  } else if ($readable.checkCurrentPage('media')) {
    itemsStore.type = 'media'
  }

  upd.value = Date.now()
  isInit.value = true

  eventBus.on("updateLayoutItems", updateLayout)
})

onUnmounted(() => {
  eventBus.off("updateLayoutItems", updateLayout)
  isInit.value = false
})
</script>
