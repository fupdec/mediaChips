<template>
  <div
    ref="containerRef"
    :class="{ 'no-file': !isFileExists }"
  >
    <v-responsive
      v-if="showsPreview"
      v-ripple="{ class: 'text-primary' }"
      :aspect-ratio="aspectRatio"
      class="image-preview-container"
      @click.stop="openViewer"
    >
      <v-img
        :src="thumb || undefined"
        :aspect-ratio="aspectRatio"
        class="thumb"
        contain
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

<script setup lang="ts">
import {ref, computed, watch, onMounted, onBeforeUnmount} from 'vue'
import {typedApi} from '@/services/typedApi'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {loadImageDisplayUrl, revokeImageObjectUrl} from '@/utils/imageSource'
import {getMediaAspectRatio} from '@/utils/gridLayout'
import {
  getReadableVideoHeight,
  getReadableVideoQuality,
} from '@/services/formatUtils'
import type {MediaItem} from '@/types/stores'

const props = defineProps<{
  media: MediaItem
  isFileExists?: boolean
}>()

const store = useAppStore()
const itemsStore = useItemsStore()

const containerRef = ref<HTMLElement | null>(null)
const thumb = ref<string | null>(null)
const isMounted = ref(false)
let thumbObjectUrl: string | null = null
let thumbObserver: IntersectionObserver | null = null
let thumbLoadStarted = false

const ITEMS = computed(() => itemsStore)

const isViewCard = computed(() =>
  Number(ITEMS.value.view) === 1
)

const isViewTimeline = computed(() =>
  Number(ITEMS.value.view) === 2
)

const isViewMasonry = computed(() =>
  Number(ITEMS.value.view) === 3
)

const showsPreview = computed(() =>
  isViewCard.value || isViewTimeline.value || isViewMasonry.value
)

const aspectRatio = computed(() =>
  getMediaAspectRatio(props.media)
)

const quality = computed(() =>
  getReadableVideoQuality(
    Number(props.media?.width) || 0,
    Number(props.media?.height) || 0,
  )
)

const resolutionLabel = computed(() => {
  const width = Number(props.media?.width) || 0
  const height = Number(props.media?.height) || 0
  if (!width || !height) return ''
  return getReadableVideoHeight(width, height)
})

const clearThumbUrl = () => {
  revokeImageObjectUrl(thumbObjectUrl)
  thumbObjectUrl = null
}

const stopThumbObserver = () => {
  thumbObserver?.disconnect()
  thumbObserver = null
}

const regenerateThumb = async () => {
  await typedApi.updateMediaInfo(props.media.id)
}

const loadThumb = async ({cacheBust = false} = {}) => {
  if (!props.media?.id) return
  if (thumbLoadStarted && !cacheBust) return
  thumbLoadStarted = true
  stopThumbObserver()
  clearThumbUrl()

  const src = await loadImageDisplayUrl(props.media, store.mediaPath, {cacheBust})

  if (!isMounted.value) {
    revokeImageObjectUrl(src?.startsWith?.('blob:') ? src : null)
    return
  }

  if (src) {
    thumbObjectUrl = src.startsWith('blob:') ? src : null
    thumb.value = src
    return
  }

  if (props.isFileExists) {
    try {
      await regenerateThumb()
      const regenerated = await loadImageDisplayUrl(props.media, store.mediaPath, {cacheBust: true})
      if (!isMounted.value) {
        revokeImageObjectUrl(regenerated?.startsWith?.('blob:') ? regenerated : null)
        return
      }
      if (regenerated) {
        thumbObjectUrl = regenerated.startsWith('blob:') ? regenerated : null
        thumb.value = regenerated
      }
    } catch (error) {
      console.error('Image thumbnail regeneration failed:', error)
    }
  }
}

const scheduleThumbLoad = () => {
  stopThumbObserver()
  thumbLoadStarted = false

  if (!containerRef.value || !props.isFileExists) return

  thumbObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return
    void loadThumb()
  }, {
    rootMargin: '300px 0px',
  })

  thumbObserver.observe(containerRef.value)
}

const openViewer = () => {
  if (!props.isFileExists) return
  itemsStore.viewImage({
    image: props.media,
    previewSrc: thumb.value || null,
  })
}

onMounted(() => {
  isMounted.value = true
  scheduleThumbLoad()
})

onBeforeUnmount(() => {
  isMounted.value = false
  stopThumbObserver()
  clearThumbUrl()
})

watch(
  () => [props.media?.id, props.isFileExists],
  () => {
    thumb.value = null
    scheduleThumbLoad()
  }
)

watch(() => itemsStore.thumbRefreshKeys[Number(props.media?.id)], (version) => {
  if (version == null) return
  thumb.value = null
  clearThumbUrl()
  thumbLoadStarted = false
  void loadThumb({cacheBust: true})
})
</script>
