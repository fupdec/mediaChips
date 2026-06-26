<template>
  <v-dialog
    @update:model-value="onDialogToggle"
    :model-value="viewer.active"
    :fullscreen="viewer.fullscreen"
    content-class="dialog-image-viewer"
    width="2000"
    no-click-animation
  >
    <div
      ref="viewerRootRef"
      :class="{ fullscreen: viewer.fullscreen }"
      class="image-viewer"
      tabindex="-1"
    >
      <div class="image-viewer__toolbar">
        <div class="image-viewer__title">
          <div class="image-viewer__name" :title="currentName">
            {{ currentName }}
          </div>
          <div v-if="viewer.counter" class="image-viewer__counter">
            {{ viewer.counter }}
          </div>
        </div>

        <v-spacer />

        <v-btn-group density="comfortable" variant="tonal" divided>
          <v-btn
            @click="goPrev"
            :disabled="!viewer.hasPrev"
            icon="mdi-chevron-left"
            :title="t('image.viewer.previous')"
          />
          <v-btn
            @click="goNext"
            :disabled="!viewer.hasNext"
            icon="mdi-chevron-right"
            :title="t('image.viewer.next')"
          />
          <v-btn
            @click="zoomOut"
            icon="mdi-magnify-minus"
            :title="t('image.viewer.zoom_out')"
          />
          <v-btn
            @click="resetView"
            icon="mdi-fit-to-screen"
            :title="t('image.viewer.fit')"
          />
          <v-btn
            @click="zoomIn"
            icon="mdi-magnify-plus"
            :title="t('image.viewer.zoom_in')"
          />
          <v-btn
            @click="toggleFullscreen"
            :icon="viewer.fullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            :title="t('image.viewer.fullscreen')"
          />
          <v-btn
            @click="editImage"
            icon="mdi-pencil"
            :title="t('common.edit')"
          />
          <v-btn
            @click="openInSystem"
            :disabled="!viewer.isFileExists"
            icon="mdi-open-in-new"
            :title="t('image.viewer.open_external')"
          />
          <v-btn
            @click="closeViewer"
            icon="mdi-close"
            :title="t('common.close')"
          />
        </v-btn-group>
      </div>

      <div
        ref="stageRef"
        class="image-viewer__stage"
        @wheel.prevent="onWheel"
        @mousedown="onPanStart"
        @dblclick="onDoubleClick"
      >
        <v-progress-circular
          v-if="viewer.loading && !displaySrc"
          indeterminate
          color="white"
          size="64"
        />

        <img
          v-if="displaySrc"
          :src="displaySrc"
          :style="transformStyle"
          class="image-viewer__image"
          draggable="false"
          alt=""
        />

        <div v-else-if="!viewer.loading" class="image-viewer__error">
          <v-alert type="error" variant="tonal">
            {{ t('image.cannot_obtain') }}
          </v-alert>
          <v-btn
            v-if="viewer.isFileExists"
            @click="openInSystem"
            class="mt-4"
            color="primary"
            rounded
          >
            <v-icon start>mdi-open-in-new</v-icon>
            {{ t('image.viewer.open_external') }}
          </v-btn>
        </div>
      </div>

      <div v-if="infoLine" class="image-viewer__info">
        {{ infoLine }}
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useDialogsStore} from '@/stores/dialogs'
import {useItemsStore} from '@/stores/items'
import {useImageViewerStore} from '@/stores/imageViewer'
import {useEventBus} from '@/utils/eventBus'
import {loadThumbDisplayUrl, loadFullImageDisplayUrl, revokeImageObjectUrl} from '@/utils/imageSource'
import {checkFileExists} from '@/services/fileService'
import {getReadableFileSize} from '@/services/formatUtils'
import {openPath} from '@/services/shellService'

const appStore = useAppStore()
const dialogsStore = useDialogsStore()
const viewer = useImageViewerStore()
const eventBus = useEventBus()
const {t} = useI18n()

const viewerRootRef = ref(null)
const stageRef = ref(null)
const displaySrc = ref(null)

const panState = ref({
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
})

let objectUrl = null
let ownsObjectUrl = false
let loadToken = 0

const currentName = computed(() => viewer.currentImage?.name || '')

const transformStyle = computed(() => ({
  transform: `translate(${viewer.translateX}px, ${viewer.translateY}px) scale(${viewer.scale})`,
}))

const infoLine = computed(() => {
  const image = viewer.currentImage
  if (!image) return ''

  const parts = []

  if (image.width && image.height) {
    parts.push(`${image.width}×${image.height}`)
  }

  if (image.filesize) {
    parts.push(getReadableFileSize(image.filesize))
  }

  if (image.path) {
    parts.push(image.path)
  }

  return parts.join(' · ')
})

