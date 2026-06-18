<template>
  <v-sheet
    v-show="shouldShowPreview"
    :style="{
      left: `clamp(
        calc(15vh * ${aspectRatio} / 2 + 10px),
        ${playerStore.progress_hover}%,
        calc(100% - 15vh * ${aspectRatio} / 2 - 10px)
      )`,
      transform: 'translateX(-50%)',
      'aspect-ratio': aspectRatio
    }"
    class="preview text-center"
    theme="dark"
    variant="outlined"
    rounded="lg"
    elevation="10"
  >
    <video
      :src="playerStore.player?.src"
      ref="preview"
      id="player_preview"
      muted
    ></video>
    <div class="time">
      <v-chip
        color="black"
        density="compact"
        size="small"
        theme="dark"
        variant="flat">{{ formattedTime }}
      </v-chip>
    </div>
  </v-sheet>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted} from 'vue'
import {usePlayerStore} from '@/stores/player'
import _ from 'lodash'

const playerStore = usePlayerStore()

const preview = ref(null)
const seeked = ref(false)

const aspectRatio = computed(() => {
  const item = playerStore.playlist[playerStore.nowPlaying]
  return item?.width / item?.height || 16 / 9
})

const shouldShowPreview = computed(() => {
  return playerStore.is_file_exists &&
    playerStore.progress_hover &&
    !playerStore.is_mark_hover
})

const formattedTime = computed(() => {
  let time = playerStore.duration / 100 * playerStore.progress_hover
  if (playerStore.progress_hover < 0) {
    time = 0
  }
  return $readable.getReadableDuration(time)
})

// Methods
async function getImg() {
  if (!preview.value) return

  seeked.value = false
  const time = playerStore.duration / 100 * playerStore.progress_hover

  // Используем debounce для установки currentTime
  debouncedSetCurrentTime(time)

  preview.value.playbackRate = 0

  try {
    await preview.value.play()
  } catch (error) {
    console.error('Error playing preview:', error)
  }
}

// Debounced функция для установки currentTime
const debouncedSetCurrentTime = _.debounce((time) => {
  if (preview.value) {
    preview.value.currentTime = time
  }
}, 200)

// Lifecycle hooks
onMounted(() => {
  const previewElement = document.getElementById('player_preview')
  if (previewElement) {
    previewElement.addEventListener('seeked', () => {
      seeked.value = true
    })
  }
})

// Watchers
watch(() => playerStore.progress_hover, () => {
  getImg()
})
</script>