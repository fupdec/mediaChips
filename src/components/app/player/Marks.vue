<template>
  <v-card
    v-if="player.marksVisible"
    :class="{pinned:pinned}"
    class="marks-window player-window"
    elevation="20"
    outlined
    rounded="lg"
  >
    <div class="player-window_title-bar py-0">
      <v-icon size="small" start>mdi-tooltip</v-icon>
      <span class="player-window_title">{{ t('player.marks_count', {count: marks.length}) }}</span>
      <v-spacer></v-spacer>
      <v-btn @click="pinned = !pinned" size="small" variant="text" icon>
        <v-icon v-if="pinned" size="small">mdi-pin</v-icon>
        <v-icon v-else size="small">mdi-pin-outline</v-icon>
      </v-btn>
      <v-btn @click="player.marksVisible = false" variant="text" tile icon>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-divider></v-divider>

    <v-chip-group v-model="marksType" color="primary" class="mx-2" column multiple>
      <v-chip value="favorite" size="small">
        <v-icon icon="mdi-heart" size="small" start/>
        {{ t('meta.default_names.favorite') }}
      </v-chip>
      <v-chip value="bookmark" size="small">
        <v-icon icon="mdi-bookmark" size="small" start/>
        {{ t('meta.default_names.bookmark') }}
      </v-chip>
      <v-chip
        v-for="i in assigned"
        :key="i.meta.id"
        :value="i.meta.id"
        size="small"
        :prepend-icon="`mdi-${i.meta.icon}`"
        :text="i.meta.name"
      ></v-chip>
    </v-chip-group>

    <div class="items">
      <div v-for="mark in marks" :key="mark.id" class="mark">
        <v-img
          v-if="is_thumbs_loaded"
          @click="jumpTo(mark.time)"
          :src="mark.thumb"
          :aspect-ratio="16 / 9"
          class="thumb"
          contain
        >
          <span class="time">
            <span>{{ getDuration(mark.time) }}</span>
            <span v-if="mark.end"> – {{ getDuration(mark.end) }}</span>
          </span>
          <div class="name">
            <v-icon
              :color="getColor(mark)"
              class="mr-1"
              size="small"
            >mdi-{{getIcon(mark)}}</v-icon>
            <span v-if="mark.type == 'meta'" v-html="mark['tag.name'] || mark.tag?.name"/>
            <span v-else-if="mark.text" v-html="mark.text" :title="mark.text"/>
            <span v-else v-html="mark.name"/>
          </div>
          <v-btn
            @click.stop="remove(mark)"
            class="delete"
            color="error"
            size="small"
            icon
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-img>
      </div>
      <div v-if="player.marks.length == 0" class="text-center py-6">
        <v-img src="/images/no-marks.svg" max-height="100px" class="my-4" contain></v-img>
        <span class="text-medium-emphasis text-caption">{{ t('player.no_marks') }}</span>
      </div>
      <div v-else-if="player.marks.length && marks.length == 0" class="text-center py-6">
        <v-img src="/images/filters/filters-no-results-marks.svg" max-height="100px" class="my-4" contain></v-img>
        <span class="text-medium-emphasis text-caption">{{ t('player.no_marks_selected_types') }}</span>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {useI18n} from 'vue-i18n'
import path from 'path-browserify'

const emit = defineEmits(['removeMark'])

// Stores
const appStore = useAppStore()
const playerStore = usePlayerStore()
const itemsStore = useItemsStore()
const eventBus = useEventBus()
const {t} = useI18n()

// Refs
const marksType = ref(["favorite", "bookmark"])
const is_thumbs_loaded = ref(false)
const pinned = ref(true)

// Computed
const player = computed(() => playerStore)
const assigned = computed(() => {
  return itemsStore.assigned.filter((i) => i.meta?.marks)
})

const marks = computed(() => {
  return playerStore.marks.filter((mark) => {
    let type = mark.type
    if (type == "meta") type = mark.meta?.id || mark.metaId
    return marksType.value.includes(type)
  })
})

// Methods
const getThumbs = async () => {
  is_thumbs_loaded.value = false

  for (let i of playerStore.marks) {
    const imgPath = path.join(
      appStore.mediaPath,
      "videos/marks",
      `${i.id}.jpg`
    )

    i.thumb = await $operable.getLocalImage(imgPath)
  }

  is_thumbs_loaded.value = true
}

const getIcon = (mark) => {
  let icon = "marker"
  if (mark.type == "favorite") icon = "heart"
  else if (mark.type == "bookmark") icon = "bookmark"
  else if (mark.type == "meta") icon = mark.meta?.icon || mark["tag.icon"] || "tag"
  return icon
}

const getColor = (mark) => {
  let color = "primary"
  if (mark.type == "favorite") color = "#e91e63"
  else if (mark.type == "bookmark") color = "#f44336"
  else if (mark.type == "meta") color = mark["tag.color"] || mark.tag?.color || "#2196f3"
  return color
}

const getDuration = (duration) => {
  return $readable.getReadableDuration(duration)
}

const jumpTo = (time) => {
  if (player.value.player) {
    player.value.player.currentTime = time
  }
}

const remove = (mark) => {
  emit("removeMark", mark)
}

// Event handler for updating mark image
const handleUpdateMarkImage = (id) => {
  if (player.value.marks.some((i) => i.id === id)) {
    getThumbs()
  }
}

// Watchers
watch(() => playerStore.marks, () => {
  getThumbs()
})

watch(assigned, (arr) => {
  arr.forEach((i) => {
    if (!marksType.value.includes(i.meta.id)) {
      marksType.value.push(i.meta.id)
    }
  })
})

// Lifecycle
onMounted(() => {
  eventBus.on('updateMarkImage', (event) => {
    handleUpdateMarkImage(event.detail)
  })

  // Initial load
  getThumbs()
})

onBeforeUnmount(() => {
  eventBus.off('updateMarkImage', handleUpdateMarkImage)
})
</script>