const clearObjectUrl = () => {
  if (ownsObjectUrl) {
    revokeImageObjectUrl(objectUrl)
  }
  objectUrl = null
  ownsObjectUrl = false
  displaySrc.value = null
}

const setDisplaySrc = (src, {owned = false} = {}) => {
  if (owned && objectUrl && objectUrl !== src) {
    revokeImageObjectUrl(objectUrl)
  }

  objectUrl = owned && src?.startsWith('blob:') ? src : null
  ownsObjectUrl = owned && Boolean(objectUrl)
  displaySrc.value = src
}

const loadCurrentImage = async () => {
  const token = ++loadToken
  const image = viewer.currentImage
  if (!image) {
    clearObjectUrl()
    return
  }

  viewer.setLoading(true)
  clearObjectUrl()

  const previewSrc = viewer.previewSrc
  viewer.previewSrc = null

  if (previewSrc) {
    setDisplaySrc(previewSrc, {owned: false})
    viewer.setLoading(false)
  }

  const existsPromise = checkFileExists(image.path)

  if (!previewSrc) {
    try {
      const thumbSrc = await loadThumbDisplayUrl(image, appStore.mediaPath)
      if (token === loadToken && thumbSrc) {
        setDisplaySrc(thumbSrc, {owned: true})
        viewer.setLoading(false)
      }
    } catch (error) {
      console.error('Failed to load image thumbnail for viewer:', error)
    }
  }

  try {
    const fullSrc = await loadFullImageDisplayUrl(image)
    if (token === loadToken && fullSrc) {
      setDisplaySrc(fullSrc, {owned: true})
    }
  } catch (error) {
    console.error('Failed to load full image for viewer:', error)
  } finally {
    if (token === loadToken) {
      viewer.setFileExists(await existsPromise)
      viewer.setLoading(false)
    }
  }
}

const closeViewer = () => {
  viewer.close()
  clearObjectUrl()
}

const onDialogToggle = (value) => {
  if (!value) closeViewer()
}

const goPrev = async () => {
  if (viewer.prev()) await loadCurrentImage()
}

const goNext = async () => {
  if (viewer.next()) await loadCurrentImage()
}

const zoomIn = () => viewer.zoomIn()
const zoomOut = () => viewer.zoomOut()
const resetView = () => viewer.resetTransform()
const toggleFullscreen = () => viewer.toggleFullscreen()

const onWheel = (event) => {
  if (event.deltaY < 0) viewer.zoomIn()
  else viewer.zoomOut()
}

const onPanStart = (event) => {
  if (event.button !== 0 || !displaySrc.value) return

  panState.value = {
    active: true,
    startX: event.clientX,
    startY: event.clientY,
    originX: viewer.translateX,
    originY: viewer.translateY,
  }

  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanEnd)
}

const onPanMove = (event) => {
  if (!panState.value.active) return

  viewer.translateX = panState.value.originX + (event.clientX - panState.value.startX)
  viewer.translateY = panState.value.originY + (event.clientY - panState.value.startY)
}

const onPanEnd = () => {
  panState.value.active = false
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanEnd)
}

const onDoubleClick = () => {
  if (viewer.scale === 1) {
    viewer.scale = 2
    return
  }

  viewer.resetTransform()
}

const editImage = () => {
  const image = viewer.currentImage
  if (!image) return

  dialogsStore.editMedia(image)
}

const openInSystem = () => {
  const image = viewer.currentImage
  if (!image?.path || !viewer.isFileExists) return
  openPath(image.path)
}

const onKeyDown = (event) => {
  if (!viewer.active) return

  switch (event.key) {
    case 'Escape':
      closeViewer()
      break
    case 'ArrowLeft':
      event.preventDefault()
      goPrev()
      break
    case 'ArrowRight':
      event.preventDefault()
      goNext()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
    case '_':
      event.preventDefault()
      zoomOut()
      break
    case 'f':
    case 'F':
      event.preventDefault()
      toggleFullscreen()
      break
    case '0':
      event.preventDefault()
      resetView()
      break
    default:
      break
  }
}

const openFromEvent = ({imageIds, index = 0, fallbackImage = null, previewSrc = null}) => {
  if (!imageIds?.length) return

  viewer.open({imageIds, index, fallbackImage, previewSrc})

  if (fallbackImage) {
    queueMicrotask(() => {
      const itemsStore = useItemsStore()
      const playlistIds = itemsStore.buildImageViewerPlaylistIds(fallbackImage)
      const playlistIndex = Math.max(0, playlistIds.indexOf(fallbackImage.id))
      viewer.setPlaylist(playlistIds, playlistIndex)
    })
  }

  void loadCurrentImage()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  eventBus.on('viewImage', openFromEvent)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanEnd)
  eventBus.off('viewImage', openFromEvent)
  clearObjectUrl()
})
</script>
