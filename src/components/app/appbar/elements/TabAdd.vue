<template>
  <AppBarButton
    :action="add"
    :text="t('appbar.buttons.create_tab')"
    :disabled="route.path === '/tag'"
    icon="tab"
  />
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores/app'
import { useItemsStore } from '@/stores/items'

import AppbarButton from '@/components/app/appbar/AppBarButton.vue'
import axios from 'axios'

/* ---------------- STORES ---------------- */

const app = useAppStore()
const items = useItemsStore()

/* ---------------- UTILS ---------------- */

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const apiUrl = app.localhost
const ENV = items.environment

/* ---------------- METHODS ---------------- */

async function add() {
  try {
    const { data } = await axios.post(apiUrl + '/api/tab', {
      name: items.name,
      icon: items.icon,
      url: route.path,
      tagId: ENV.tag_id,
      mediaTypeId: ENV.media_type_id,
      metaId: ENV.meta_id,
    })

    // заменяет Vue.prototype.$getTabUrl
    const url = $readable.getTabUrl(data)

    router.push(url)

    // заменяет $root.$emit("getTabs")
    items.fetchTabs()

  } catch (e) {
    console.error(e)
  }
}
</script>
