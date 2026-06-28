<template>
  <div :class="{ 'no-file': !isFileExists }">
    <v-responsive
      v-if="isViewCard || isViewTimeline"
      v-ripple="{ class: 'text-primary' }"
      :aspect-ratio="1"
      class="text-preview-container"
      @click.stop="open"
    >
      <div class="text-preview-container__icon d-flex align-center justify-center">
        <v-icon size="56" color="grey-lighten-1">mdi-file-document-outline</v-icon>
      </div>
    </v-responsive>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useItemsStore} from '@/stores/items'
import {openPath} from '@/services/shellService'
import type {MediaItem} from '@/types/stores'

const props = defineProps<{
  media: MediaItem
  isFileExists?: boolean
}>()

const itemsStore = useItemsStore()

const isViewCard = computed(() =>
  Number(itemsStore.view) === 1
)

const isViewTimeline = computed(() =>
  Number(itemsStore.view) === 2
)

const open = () => {
  if (!props.isFileExists || !props.media?.path) return
  openPath(props.media.path)
}
</script>

<style scoped>
.text-preview-container {
  position: relative;
  background: rgb(120 120 120 / 12%);
  cursor: pointer;
}

.text-preview-container__icon {
  width: 100%;
  height: 100%;
}
</style>
