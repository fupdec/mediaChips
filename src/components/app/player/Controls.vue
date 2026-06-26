<template>
  <v-card
    @mouseenter="player.mouseOverControls = true"
    @mouseleave="player.mouseOverControls = false"
    :class="{hidden: !player.isControlsVisible}"
    class="controls px-6"
    theme="dark"
  >
    <PlayerTimeline
      ref="timelineRef"
      :is-audio-mode="isAudioMode"
      @showControls="emit('showControls')"
      @removeMark="emit('removeMark', $event)"
    />

    <PlayerTransport
      ref="transportRef"
      :jump-to-mark="jumpToMark"
      @toggleFullscreen="emit('toggleFullscreen')"
      @togglePictureInPicture="emit('togglePictureInPicture')"
      @play="emit('play', $event)"
      @changeVolume="emit('changeVolume', $event)"
      @showControls="emit('showControls')"
      @addMark="emit('addMark')"
      @removeMark="emit('removeMark', $event)"
      @close="emit('close')"
      @updateVideo="emit('updateVideo', $event)"
    />
  </v-card>
</template>

<script setup>
import {computed, ref} from 'vue'
import {usePlayerStore} from '@/stores/player'
import PlayerTimeline from '@/components/app/player/PlayerTimeline.vue'
import PlayerTransport from '@/components/app/player/PlayerTransport.vue'

const emit = defineEmits([
  'toggleFullscreen',
  'togglePictureInPicture',
  'play',
  'changeVolume',
  'showControls',
  'addMark',
  'removeMark',
  'close',
  'updateVideo',
])

const playerStore = usePlayerStore()
const player = computed(() => playerStore)
const isAudioMode = computed(() => playerStore.isAudioMode)

const timelineRef = ref(null)
const transportRef = ref(null)

const jumpToMark = (type) => {
  timelineRef.value?.jumpToMark?.(type)
}

defineExpose({
  togglePause: (...args) => transportRef.value?.togglePause?.(...args),
  play: (...args) => transportRef.value?.play?.(...args),
  pause: (...args) => transportRef.value?.pause?.(...args),
  stop: (...args) => transportRef.value?.stop?.(...args),
  prev: (...args) => transportRef.value?.prev?.(...args),
  next: (...args) => transportRef.value?.next?.(...args),
  toggleMute: (...args) => transportRef.value?.toggleMute?.(...args),
  togglePlaylist: (...args) => transportRef.value?.togglePlaylist?.(...args),
  toggleMarks: (...args) => transportRef.value?.toggleMarks?.(...args),
  jumpToMark,
  wheelSeek: (...args) => timelineRef.value?.wheelSeek?.(...args),
  editVideo: (...args) => transportRef.value?.editVideo?.(...args),
  deleteVideo: (...args) => transportRef.value?.deleteVideo?.(...args),
  resize: (...args) => timelineRef.value?.resize?.(...args),
})
</script>
