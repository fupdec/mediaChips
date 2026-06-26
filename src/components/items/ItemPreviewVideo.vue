<template>
  <div :class="{ 'no-file': !isFileExists }">
    <!-- CARD VIEW -->
    <v-responsive
      v-if="isViewCard"
      ref="previewRef"
      v-ripple="bigPreview ? false : { class: `text-primary` }"
      :aspect-ratio="16 / 9"
      class="video-preview-container"
      @blur="handlePreviewBlur"
      @click="handlePreviewClick"
      @contextmenu="handlePreviewContextMenu"
      @mouseleave="handleMouseLeave"
      @mousemove="changePreviewTime"
      @mouseenter="handleMouseEnter"
    >
      <v-img
        :aspect-ratio="16 / 9"
        :src="thumb || undefined"
        class="thumb"
        contain
        @click.stop="play"
      />

      <div class="duration">{{ duration }}</div>

      <div
        v-if="isShowProgress && !playbackError"
        :style="{ right: progressPosition }"
        class="progress"
      />

      <div class="resolution">
        <div :class="quality.toLowerCase()"
          class="text">
          {{ quality }}
        </div>
        <div class="value">
          {{ height }}
        </div>
      </div>

      <!-- VIDEO PREVIEW -->
      <div
        v-if="showVideoPreview"
        :style="{ animationDelay: `${SETTINGS.delayVideoPreview}ms` }"
        class="preview"
        @click.stop="play"
      >
        <video
          ref="videoRef"
          :class="{ 'video-playback-error': playbackError }"
          :muted="muted"
          autoplay
          loop
          @error="handleVideoError"
          @loadeddata="handleVideoLoaded"
        />
        <div v-if="playbackError"
          class="playback-error">
          ERROR: format not supported
        </div>
      </div>

      <!-- TIMELINE PREVIEW -->
      <div
        v-if="showTimelinePreview"
        :class="{ 'no-frame': isFrameLost }"
        class="timeline"
        @click.stop="play"
      >
        <div v-if="isFrameLost"
          class="text-gen">
          <v-progress-circular v-if="isTaskRunning"
            indeterminate
            color="white">
            <v-icon size="small">mdi-image</v-icon>
          </v-progress-circular>
          <v-btn v-else
            @click.stop="restartImageGeneration"
            style="z-index: 1">
            <v-icon start>mdi-cogs</v-icon>
            Generate images
          </v-btn>
        </div>

        <img :src="frame"/>

        <div class="sections">
          <div
            v-for="(t, i) in timelines"
            :key="i"
            class="section"
            @mouseover="getFrameImg(t)"
          />
        </div>
      </div>
    </v-responsive>

    <!-- BIG PREVIEW ANIMATION -->
    <v-responsive
      v-if="bigPreviewAnimation && !playbackError"
      :aspect-ratio="16 / 9"
      class="big-preview-plug"
    >
      <v-card
        class="d-flex align-center justify-center"
        color="black"
        height="100%"
        variant="flat"
      >
        <v-progress-circular indeterminate
          color="white">
          <v-icon>mdi-play</v-icon>
        </v-progress-circular>
      </v-card>
    </v-responsive>

    <!-- TIMELINE VIEW -->
    <div v-if="isViewTimeline">
      <div
        ref="storyRef"
        v-ripple="{ class: `text-primary` }"
        class="story"
        @click="play"
        @mouseleave="stopScrollStory"
        @mousemove.capture="scrollStory"
      >
        <div v-if="isFileExists && isFramesLost"
          class="message">
          <v-sheet>{{ t('media.preview.frames_in_progress') }}</v-sheet>
        </div>

        <div class="resolution">
          <div :class="quality.toLowerCase()"
            class="text">
            {{ quality }}
          </div>
          <div class="value">{{ height }}</div>
        </div>

        <div
          ref="storyWrapperRef"
          :class="{ hovered: isHovered }"
          class="wrapper"
        >
          <div
            v-for="(img, i) in frames"
            :key="i"
            class="frame"
          >
            <img :src="img"/>
            <div class="duration">{{ duration }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onBeforeUnmount, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import path from 'path-browserify'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useTasksStore} from '@/stores/tasks'
import {useContextMenu} from '@/stores/contextMenu'
import {useEventBus} from '@/utils/eventBus'
import _ from 'lodash'
import {apiClient} from '@/services/apiClient'
import {createThumb as createVideoThumb, getLocalImage} from '@/services/fileService'
import {
  getReadableDuration,
  getReadableVideoHeight,
  getReadableVideoQuality,
} from '@/services/formatUtils'
import {setNotification} from '@/services/notificationService'
import {setOption} from '@/services/settingsService'

