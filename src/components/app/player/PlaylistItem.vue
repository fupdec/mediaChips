<template>
  <div
    @click="play"
    :class="{
      'playlist-item--active': is_now_playing,
      'playlist-item--missing': !is_file_exists,
      'playlist-item--locked': !reg && index > 14,
    }"
    class="playlist-item"
  >
    <div class="playlist-item__thumb-wrap">
      <v-img
        :key="video.id"
        :src="thumb"
        :aspect-ratio="16 / 9"
        :id="'video_'+video.id"
        class="playlist-item__thumb"
        cover
      />
      <div v-if="is_now_playing" class="playlist-item__playing">
        <v-icon size="small" color="white">mdi-equalizer</v-icon>
      </div>
      <div v-if="!reg && index > 14" class="playlist-item__lock">
        <v-icon size="x-small">mdi-lock</v-icon>
      </div>
    </div>

    <div class="playlist-item__info">
      <span class="playlist-item__index">{{ index + 1 }}</span>
      <div class="playlist-item__text">
        <span class="playlist-item__name" :title="video.name" v-text="video.name"/>
        <span v-if="video.duration" class="playlist-item__duration" v-text="getDuration(video.duration)"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useRegistrationStore} from '@/stores/registration'
import {useItemsStore} from '@/stores/items'
import path from 'path-browserify'

const props = defineProps({
  video: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['play'])

const appStore = useAppStore()
const playerStore = usePlayerStore()
const registrationStore = useRegistrationStore()
const itemsStore = useItemsStore()

const thumb = ref(null)
const is_file_exists = ref(true)

const player = computed(() => playerStore)
const reg = computed(() => registrationStore)

const is_now_playing = computed(() => {
  return player.value.nowPlaying === props.index
})

const getThumb = async () => {
  const imgPath = path.join(
    appStore.mediaPath,
    "videos/thumbs",
    `${props.video.id}.jpg`
  )

  thumb.value = await $operable.getLocalImage(imgPath)
}

const getDuration = (time) => {
  return $readable.getReadableDuration(time)
}

const checkFileExists = async () => {
  is_file_exists.value = await $operable.checkFileExists(props.video.path)
}

const play = () => {
  if (is_file_exists.value && !is_now_playing.value && (reg.value || props.index <= 14)) {
    emit("play", props.index)
  }
}

watch(() => itemsStore.thumbRefreshKeys[Number(props.video.id)], (version) => {
  if (version == null) return
  getThumb()
})

onMounted(() => {
  if (!thumb.value) {
    getThumb()
  }
  checkFileExists()
})
</script>
