<template>
  <div :class="{ 'no-file': !isFileExists }">
    <!-- CARD VIEW -->
    <v-responsive
      v-if="isViewCard"
      ref="previewRef"
      v-ripple="bigPreview ? false : { class: `text-primary` }"
      :aspect-ratio="16 / 9"
      class="video-preview-container"
      @blur="stopPlayingPreview"
      @click="stopPlayingPreview"
      @mouseleave="handleMouseLeave"
      @mousemove="changePreviewTime"
      @mouseenter="handleMouseEnter"
    >
      <v-img
        :key="thumbVersion"
        :aspect-ratio="16 / 9"
        :src="thumb"
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

      <v-btn
        v-if="bigPreview && !playbackError"
        @click.stop="togglePreviewMute"
        class="preview-mute-btn"
        :title="muted ? t('media.preview.unmute') : t('media.preview.mute')"
        icon
        variant="text"
        color="white"
        size="small"
      >
        <v-icon>{{ muted ? 'mdi-volume-off' : 'mdi-volume-high' }}</v-icon>
      </v-btn>

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
import {useEventBus} from '@/utils/eventBus'
import _ from 'lodash'
import axios from "axios";

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
const thumbVersion = ref(0)
const frame = ref(null)
const frames = ref([])
const progress = ref(0)

const timelines = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
const timeouts = {}
const bigPreview = ref(false)
const bigPreviewAnimation = ref(false)
const playbackError = ref(false)
const isProcessingHover = ref(false) // Новый флаг для отслеживания обработки наведения

// computed
const ITEMS = computed(() => itemsStore)
const SETTINGS = computed(() => settingsStore)

const muted = computed(() => SETTINGS.value.play_sound_on_video_preview !== '1')

const quality = computed(() =>
  $readable.getReadableVideoQuality(props.media.width, props.media.height)
)

const isTaskRunning = computed(() =>
  tasksStore.list.find(task => task.title === 'Generating timeline images')
)

const height = computed(() =>
  $readable.getReadableVideoHeight(props.media.width, props.media.height)
)

const duration = computed(() =>
  $readable.getReadableDuration(props.media.duration)
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
const getImg = async () => {
  const previousThumb = thumb.value

  const getThumb = async (videos_folder) => {
    let imgPath = path.join(
      store.mediaPath,
      videos_folder,
      props.media.id + ".jpg"
    )
    thumb.value = await $operable.getLocalImage(imgPath)
    thumbVersion.value += 1
    return imgPath
  }

  const is_grid = settingsStore.videoPreviewStatic === "grid"

  if (is_grid && isViewCard.value) {
    await getThumb("videos/grids")
    if (thumb.value.includes("unavailable.png")) {
      await getThumb("videos/thumbs")
    }
  } else {
    let imgPath = await getThumb("videos/thumbs")
    if (props.isFileExists && thumb.value.includes("unavailable.png")) {
      await createThumb(imgPath)
    }
  }

  if (previousThumb?.startsWith?.('blob:')) {
    URL.revokeObjectURL(previousThumb)
  }
}

const createThumb = async (imgPath) => {
  await axios({
    method: "post",
    url: `${store.localhost}/api/task/createThumbForVideo`,
    data: {
      path: props.media.path,
      id: props.media.id,
    },
  })
    .then(async (res) => {
      thumb.value = await $operable.getLocalImage(imgPath)
    })
    .catch((e) => {
      console.log(e)
    });
}

const togglePreviewMute = () => {
  const nextValue = SETTINGS.value.play_sound_on_video_preview === '1' ? '0' : '1'
  $operable.setOption(nextValue, 'play_sound_on_video_preview')
}

const play = (inApp) => {
  stopPlayingPreview()
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
  eventBus.emit('getItemsFromDb', {ids: [], type: 'media'})
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

const stopPlayingPreview = () => {
  if (!props.isFileExists || isProcessingHover.value) return

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
  frame.value = await $operable.getLocalImage(imgPath)
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
    let img = await $operable.getLocalImage(imgPath)
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
watch(() => itemsStore.thumbRefreshKeys[Number(props.media.id)], (version) => {
  if (version == null) return
  getImg()
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
  await getImg()

  if (props.isFileExists) {
    await checkVideoFormat()
  }

  if (isViewTimeline.value) {
    await initFrames()
  }

  eventBus.on('updateVideoFrames', handleUpdateVideoFrames)
})

onBeforeUnmount(() => {
  stopPlayingPreview()
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