// props
const props = defineProps({
  media: Object,
  isFileExists: Boolean,
})

const emit = defineEmits(['update-big-preview'])

// store
const store = useAppStore()
const itemsStore = useItemsStore()
const settingsStore = useSettingsStore()
const tasksStore = useTasksStore()
const contextMenuStore = useContextMenu()
const eventBus = useEventBus()
const {t} = useI18n()

// refs
const previewRef = ref(null)
const videoRef = ref(null)
const storyRef = ref(null)
const storyWrapperRef = ref(null)

// state
const isHovered = ref(false)
const thumb = ref(null)
const frame = ref(null)
const frames = ref([])
const progress = ref(0)

const timelines = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
const timeouts = {}
const bigPreview = ref(false)
const bigPreviewAnimation = ref(false)
const playbackError = ref(false)
const isProcessingHover = ref(false) // Новый флаг для отслеживания обработки наведения
const isSettingThumb = ref(false)
const isCreatingThumb = ref(false)
const thumbCreateAttempted = ref(false)
const bigPreviewMenuActive = ref(false)
const menuClosedByAction = ref(false)
const previewPausedForMenu = ref(false)
const isMounted = ref(false)

const isThumbUnavailable = (src) =>
  !src || (typeof src === 'string' && src.includes('unavailable.png'))

// computed
const ITEMS = computed(() => itemsStore)
const SETTINGS = computed(() => settingsStore)

const muted = computed(() => SETTINGS.value.play_sound_on_video_preview !== '1')

const quality = computed(() =>
  getReadableVideoQuality(props.media.width, props.media.height)
)

const isTaskRunning = computed(() =>
  tasksStore.list.find(task => task.title === 'Generating timeline images')
)

const height = computed(() =>
  getReadableVideoHeight(props.media.width, props.media.height)
)

const duration = computed(() =>
  getReadableDuration(props.media.duration)
)

const isFrameLost = computed(() =>
  frame.value ? frame.value.includes('unavailable.png') : true
)

const isFramesLost = computed(() =>
  frames.value[0] ? frames.value[0] === thumb.value : true
)

const progressPosition = computed(() =>
  `${100 - (progress.value / props.media.duration) * 100}%`
)

const isShowProgress = computed(() =>
  SETTINGS.value.videoPreviewHover === 'video' &&
  props.isFileExists &&
  isHovered.value
)

const isViewCard = computed(() =>
  ITEMS.value.view === 1 || ITEMS.value.view === '1'
)

const isViewTimeline = computed(() =>
  ITEMS.value.view === 2 || ITEMS.value.view === '2'
)

const is_window_focused = computed(() => store.window.focused)

const showVideoPreview = computed(() =>
  SETTINGS.value.videoPreviewHover === 'video' &&
  props.isFileExists &&
  isHovered.value
)

const showTimelinePreview = computed(() =>
  SETTINGS.value.videoPreviewHover === 'timeline' &&
  props.isFileExists &&
  isHovered.value
)

// Перенесенные методы из первого файла
const removeClasses = () => {
  const preview = previewRef.value.$el
  preview.classList.remove("big-preview")
  preview.classList.remove("shrink-down")
  bigPreviewAnimation.value = false
}

const shrink = () => {
  const preview = previewRef.value.$el

  // Remove cloned element from DOM after animation is over
  preview.addEventListener("animationend", removeClasses)

  // Trigger browser reflow to start animation
  preview.style.animation = 'none'
  preview.offsetHeight
  preview.style.animation = ''
  preview.classList.add("shrink-down")
}

const toggleFullScreen = () => {
  const preview = previewRef.value.$el
  preview.removeEventListener("animationend", removeClasses)
  const {top, right, bottom, left} = preview.getBoundingClientRect()
  const inset = `${top}px ${right}px ${bottom}px ${left}px`
  preview.style.setProperty("--inset", inset)
  preview.style.setProperty("--preview-width", preview.offsetWidth + "px")
  preview.style.setProperty("--preview-height", preview.offsetHeight + "px")
  if (bigPreview.value && !playbackError.value) {
    preview.classList.add('big-preview')
  }
}

