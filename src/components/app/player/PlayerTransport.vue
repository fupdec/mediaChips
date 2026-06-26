<template>
  <v-card-actions class="buttons pb-4 px-0 pt-0">
    <PlayerTransportPlayback/>
    <v-spacer/>
    <PlayerTransportMarks/>
    <PlayerTransportMedia/>
    <v-spacer/>
    <PlayerTransportView/>
  </v-card-actions>
</template>

<script setup>
import {provide} from 'vue'
import {usePlayerTransport} from '@/composable/usePlayerTransport'
import {PLAYER_TRANSPORT_KEY} from '@/composable/playerTransportKey'
import PlayerTransportPlayback from '@/components/app/player/PlayerTransportPlayback.vue'
import PlayerTransportMarks from '@/components/app/player/PlayerTransportMarks.vue'
import PlayerTransportMedia from '@/components/app/player/PlayerTransportMedia.vue'
import PlayerTransportView from '@/components/app/player/PlayerTransportView.vue'

const props = defineProps({
  jumpToMark: {
    type: Function,
    required: true,
  },
})

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

const jumpToMark = (type) => props.jumpToMark(type)

const transport = usePlayerTransport({
  emit,
  jumpToMark,
})

provide(PLAYER_TRANSPORT_KEY, {
  ...transport,
  emit,
})

defineExpose({
  togglePause: transport.togglePause,
  play: transport.play,
  pause: transport.pause,
  stop: transport.stop,
  prev: transport.prev,
  next: transport.next,
  toggleMute: transport.toggleMute,
  togglePlaylist: transport.togglePlaylist,
  toggleMarks: transport.toggleMarks,
  jumpToMark,
  editVideo: transport.editVideo,
  deleteVideo: transport.deleteVideo,
})
</script>
