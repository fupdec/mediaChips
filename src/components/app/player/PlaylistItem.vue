<template>
  <v-card :disabled="!is_file_exists || is_now_playing">
    <v-img
      @click="play"
      :key="video.id"
      :src="thumb"
      :aspect-ratio="16 / 9"
      :id="'video_'+video.id"
      :class="{'no-file':!is_file_exists}"
      class="thumb"
      contain
    >
      <span class="name"
        :title="video.name">
        <b class="pr-1">{{ index + 1 }}.</b>
        <span v-text="video.name"/>
      </span>
      <div v-if="!reg && index > 14"
        v-text="t('player.application_not_registered')"
        class="reg-playlist"/>
      <span v-if="video.duration"
        class="time"
        v-text="getDuration(video.duration)"/>
    </v-img>

    <div v-if="is_now_playing" class="playing-overlay">
      <v-chip size="small" variant="flat" color="primary">
        <v-icon start>mdi-play</v-icon>
        <span>{{ t('player.controls.now_playing') }}</span>
      </v-chip>
    </div>
  </v-card>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useRegistrationStore} from '@/stores/registration'
import {useI18n} from 'vue-i18n'
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

const emit = defineEmits(['play', 'goTo'])

// Stores
const appStore = useAppStore()
const playerStore = usePlayerStore()
const registrationStore = useRegistrationStore()
const {t} = useI18n()

// Refs
const thumb = ref(null)
const is_file_exists = ref(true)

// Computed
const player = computed(() => playerStore)
const reg = computed(() => registrationStore)

const is_now_playing = computed(() => {
  return player.value.nowPlaying === props.index
})

// Methods
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
  if (is_file_exists.value && !is_now_playing.value) {
    emit("play", props.index)
  }
}

const scrollToNowPlaying = () => {
  emit('goTo', props.index)
}

// Lifecycle
onMounted(() => {
  if (!thumb.value) {
    getThumb()
  }
  checkFileExists()
})
</script>

<style>
.playing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(var(--v-theme-primary), 50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
</style>