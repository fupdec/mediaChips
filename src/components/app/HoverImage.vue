<template>
  <div
    v-show="hover.show && !contextMenuVisible"
    class="hover-image"
    :style="style"
  >
    <img v-if="src" :src="src" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import path from 'path-browserify'

/* store */
import { useAppStore } from '@/stores/app'
import {getLocalImage} from '@/services/fileService'

const appStore = useAppStore()
const hover = useAppStore().hover

const src = ref(null)

/* computed */
const contextMenuVisible = computed(
  () => appStore.contextMenu?.show
)

const style = computed(() => ({
  top: `${hover.y + 30}px`,
  left: `${hover.x + 30}px`,
  width: `${hover.previewWidth || 160}px`,
  height: `${hover.previewHeight || 160}px`,
}))

/* methods */
async function getHoveredImage () {
  src.value = null

  if (!hover?.tagId) return

  // MEDIA
  if (hover.data_type === 'media') {
    const imgPath = path.join(
      appStore.dbPath,
      'media',
      'videos',
      'thumbs',
      `${hover.tagId}.jpg`
    )

    src.value = await getLocalImage(imgPath)
    return
  }

  // META
  const variants = ['avatar', 'main']

  const paths = variants.map(i =>
    path.join(
      appStore.dbPath,
      'meta',
      `${hover.metaId}`,
      `${hover.tagId}_${i}.jpg`
    )
  )

  for (const imgPath of paths) {
    const image = await getLocalImage(imgPath)
    const isEmpty = image?.includes('unavailable.png')

    src.value = image
    if (!isEmpty) break
  }
}

/* watchers */
watch(
  () => hover.tagId,
  async () => {
    await getHoveredImage()
  }
)
</script>