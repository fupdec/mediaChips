<template>
  <v-card
    v-show="playerStore.playlistVisible"
    :class="{pinned:pinned}"
    class="playlist-window player-window"
    elevation="20"
    outlined
    rounded="lg"
  >
    <div class="player-window_title-bar py-0">
      <v-icon size="small" start>mdi-format-list-bulleted</v-icon>
      <span v-text="title" :title="title" class="player-window_title"></span>
      <v-spacer></v-spacer>
      <v-btn @click="pinned = !pinned" size="small" variant="text" icon>
        <v-icon v-if="pinned" size="small">mdi-pin</v-icon>
        <v-icon v-else size="small">mdi-pin-outline</v-icon>
      </v-btn>
      <v-btn @click="player.playlistVisible = false" variant="text" tile icon>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-btn-toggle
      v-model="player.playlistMode"
      color="primary"
      class="toggle"
      multiple
      dense
      tile
    >
      <v-btn value="loop" :title="t('player.playlist_modes.loop')" small>
        <v-icon small>mdi-sync</v-icon>
      </v-btn>
      <v-btn value="autoplay" :title="t('player.playlist_modes.autoplay')" small>
        <v-icon small>mdi-play-pause</v-icon>
      </v-btn>
      <v-btn value="shuffle" :title="t('player.playlist_modes.shuffle')" small>
        <v-icon small>mdi-shuffle-variant</v-icon>
      </v-btn>
    </v-btn-toggle>

    <div class="items">
      <v-virtual-scroll
        :bench="5"
        :items="player.playlist"
        :item-height="item_height"
        height="calc(70vh - 80px)"
        id="scroller"
      >
        <template v-slot:default="{ item, index }">
          <PlaylistItem
            @play="play(index)"
            :video="item"
            :index="index"
            :key="item.id"
          ></PlaylistItem>
        </template>
      </v-virtual-scroll>
    </div>
  </v-card>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import {usePlayerStore} from '@/stores/player'
import {useEventBus} from '@/utils/eventBus'
import {useI18n} from 'vue-i18n'
import PlaylistItem from '@/components/app/player/PlaylistItem.vue'
import _ from 'lodash'

const emit = defineEmits(['play'])

// Stores
const playerStore = usePlayerStore()
const eventBus = useEventBus()
const {t} = useI18n()

// Refs
const item_height = ref(100)
const pinned = ref(true)

// Computed
const player = computed(() => playerStore)

const video = computed(() => {
  return player.value.playlist[player.value.nowPlaying]
})

const title = computed(() => {
  return t('player.playlist_count', {
    current: player.value.nowPlaying + 1,
    total: player.value.playlist.length
  })
})

// Methods
const play = (index) => {
  playerStore.paused = false
  let current = video.value

  if (player.value.playlistMode.includes("shuffle")) {
    let indexes = []
    for (let i = 0; i < player.value.playlist.length; i++) indexes.push(i)
    playerStore.playlistShuffle = _.shuffle(indexes)
    const i = playerStore.playlistShuffle.indexOf(index)
    playerStore.playlistShuffle.splice(i, 1)
    playerStore.playlistShuffle.unshift(index)
    emit("play", {n: player.value.playlist[index], o: current})
    if (player.value.playlistVisible) scrollToNowPlaying()
  } else {
    emit("play", {n: player.value.playlist[index], o: current})
  }
}

const scrollToNowPlaying = () => {
  setTimeout(() => {
    const scroller = document.getElementById("scroller")
    if (!scroller) return

    const height = scroller.scrollHeight / player.value.playlist.length * player.value.nowPlaying
    setTimeout(() => {
      scroller.scrollTo({
        top: height,
        left: 0,
      })
    })
  }, 0)
}

const calcItemHeight = () => {
  let height = window.innerWidth / 100 * 18 / (16 / 9)
  if (height > 180) height = 180
  item_height.value = height
}

// Event handler for scrollToNowPlaying
const handleScrollToNowPlaying = () => {
  scrollToNowPlaying()
}

// Watchers
watch(() => player.value.playlistMode, (mode, oldMode) => {
  if (!mode.includes("shuffle") && oldMode.includes("shuffle")) return

  let index = []
  let current = video.value
  for (let i = 0; i < player.value.playlist.length; i++) index.push(i)

  playerStore.playlistShuffle = _.shuffle(index)
  const nextIndex = playerStore.playlistShuffle[0]
  emit("play", {n: player.value.playlist[nextIndex], o: current})
  if (player.value.playlistVisible) scrollToNowPlaying()
}, {deep: true})

// Lifecycle
onMounted(() => {
  eventBus.on('scrollToNowPlaying', handleScrollToNowPlaying)
  window.addEventListener("resize", calcItemHeight)

  // Initial calculation
  calcItemHeight()
})

onBeforeUnmount(() => {
  eventBus.off('scrollToNowPlaying', handleScrollToNowPlaying)
  window.removeEventListener("resize", calcItemHeight)
})
</script>