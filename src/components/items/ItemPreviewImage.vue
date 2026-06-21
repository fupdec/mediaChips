<template>
  <div :class="{ 'no-file': !isFileExists }">
    <v-responsive
      v-if="isViewCard || isViewTimeline"
      v-ripple="{ class: 'text-primary' }"
      :aspect-ratio="aspectRatio"
      class="image-preview-container"
      @click.stop="openViewer"
    >
      <v-img
        :src="thumb"
        :aspect-ratio="aspectRatio"
        class="thumb"
        cover
      />

      <div v-if="resolutionLabel" class="resolution">
        <div :class="quality.toLowerCase()" class="text">
          {{ quality }}
        </div>
        <div class="value">
          {{ resolutionLabel }}
        </div>
      </div>
    </v-responsive>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onBeforeUnmount} from 'vue'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {loadImageDisplayUrl, revokeImageObjectUrl} from '@/utils/imageSource'

const props = defineProps({
  media: Object,
  isFileExists: Boolean,
})

const store = useAppStore()
const itemsStore = useItemsStore()

const thumb = ref(null)
let thumbObjectUrl = null

const ITEMS = computed(() => itemsStore)

const isViewCard = computed(() =>
  ITEMS.value.view === 1 || ITEMS.value.view === '1'
)

const isViewTimeline = computed(() =>
  ITEMS.value.view === 2 || ITEMS.value.view === '2'
)

const aspectRatio = computed(() => {
  const width = Number(props.media?.width) || 0
  const height = Number(props.media?.height) || 0

  if (width > 0 && height > 0) {
    return Math.min(Math.max(width / height, 0.5), 2)
  }

  return 1
})

const quality = computed(() =>
  $readable.getReadableVideoQuality(props.media?.width, props.media?.height)
)

const resolutionLabel = computed(() => {
  if (!props.media?.width || !props.media?.height) return ''
  return $readable.getReadableVideoHeight(props.media.width, props.media.height)
})

const clearThumbUrl = () => {
  revokeImageObjectUrl(thumbObjectUrl)
  thumbObjectUrl = null
}

const regenerateThumb = async () => {
  await axios.post(`${store.localhost}/api/Task/updateMediaInfo`, {
    id: props.media.id,
  })
}

const loadThumb = async () => {
  clearThumbUrl()

  const src = await loadImageDisplayUrl(props.media, store.mediaPath)

  if (src) {
    thumbObjectUrl = src.startsWith('blob:') ? src : null
    thumb.value = src
    return
  }

  if (props.isFileExists) {
    try {
      await regenerateThumb()
      const regenerated = await loadImageDisplayUrl(props.media, store.mediaPath)
      if (regenerated) {
        thumbObjectUrl = regenerated.startsWith('blob:') ? regenerated : null
        thumb.value = regenerated
      }
    } catch (error) {
      console.error('Image thumbnail regeneration failed:', error)
    }
  }
}

const openViewer = () => {
  if (!props.isFileExists) return
  itemsStore.viewImage({image: props.media})
}

onMounted(loadThumb)

onBeforeUnmount(clearThumbUrl)

watch(
  () => [props.media?.id, props.isFileExists],
  () => {
    loadThumb()
  }
)
</script>
