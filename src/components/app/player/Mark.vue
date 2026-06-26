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
import {usePlayerMark} from '@/composable/usePlayerMark'

const props = defineProps({
  mark: {
    type: Object,
    required: true,
  },
  controls_width: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['removeMark'])

const {
  playerStore,
  thumb,
  icon,
  color,
  colorMetaIcon,
  time,
  position,
  timeline_width,
  jumpTo,
  remove,
} = usePlayerMark(props, emit)
</script>
