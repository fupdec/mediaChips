<template>
  <v-range-slider
    v-model="markTimeRange"
    :max="playerStore.duration"
    :class="{'hide-end-time': !marks.is_end_time_active}"
    class="mark-time-range"
    :color="marks.color"
    hide-details
    min="0"
    step="1"
    thumb-label="always"
    track-size="1"
    thumb-size="10"
    @wheel.prevent.stop="onMarkRangeWheel"
  >
    <template v-slot:thumb-label="{ modelValue }">
      {{ getReadableDuration(modelValue) }}
    </template>
  </v-range-slider>
</template>

<script setup>
import {computed} from 'vue'
import {usePlayerStore} from '@/stores/player'
import {useDialogsStore} from '@/stores/dialogs'
import {getReadableDuration} from '@/services/formatUtils'
import {getMarkRangeDeltaFromWheel, preventWheelDefault} from '@/utils/playerWheel'

const dialogsStore = useDialogsStore()
const playerStore = usePlayerStore()

const marks = computed(() => dialogsStore.markAdding)

const markTimeRange = computed({
  get: () => [marks.value.time || 0, marks.value.end || 0],
  set: (newValue) => {
    if (newValue && newValue.length === 2) {
      marks.value.time = newValue[0]
      marks.value.end = newValue[1]
    }
  }
})

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const onMarkRangeWheel = (event) => {
  preventWheelDefault(event)

  const delta = getMarkRangeDeltaFromWheel(event)
  if (!delta) return

  if (event.shiftKey) {
    marks.value.end = clamp(
      (marks.value.end || 0) + delta,
      marks.value.time || 0,
      playerStore.duration,
    )
    return
  }

  const nextTime = clamp(
    (marks.value.time || 0) + delta,
    0,
    marks.value.end || playerStore.duration,
  )
  marks.value.time = nextTime
}
</script>