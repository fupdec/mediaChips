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
  >
    <template v-slot:thumb-label="{ modelValue }">
      {{ $readable.getReadableDuration(modelValue) }}
    </template>
  </v-range-slider>
</template>

<script setup>
import {computed} from 'vue'
import {usePlayerStore} from '@/stores/player'
import {useDialogsStore} from '@/stores/dialogs'

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
</script>