// Модифицированные методы
const loadThumb = async (imgPath, {bust = false} = {}) => {
  const previous = thumb.value
  const src = await getLocalImage(imgPath, false, bust)

  if (!isMounted.value) {
    if (src?.startsWith?.('blob:')) {
      URL.revokeObjectURL(src)
    }
    return imgPath
  }

  thumb.value = src

  if (previous?.startsWith?.('blob:') && previous !== src) {
    URL.revokeObjectURL(previous)
  }

  return imgPath
}

const maybeCreateMissingThumb = async (imgPath) => {
  if (!props.isFileExists || !isThumbUnavailable(thumb.value)) return
  if (isCreatingThumb.value || thumbCreateAttempted.value) return

  isCreatingThumb.value = true
  thumbCreateAttempted.value = true
  try {
    await createThumb(imgPath)
  } finally {
    isCreatingThumb.value = false
  }
}

const getImg = async ({bust = false, allowCreate = true} = {}) => {
  if (!isMounted.value || !props.media?.id) return

  const getThumb = async (videos_folder) => {
    const imgPath = path.join(
      store.mediaPath,
      videos_folder,
      props.media.id + ".jpg"
    )
    await loadThumb(imgPath, {bust})
    return imgPath
  }

  const is_grid = settingsStore.videoPreviewStatic === "grid"

  if (is_grid && isViewCard.value) {
    await getThumb("videos/grids")
    if (allowCreate && isThumbUnavailable(thumb.value)) {
      const imgPath = await getThumb("videos/thumbs")
      await maybeCreateMissingThumb(imgPath)
    }
  } else {
    const imgPath = await getThumb("videos/thumbs")
    if (allowCreate) {
      await maybeCreateMissingThumb(imgPath)
    }
  }
}

const createThumb = async (imgPath) => {
  try {
    await apiClient.post('/api/Task/createThumbForVideo', {
      path: props.media.path,
      id: props.media.id,
    })
    await loadThumb(imgPath, {bust: true})
  } catch (e) {
    console.log(e)
  }
}

const togglePreviewMute = () => {
  const nextValue = SETTINGS.value.play_sound_on_video_preview === '1' ? '0' : '1'
  setOption(nextValue, 'play_sound_on_video_preview')
}

const pausePreviewForMenu = () => {
  const video = videoRef.value
  if (!video || video.paused) {
    previewPausedForMenu.value = false
    return
  }

  video.pause()
  previewPausedForMenu.value = true
}

const resumePreviewAfterMenu = () => {
  if (!previewPausedForMenu.value || !bigPreview.value) {
    previewPausedForMenu.value = false
    return
  }

  const video = videoRef.value
  previewPausedForMenu.value = false

  if (!video || playbackError.value) return

  video.play().catch((error) => {
    console.error('Video playback error:', error)
    playbackError.value = true
  })
}

const shouldKeepBigPreviewOpen = () => {
  return bigPreview.value && (contextMenuStore.show || bigPreviewMenuActive.value)
}

const handlePreviewClick = () => {
  stopPlayingPreview()
}

const handlePreviewBlur = () => {
  stopPlayingPreview()
}

const setAsThumbFromPreview = async () => {
  if (!props.isFileExists || isSettingThumb.value) return

  const video = videoRef.value
  if (!video) return

  const currentTime = Number.isFinite(video.currentTime)
    ? video.currentTime
    : progress.value

  const imgPath = path.join(
    store.mediaPath || '',
    'videos/thumbs',
    `${props.media.id}.jpg`,
  )

  const time = new Date(currentTime * 1000).toISOString().substr(11, 8)

  isSettingThumb.value = true
  try {
    await createVideoThumb(time, props.media.path, imgPath, 320, true)
    itemsStore.refreshThumb(props.media.id)
    eventBus.emit('getItemsFromDb', {ids: [props.media.id], type: 'media'})
    setNotification({
      title: t('player.video_thumb_updated'),
      text: props.media.path,
      icon: 'image',
      type: 'success',
    })
  } catch (e) {
    console.log(e)
    setNotification({
      title: t('player.video_thumb_not_updated'),
      text: String(e),
      icon: 'image',
      type: 'error',
    })
  } finally {
    isSettingThumb.value = false
  }
}

