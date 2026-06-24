<template>
  <div :class="{ 'no-file': !isFileExists }">
    <v-responsive
      v-if="isViewCard"
      v-ripple="{ class: 'text-primary' }"
      :aspect-ratio="1"
      class="audio-preview-container"
      @click.stop="play"
    >
      <div class="audio-preview-container__icon d-flex align-center justify-center">
        <v-icon size="56" color="grey-lighten-1">mdi-music</v-icon>
      </div>

      <div v-if="durationLabel" class="duration">{{ durationLabel }}</div>
    </v-responsive>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useItemsStore} from '@/stores/items'

const props = defineProps({
  media: Object,
  isFileExists: Boolean,
})

const itemsStore = useItemsStore()

const isViewCard = computed(() =>
  itemsStore.view === 1 || itemsStore.view === '1'
)

const durationLabel = computed(() => {
  const duration = Number(props.media?.duration || 0)
  if (!duration) return ''
  return $readable.getReadableDuration(duration)
})

const play = () => {
  if (!props.isFileExists) return
  itemsStore.playVideo({video: props.media})
}
</script>

<style scoped>
.audio-preview-container {
  position: relative;
  background: rgb(120 120 120 / 12%);
  cursor: pointer;
}

.audio-preview-container__icon {
  width: 100%;
  height: 100%;
}

.duration {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgb(0 0 0 / 65%);
  color: #fff;
  font-size: 12px;
  line-height: 1.2;
}
</style>
