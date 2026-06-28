<template>
  <AppBarButton
    :action="add"
    :text="t('appbar.buttons.create_tab')"
    :disabled="route.path === '/tag'"
    icon="tab"
  />
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores/app'
import { useItemsStore } from '@/stores/items'

import AppbarButton from '@/components/app/appbar/AppBarButton.vue'
import {apiClient} from '@/services/apiClient'
import {getTabUrl} from '@/services/routeService'
import {useEventBus} from '@/utils/eventBus'
import type { TabLike } from '@/types/common'

/* ---------------- STORES ---------------- */

const app = useAppStore()
const items = useItemsStore()

/* ---------------- UTILS ---------------- */

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const eventBus = useEventBus()

const ENV = items.environment

/* ---------------- METHODS ---------------- */

async function add() {
  try {
    const { data } = await apiClient.post<TabLike>('/api/tab', {
      name: items.name,
      icon: items.icon,
      url: route.path,
      tagId: ENV.tag_id,
      mediaTypeId: ENV.media_type_id,
      metaId: ENV.meta_id,
    })

    // заменяет Vue.prototype.$getTabUrl
    const url = getTabUrl(data)

    router.push(url)

    // заменяет $root.$emit("getTabs")
    eventBus.emit('getTabs')

  } catch (e) {
    console.error(e)
  }
}
</script>