const handlePreviewContextMenu = (e) => {
  if (!bigPreview.value || !props.isFileExists || playbackError.value) return

  e.preventDefault()
  e.stopPropagation()

  bigPreviewMenuActive.value = true
  pausePreviewForMenu()

  contextMenuStore.showContextMenu({
    x: e.clientX,
    y: e.clientY,
    content: [
      {
        name: muted.value ? t('media.preview.unmute') : t('media.preview.mute'),
        type: 'item',
        icon: muted.value ? 'volume-off' : 'volume-high',
        action: () => {
          menuClosedByAction.value = true
          togglePreviewMute()
        },
      },
      {type: 'divider'},
      {
        name: t('player.controls.set_frame_as_thumb'),
        type: 'item',
        icon: 'image',
        disabled: isSettingThumb.value,
        action: () => {
          menuClosedByAction.value = true
          setAsThumbFromPreview()
        },
      },
    ],
  })
}

const play = (inApp) => {
  stopPlayingPreview({force: true})
  itemsStore.playVideo({
    video: props.media,
  })
}

const handleVideoError = () => {
  playbackError.value = true
  // Очищаем источник видео
  if (videoRef.value) {
    videoRef.value.src = ''
  }
}

const restartImageGeneration = () => {
  eventBus.emit('getItemsFromDb', {ids: [props.media.id], type: 'media'})
}

const handleVideoLoaded = () => {
  // Видео успешно загружено
  playbackError.value = false
}

const changePreviewTime = _.debounce((e) => {
  if (!props.isFileExists || playbackError.value) return
  if (SETTINGS.value.videoPreviewHover !== "video") return

  const rect = e.target.getBoundingClientRect()
  const percent = rect.width / 100
  const x = e.clientX - rect.left
  let progressValue = x / percent

  if (progressValue < 0) {
    progressValue = 0
  } else if (progressValue > 100) {
    progressValue = 100
  }

  progressValue = Math.floor(props.media.duration / 100 * progressValue)
  if (progress.value !== progressValue) {
    progress.value = progressValue
    if (videoRef.value && !isNaN(videoRef.value.duration)) {
      try {
        videoRef.value.currentTime = Math.min(progress.value, videoRef.value.duration)
      } catch (error) {
        console.error("Error setting currentTime:", error)
      }
    }
  }
}, 50)

