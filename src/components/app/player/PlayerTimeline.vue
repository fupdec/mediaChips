<template>
  <v-card-actions
    @wheel.prevent="wheelSeek"
    @mousemove="saveEvent($event); showPreview($event)"
    @mouseleave="clearPreviewHover"
    class="timeline pa-0"
    ref="slider_progress"
  >
    <v-slider
      :model-value="player.seeking ? player.seekTime : player.currentTime"
      @update:model-value="handleSliderChange"
      @start="startSeeking"
      @end="seek"
      @mousedown="handleMouseSeek($event)"
      @wheel.prevent.stop="wheelSeek"
      :disabled="!player.is_file_exists || player.playbackError"
      :track-size="2"
      class="timeline-slider pt-4"
      color="white"
      step="0.05"
      min="0"
      :max="player.duration"
      hide-details
    />

    <controls-set-mark-time v-if="dialogsStore.markAdding.show"/>

    <Preview v-if="!isAudioMode"/>

    <Mark
      v-for="mark in player.marks"
      @removeMark="onRemoveMark"
      :key="mark.id"
      :mark="mark"
      :controls_width="controls_width"
    />
  </v-card-actions>
</template>

<script setup>
import {useDialogsStore} from '@/stores/dialogs'
import Preview from '@/components/app/player/Preview.vue'
import Mark from '@/components/app/player/Mark.vue'
import ControlsSetMarkTime from '@/components/app/player/ControlsSetMarkTime.vue'
import {usePlayerTimeline} from '@/composable/usePlayerTimeline'

defineProps({
  isAudioMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['showControls', 'removeMark'])

const dialogsStore = useDialogsStore()

const {
  player,
  slider_progress,
  controls_width,
  startSeeking,
  seek,
  handleSliderChange,
  wheelSeek,
  handleMouseSeek,
  saveEvent,
  showPreview,
  clearPreviewHover,
  jumpToMark,
  resize,
} = usePlayerTimeline({emit})

const onRemoveMark = (mark) => {
  emit('removeMark', mark)
}

defineExpose({
  jumpToMark,
  wheelSeek,
  resize,
})
</script>
