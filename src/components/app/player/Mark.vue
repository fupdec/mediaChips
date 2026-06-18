<template>
  <div @click="jumpTo"
       @mouseover="playerStore.is_mark_hover = true"
       @mouseleave="playerStore.is_mark_hover = false"
       class="mark" :style="position"
  >
    <span class="breaker"></span>

    <div :style="`background:${color};` + timeline_width" class="timeline"></div>

    <div class="mark-icon">
      <v-icon :color="color">mdi-{{ icon }}</v-icon>
      <v-icon
        v-if="mark.type === 'meta'"
        :color="colorMetaIcon"
        class="meta-icon"
        size="14"
      >
        mdi-{{ mark.meta?.icon || 'tag' }}
      </v-icon>
    </div>

    <v-sheet class="tooltip text-caption text-center pa-0 elevation-6" outlined rounded>
      <v-img :src="thumb" :aspect-ratio="16 / 9" class="thumb" contain>
        <v-sheet v-if="mark.type !== 'favorite'" class="mark-name">
          <div class="name">
            <span v-if="mark.type === 'meta'" v-html="mark['tag.name'] || mark.tag?.name"/>
            <span v-else-if="mark.text" v-html="mark.text" :title="mark.text"/>
            <span v-else v-html="mark.name"/>
          </div>
        </v-sheet>

        <v-btn
          @click.stop="remove"
          class="delete"
          color="error"
          size="small"
          icon
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>

        <v-sheet class="time" v-html="time"/>
      </v-img>
    </v-sheet>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useEventBus} from '@/utils/eventBus'
import path from "path-browserify"

const props = defineProps({
  mark: {
    type: Object,
    required: true
  },
  controls_width: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['removeMark'])

// Stores
const appStore = useAppStore()
const playerStore = usePlayerStore()
const eventBus = useEventBus()

// Refs
const thumb = ref(null)

// Computed
const icon = computed(() => {
  let icon = "tooltip"
  if (props.mark.type == "favorite") icon = "heart"
  else if (props.mark.type == "bookmark") icon = "bookmark"
  return icon
})

const color = computed(() => {
  let color = "#ffffff"
  if (props.mark.type == "favorite") color = "#e91e63"
  else if (props.mark.type == "bookmark") color = "#f44336"
  else if (props.mark.type == "meta") color = props.mark["tag.color"] || props.mark.tag?.color || "#2196f3"
  return color
})

const colorMetaIcon = computed(() => {
  const isDark = $readable.checkColorForDarkText(color.value)
  return isDark ? "white" : "black"
})

const time = computed(() => {
  let time = $readable.getReadableDuration(props.mark.time)
  if (props.mark.end) {
    time += " – " + $readable.getReadableDuration(props.mark.end)
  }
  return time
})

const position = computed(() => {
  if (!playerStore.duration) return ''
  return `left: ${props.mark.time / playerStore.duration * 100}%;`
})

const timeline_width = computed(() => {
  if (!playerStore.duration || !props.controls_width) return ''

  let start = props.mark.time
  let end = props.mark.end || props.mark.time
  let width_percentage = (end - start) / playerStore.duration * 100
  return `width: ${props.controls_width / 100 * width_percentage}px;`
})

// Methods
const getImg = async () => {
  const imgPath = path.join(
    appStore.mediaPath,
    "videos/marks",
    `${props.mark.id}.jpg`
  )

  thumb.value = await $operable.getLocalImage(imgPath)
}

const jumpTo = () => {
  if (playerStore.player) {
    playerStore.player.currentTime = props.mark.time
  }
}

const remove = () => {
  emit("removeMark", props.mark)
}

// Event handler for updating mark image
const handleUpdateMarkImage = (id) => {
  if (props.mark.id === id) {
    getImg()
  }
}

// Lifecycle
onMounted(() => {
  eventBus.on('updateMarkImage', (event) => {
    handleUpdateMarkImage(event)
  })

  getImg()
})

onBeforeUnmount(() => {
  eventBus.off('updateMarkImage', handleUpdateMarkImage)
})
</script>