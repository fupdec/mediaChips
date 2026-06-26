<template>
  <div class="item" :class="{ 'item--plain-card': plainCard }">
    <v-card
      class="item-mark"
      :class="[{ 'no-file': !is_file_exists }]"
      :elevation="plainCard ? 2 : undefined"
    >
      <v-responsive
        @mouseover.capture="playPreview"
        @click="stopPlayingPreview"
        @mouseleave="stopPlayingPreview"
        @blur="stopPlayingPreview"
        v-ripple="{ class: 'primary--text' }"
        :aspect-ratio="16 / 9"
        class="video-preview-container"
      >
        <v-img
          @click="play"
          :src="thumb"
          :aspect-ratio="16 / 9"
          :key="`thumb_${mark.id}`"
          class="thumb"
          contain
        ></v-img>

        <v-sheet class="time"
          light
          v-html="time"/>

        <div
          v-if="is_file_exists && is_hovered"
          @click="play"
          :style="`animation-delay: ${SETTINGS.delayVideoPreview}ms`"
          class="preview"
        >
          <video
            ref="video"
            autoplay
            :muted="muted"
            @error="playback_error = true"
            :class="{'video-playback-error': playback_error}"
            loop
          />
          <div v-if="playback_error"
            class="playback-error">
            {{ t('player.video_format_not_supported') }}
          </div>
        </div>
      </v-responsive>

      <v-card-subtitle
        style="overflow:hidden; white-space:nowrap; text-overflow: ellipsis;"
        :title="mark.medium?.name || mark.medium?.basename || ''"
        class="mt-4"
      >{{ mark.medium?.name || mark.medium?.basename || t('common.unknown') }}
      </v-card-subtitle>
      <v-card-text>
        <v-chip v-if="mark.type === 'meta'"
          :color="mark.tag?.color || 'primary'"
          size="small">
          <v-icon start
            size="small">mdi-{{ mark.tag?.meta?.icon || 'tag' }}
          </v-icon>
          <span>{{ mark.tag?.name || t('common.unknown') }}</span>
        </v-chip>
        <v-chip v-else-if="mark.type === 'favorite'"
          size="small">
          <v-icon color="pink"
            start
            size="small">mdi-heart
          </v-icon>
          <span>{{ t('meta.default_names.favorite') }}</span>
        </v-chip>
        <v-chip v-else-if="mark.type === 'bookmark'"
          :title="mark.text"
          size="small">
          <v-icon color="red"
            start
            size="small">mdi-bookmark
          </v-icon>
          <span>{{ t('meta.default_names.bookmark') }}</span>
        </v-chip>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted, watch} from 'vue'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useItemsStore} from '@/stores/items'
import {useI18n} from 'vue-i18n'
import {useEventBus} from '@/utils/eventBus'
import path from 'path-browserify'

const props = defineProps({
  mark: {
    type: Object,
    required: true
  },
  plainCard: {
    type: Boolean,
    default: false,
  },
})

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const itemsStore = useItemsStore()
const {t} = useI18n()
const eventBus = useEventBus()

// Refs
const video = ref(null)
const thumb = ref(null)
const is_hovered = ref(false)
const is_file_exists = ref(false)
const playback_error = ref(false)
const previewTimeout = ref(null)
const videoLoadTimeout = ref(null)
const isVideoPlaying = ref(false)

// Computed
const apiUrl = computed(() => appStore.localhost)
const SETTINGS = computed(() => settingsStore)
const muted = computed(() => SETTINGS.value.play_sound_on_video_preview !== "1")

const time = computed(() => {
  const startTime = $readable.getReadableDuration(props.mark.time)
  if (props.mark.end) {
    return startTime + " – " + $readable.getReadableDuration(props.mark.end)
  }
  return startTime
})

// Метод для безопасного воспроизведения видео
const safePlayVideo = () => {
  if (!video.value || !is_hovered.value || playback_error.value) return

  try {
    video.value.play().then(() => {
      isVideoPlaying.value = true
    }).catch(e => {
      console.error('Error playing video:', e)
      playback_error.value = true
      isVideoPlaying.value = false
    })
  } catch (e) {
    console.error('Exception in safePlayVideo:', e)
    playback_error.value = true
    isVideoPlaying.value = false
  }
}

// Метод для безопасной остановки видео
const safeStopVideo = () => {
  if (video.value) {
    try {
      video.value.pause()
      isVideoPlaying.value = false

      // Сбрасываем обработчики событий
      video.value.oncanplay = null
      video.value.onerror = null
      video.value.ontimeupdate = null
    } catch (e) {
      console.error('Error stopping video:', e)
    }
  }
}

// Watch для отслеживания изменения is_hovered
watch(is_hovered, (newVal) => {
  if (!newVal) {
    safeStopVideo()
  }
})

