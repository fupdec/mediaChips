<template>
  <div class="d-flex align-center" style="height: 40px;">
    <AppBarButton
      icon="select-off"
      :text="t('appbar.buttons.unselect')"
      :action="toggleSelect"
    />

    <AppBarButton
      icon="select-group"
      :text="t('appbar.buttons.selectVisible')"
      :action="selectVisible"
    />

    <AppBarButton
      icon="select-all"
      :text="t('appbar.buttons.selectAll')"
      :action="selectAll"
    />

    <span class="text-caption ml-6" v-html="selectedText"></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useItemsStore } from '@/stores/items'

import AppBarButton from '@/components/app/appbar/AppBarButton.vue'
import {getReadableFileSize} from '@/services/formatUtils'

/* ---------------------- STORE ---------------------- */

const itemsStore = useItemsStore()
const { t } = useI18n()

/* ---------------------- COMPUTED ---------------------- */

const filesizes = computed(() => {
  if (itemsStore.type !== 'media') return ''

  if (itemsStore.isAllFilteredSelected) {
    return getReadableFileSize(itemsStore.totalFilesize)
  }

  const selectedFiles = itemsStore.entities.filter(i =>
    itemsStore.selection.includes(i.id)
  )

  const sum = selectedFiles.reduce((a, b) => a + Number(b.filesize || 0), 0)

  return getReadableFileSize(sum)
})

const selectedText = computed(() => {
  const selection = itemsStore.selection.length

  if (!selection) {
    return t('appbar.buttons.Please_select_items')
  }

  let text = `${selection} ${t('appbar.buttons.selected')}`

  if (itemsStore.type === 'media') {
    text += `, ${filesizes.value}`
  }

  return text
})

/* ---------------------- METHODS ---------------------- */

function toggleSelect() {
  itemsStore.isSelect = !itemsStore.isSelect
  itemsStore.selection = []
  itemsStore.selected_last = null
}

function selectVisible() {
  itemsStore.selection = itemsStore.itemsOnPage.map(i => i.id)
}

async function selectAll() {
  await itemsStore.selectAllFiltered()
}
</script>
