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
      muted
      preload="metadata"
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

<script setup lang="ts">
import {ref, computed, watch, onBeforeUnmount} from 'vue'
import {usePlayerStore} from '@/stores/player'
import {getReadableDuration} from '@/services/formatUtils'
import _ from 'lodash'

const SEEK_MIN_DELTA = 0.25

const playerStore = usePlayerStore()
const preview = ref<HTMLVideoElement | null>(null)

const aspectRatio = computed(() => {
  const item = playerStore.playlist[playerStore.nowPlaying] as { width?: number; height?: number } | undefined
  return (item?.width ?? 0) / (item?.height ?? 1) || 16 / 9
})

const shouldShowPreview = computed(() => {
  return playerStore.is_file_exists &&
    playerStore.progress_hover != null &&
    !playerStore.is_mark_hover &&
    !playerStore.usesLiveTranscode
})

const formattedTime = computed(() => {
  const hover = Number(playerStore.progress_hover ?? 0)
  let time = playerStore.duration / 100 * hover
  if (hover < 0) {
    time = 0
  }
  return getReadableDuration(time)
})

const throttledSeek = _.throttle((time: number) => {
  const video = preview.value
  if (!video || !Number.isFinite(time)) return
  if (Math.abs(video.currentTime - time) < SEEK_MIN_DELTA) return

  video.pause()
  video.currentTime = time
}, 80, {leading: true, trailing: true})

function updatePreviewFrame() {
  if (playerStore.progress_hover == null) return

  const time = playerStore.duration / 100 * Number(playerStore.progress_hover)
  throttledSeek(time)
}

watch(() => playerStore.progress_hover, updatePreviewFrame)

onBeforeUnmount(() => {
  throttledSeek.cancel()
})
</script>