const checkVideoFormat = async () => {
  try {
    // Проверяем MIME тип или расширение файла
    const videoExtension = props.media.path.split('.').pop().toLowerCase()
    const supportedFormats = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']

    if (!supportedFormats.includes(videoExtension)) {
      playbackError.value = true
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking video format:", error)
    return false
  }
}

const handleMouseEnter = () => {
  if (!props.isFileExists || playbackError.value || isProcessingHover.value) return

  isProcessingHover.value = true

  // Используем nextTick чтобы гарантировать обновление DOM
  nextTick(() => {
    if (!isHovered.value) {
      isHovered.value = true
      playbackError.value = false

      if (SETTINGS.value.videoPreviewHover !== "video") {
        isProcessingHover.value = false
        return
      }

      if (SETTINGS.value.big_video_preview === "1") {
        const totalDelay = (Number(SETTINGS.value.delayVideoPreview) || 0) +
          (Number(SETTINGS.value.big_video_preview_delay) || 0)

        timeouts.cinema = setTimeout(() => {
          emit('update-big-preview', true)
          bigPreview.value = true
          bigPreviewAnimation.value = true
        }, Math.floor(totalDelay))
      }

      if (!bigPreview.value) {
        timeouts.z = setTimeout(() => {
          if (videoRef.value) {
            const videoSrc = store.localhost + "/api/video/" + props.media.id
            const video = videoRef.value

            // Сначала проверяем, не загружено ли уже видео
            if (video.src && video.src.includes(props.media.id)) {
              // Если видео уже загружено, просто воспроизводим
              video.play().catch(error => {
                console.error("Video playback error:", error)
                playbackError.value = true
              })
            } else {
              // Если видео не загружено, загружаем и воспроизводим
              video.src = videoSrc
              video.load()

              video.play().catch(error => {
                console.error("Video playback error:", error)
                playbackError.value = true
                video.src = ''
              })
            }
          }
          isProcessingHover.value = false
        }, 50) // Уменьшенная задержка
      } else {
        isProcessingHover.value = false
      }
    } else {
      isProcessingHover.value = false
    }
  })
}

const stopPlayingPreview = ({force = false} = {}) => {
  if (!props.isFileExists || isProcessingHover.value) return
  if (!force && shouldKeepBigPreviewOpen()) return

  bigPreviewMenuActive.value = false
  menuClosedByAction.value = false
  previewPausedForMenu.value = false

  // Сбрасываем состояние предпросмотра
  isHovered.value = false

  emit('update-big-preview', false)
  bigPreview.value = false
  playbackError.value = false

  // Очищаем все таймауты
  for (const timeout in timeouts) {
    clearTimeout(timeouts[timeout])
  }

  // Правильно очищаем видео элемент
  if (videoRef.value) {
    try {
      videoRef.value.pause()
      videoRef.value.currentTime = 0
      // НЕ очищаем src, чтобы можно было повторно использовать
      // videoRef.value.src = ''
      // videoRef.value.load()
    } catch (error) {
      console.error(error)
    }
  }
}

const handleMouseLeave = () => {
  // Сначала сбрасываем флаг обработки
  isProcessingHover.value = false
  // Затем останавливаем превью
  stopPlayingPreview()
}

const getFrameImg = async (progressValue) => {
  const imgPath = path.join(
    store.mediaPath,
    "videos/timelines",
    `${props.media.id}_${progressValue}.jpg`
  )
  frame.value = await getLocalImage(imgPath)
}

const scrollStory = (e) => {
  if (!storyRef.value || !storyWrapperRef.value) return

  const storyWidth = storyRef.value.clientWidth
  const wrapperWidth = storyWrapperRef.value.clientWidth
  if (wrapperWidth <= storyWidth) return

  const x = e.layerX
  const ratio = storyWidth / (wrapperWidth - storyWidth)
  const offset = Math.ceil(x / ratio)
  storyWrapperRef.value.style.left = "-" + offset + "px"
}

const stopScrollStory = () => {
  if (storyWrapperRef.value) {
    storyWrapperRef.value.style.left = "0"
  }
}

const initFrames = async () => {
  frames.value = []
  for (let i = 0; i < timelines.length; i++) {
    const progressValue = timelines[i]
    const imgPath = path.join(
      store.mediaPath,
      "videos/timelines",
      `${props.media.id}_${progressValue}.jpg`
    )
    let img = await getLocalImage(imgPath)
    if (i == 0 && img.includes("unavailable.png")) {
      frames.value = []
      for (let j of timelines) frames.value.push(thumb.value)
      break
    } else {
      frames.value.push(img)
    }
  }
}

// Наблюдатели
watch(() => contextMenuStore.show, (show) => {
  if (show || !bigPreviewMenuActive.value) return

  nextTick(() => {
    const closedByAction = menuClosedByAction.value
    bigPreviewMenuActive.value = false
    menuClosedByAction.value = false

    if (!closedByAction) {
      resumePreviewAfterMenu()
    }
  })
})

watch(() => props.isFileExists, (exists) => {
  if (exists && isThumbUnavailable(thumb.value)) {
    getImg()
  }
})

watch(() => itemsStore.thumbRefreshKeys[Number(props.media.id)], (version) => {
  if (version == null) return
  const shouldRegenerate = itemsStore.consumeThumbRegenerate(props.media.id)
  if (shouldRegenerate) {
    thumbCreateAttempted.value = false
  }
  getImg({bust: true, allowCreate: shouldRegenerate})
  if (isViewTimeline.value) {
    initFrames()
  }
})

watch(() => ITEMS.value.view, (value) => {
  if (value === '2' || value === 2) {
    initFrames()
  }
  getImg()
})

watch(() => bigPreview.value, (value) => {
  if (value) {
    toggleFullScreen()
  } else {
    shrink()
  }
})

watch(() => is_window_focused.value, (value) => {
  if (!value) {
    stopPlayingPreview()
  }
})

// Обработчики событий
const handleUpdateVideoFrames = (id) => {
  if (Number(props.media.id) === Number(id) && isViewTimeline.value) {
    initFrames()
  }
}

// init
onMounted(async () => {
  isMounted.value = true
  await getImg()

  if (!isMounted.value) return

  if (props.isFileExists) {
    await checkVideoFormat()
  }

  if (isViewTimeline.value) {
    await initFrames()
  }

  eventBus.on('updateVideoFrames', handleUpdateVideoFrames)
})

onBeforeUnmount(() => {
  isMounted.value = false
  stopPlayingPreview({force: true})
  eventBus.off('updateVideoFrames', handleUpdateVideoFrames)

  for (const timeout in timeouts) {
    clearTimeout(timeouts[timeout])
  }

  if (videoRef.value) {
    try {
      videoRef.value.src = ''
    } catch (error) {
      console.error(error)
    }
  }
})
</script>

<style>
.video-playback-error {
  opacity: 0;
  display: none;
}

.preview {
  position: relative;
}

.playback-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ff4444;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.big-preview-plug .v-card {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
</style>