// Methods
const getImg = async () => {
  try {
    const image_path_mark = path.join(
      appStore.mediaPath,
      'videos/marks',
      `${props.mark.id}.jpg`
    )

    let thumbImg = await $operable.getLocalImage(image_path_mark)

    if (thumbImg && thumbImg.includes("unavailable.png")) {
      const image_path_thumb = path.join(
        appStore.mediaPath,
        'videos/thumbs',
        `${props.mark.medium?.id || props.mark.mediumId}.jpg`
      )
      thumb.value = await $operable.getLocalImage(image_path_thumb)
    } else {
      thumb.value = thumbImg
    }
  } catch (e) {
    console.log('Error loading image:', e)
  }
}

const checkFileExists = async () => {
  is_file_exists.value = await $operable.checkFileExists(props.mark.medium.path)
}

const playPreview = () => {
  if (!is_file_exists.value || is_hovered.value) return

  is_hovered.value = true

  // Очищаем предыдущий таймаут
  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value)
    previewTimeout.value = null
  }

  previewTimeout.value = setTimeout(() => {
    if (!video.value || !is_hovered.value) return

    try {
      // Сбрасываем ошибку воспроизведения
      playback_error.value = false

      const timeParam = props.mark.end
        ? `#t=${props.mark.time},${props.mark.end}`
        : `#t=${props.mark.time}`

      const videoSrc = apiUrl.value + "/api/video/" + props.mark.medium?.id + timeParam

      // Если источник уже установлен и видео то же самое
      if (video.value.src && video.value.src.includes(props.mark.medium?.id)) {
        video.value.currentTime = props.mark.time
        safePlayVideo()
      } else {
        // Устанавливаем новый источник
        safeStopVideo()

        video.value.src = videoSrc
        video.value.currentTime = props.mark.time

        // Очищаем предыдущий таймаут загрузки
        if (videoLoadTimeout.value) {
          clearTimeout(videoLoadTimeout.value)
        }

        // Устанавливаем обработчик canplay с проверкой
        video.value.oncanplay = () => {
          if (video.value && is_hovered.value && !playback_error.value) {
            safePlayVideo()
          }
        }

        // Обработчик ошибок
        video.value.onerror = (e) => {
          console.error('Video error:', e)
          playback_error.value = true
          isVideoPlaying.value = false
        }

        // Обработчик для зацикливания в рамках временного отрезка
        if (props.mark.end) {
          video.value.ontimeupdate = () => {
            if (video.value && props.mark.end && video.value.currentTime > props.mark.end) {
              video.value.currentTime = props.mark.time
            }
          }
        }

        // Таймаут для загрузки видео
        videoLoadTimeout.value = setTimeout(() => {
          if (video.value && video.value.readyState < 2 && is_hovered.value) {
            video.value.load()
          }
        }, 100)
      }
    } catch (e) {
      console.error('Error in playPreview:', e)
      playback_error.value = true
      isVideoPlaying.value = false
    }
  }, SETTINGS.value.delayVideoPreview || 0)
}

const stopPlayingPreview = () => {
  is_hovered.value = false

  // Очищаем таймауты
  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value)
    previewTimeout.value = null
  }

  if (videoLoadTimeout.value) {
    clearTimeout(videoLoadTimeout.value)
    videoLoadTimeout.value = null
  }

  safeStopVideo()
}

const play = () => {
  const videoItem = props.mark.medium
  itemsStore.playVideo({
    video: videoItem,
    videos: [videoItem],
    time: props.mark.time,
  })
  stopPlayingPreview()
}

// Lifecycle
const handleUpdateMarkImage = (id) => {
  if (props.mark.id === id) {
    getImg()
  }
}

onMounted(() => {
  eventBus.on('updateMarkImage', handleUpdateMarkImage)
  getImg()
  checkFileExists()
})

onUnmounted(() => {
  eventBus.off('updateMarkImage', handleUpdateMarkImage)
  stopPlayingPreview()

  // Полная очистка при размонтировании
  if (video.value) {
    video.value.src = ''
    video.value.oncanplay = null
    video.value.onerror = null
    video.value.ontimeupdate = null
  }
})
</script>

<style lang="scss">
.item-mark {
  .video-preview-container {
    cursor: pointer;
  }
  &.no-file {
    .thumb {
      filter: saturate(0.1) opacity(50%);
    }
  }
  .preview {
    top: 0;
    left: 0;
  }
  .time {
    pointer-events: none;
    position: absolute;
    bottom: 5px;
    right: 5px;
    background: rgb(255 255 255 / 80%);
    padding: 0 7px;
    border-radius: 15px;
    font-size: 14px;
    z-index: 1;
  }
}
</style>