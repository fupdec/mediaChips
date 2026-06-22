<template>
  <v-card
    class="dynamic-playlist-row"
    :class="{
      'dynamic-playlist-row--skeleton': skeleton,
      'dynamic-playlist-row--playing': playing,
    }"
    rounded="lg"
    variant="outlined"
    @click="handleClick"
    v-ripple="skeleton ? false : { class: 'text-primary' }"
  >
    <div class="dynamic-playlist-row__content">
      <div class="dynamic-playlist-row__preview">
        <v-skeleton-loader
          v-if="skeleton || thumbsLoading"
          type="image"
          class="dynamic-playlist-row__preview-skeleton"
        />

        <div
          v-else-if="displayThumbs.length"
          class="dynamic-playlist-row__thumbs"
        >
          <v-img
            v-for="(thumb, index) in displayThumbs"
            :key="index"
            :src="thumb"
            cover
            class="dynamic-playlist-row__thumb"
          />
        </div>

        <div v-else class="dynamic-playlist-row__preview-empty">
          <v-icon size="22" color="grey-darken-1">mdi-filter-variant</v-icon>
        </div>
      </div>

      <div class="dynamic-playlist-row__info">
        <template v-if="skeleton">
          <v-skeleton-loader type="text" width="55%"/>
          <v-skeleton-loader type="text" width="30%" class="mt-1"/>
        </template>

        <template v-else>
          <div class="dynamic-playlist-row__title" :title="playlist.name">
            {{ playlist.name }}
          </div>
          <div class="dynamic-playlist-row__meta">
            {{ videoCountLabel }}
          </div>
        </template>
      </div>

      <div v-if="!skeleton" class="dynamic-playlist-row__play-wrap">
        <v-progress-circular
          v-if="playing"
          indeterminate
          color="primary"
          size="28"
          width="3"
        />
        <v-btn
          v-else
          icon
          variant="text"
          class="dynamic-playlist-row__play"
          @click.stop="emit('play')"
        >
          <v-icon>mdi-play</v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'

const props = defineProps({
  playlist: {
    type: Object,
    required: true,
  },
  skeleton: {
    type: Boolean,
    default: false,
  },
  thumbsLoading: {
    type: Boolean,
    default: false,
  },
  playing: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['play'])
const {t} = useI18n()

const displayThumbs = computed(() => (props.playlist.thumbs || []).slice(0, 4))

const videoCount = computed(() => props.playlist.count || 0)

const videoCountLabel = computed(() => {
  const count = videoCount.value
  if (count === 0) return t('playlists.no_videos_added')
  if (count === 1) return t('playlists.one_video')
  return t('playlists.video_count', {count})
})

const handleClick = () => {
  if (props.skeleton) return
  emit('play')
}
</script>

<style lang="scss" scoped>
.dynamic-playlist-row {
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.04);
    border-color: rgba(var(--v-theme-primary), 0.35);
  }
}

.dynamic-playlist-row--skeleton {
  cursor: default;
  pointer-events: none;

  &:hover {
    background: transparent;
    border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  }
}

.dynamic-playlist-row__content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
}

.dynamic-playlist-row__preview {
  flex-shrink: 0;
  width: 96px;
  height: 54px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(145deg, #1f1f1f 0%, #121212 100%);
}

.dynamic-playlist-row__preview-skeleton {
  width: 100%;
  height: 100%;
}

.dynamic-playlist-row__preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.dynamic-playlist-row__thumbs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1px;
  width: 100%;
  height: 100%;
}

.dynamic-playlist-row__thumb {
  width: 100%;
  height: 100%;
}

.dynamic-playlist-row__info {
  min-width: 0;
  flex: 1;
}

.dynamic-playlist-row__title {
  font-size: 0.95rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dynamic-playlist-row__meta {
  margin-top: 2px;
  font-size: 0.78rem;
  opacity: 0.7;
}

.dynamic-playlist-row__play-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}
</style>
