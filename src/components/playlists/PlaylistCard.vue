<template>
  <v-card class="playlist-card" rounded="lg" elevation="2">
    <div
      class="playlist-cover"
      :class="{
        'playlist-cover--playing': playing,
        'playlist-cover--thumbs-loading': thumbsLoading && !loading,
      }"
      @click="!loading && emit('play')"
      v-ripple="loading ? false : { class: 'text-primary' }"
    >
      <div v-if="loading" class="playlist-cover__state">
        <v-skeleton-loader type="image" class="playlist-cover__skeleton"/>
      </div>

      <div v-else-if="thumbsLoading" class="playlist-cover__state">
        <v-skeleton-loader type="image" class="playlist-cover__skeleton"/>
      </div>

      <div v-else-if="displayThumbs.length === 0" class="playlist-cover__state playlist-cover__empty">
        <v-icon size="52" color="grey-darken-1">mdi-playlist-play</v-icon>
      </div>

      <div
        v-else
        class="collage"
        :class="`collage--${collageClass}`"
      >
        <div
          v-for="(thumb, index) in displayThumbs"
          :key="index"
          class="collage__cell"
          :class="`collage__cell--${index}`"
        >
          <v-img :src="thumb" cover class="collage__img"/>
        </div>
      </div>

      <div
        class="playlist-cover__overlay"
        :class="{'playlist-cover__overlay--visible': playing || thumbsLoading}"
      >
        <v-progress-circular
          v-if="playing"
          indeterminate
          color="white"
          size="42"
          width="3"
        />
        <v-btn
          v-else
          icon
          color="white"
          variant="flat"
          size="large"
          class="play-btn"
        >
          <v-icon size="30">mdi-play</v-icon>
        </v-btn>
      </div>

      <v-chip
        v-if="videoCount > 0"
        size="small"
        class="playlist-cover__count"
        variant="flat"
        prepend-icon="mdi-video"
      >
        {{ videoCount }}
      </v-chip>
    </div>

    <div
      v-if="loading"
      class="playlist-card__footer playlist-card__footer--loading"
    >
      <v-skeleton-loader type="text@2" width="70%"/>
    </div>

    <div
      v-else
      class="playlist-card__footer"
      @click="showEdit ? emit('edit') : emit('play')"
      v-ripple="{ class: 'text-primary' }"
    >
      <div class="playlist-card__info">
        <div class="playlist-card__title" :title="playlist.name">
          {{ playlist.name }}
        </div>
        <div class="playlist-card__meta">
          {{ videoCountLabel }}
        </div>
      </div>

      <v-btn
        v-if="showEdit"
        icon
        variant="text"
        size="small"
        class="playlist-card__edit"
        @click.stop="emit('edit')"
      >
        <v-icon>mdi-pencil-outline</v-icon>
      </v-btn>
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
  loading: {
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
  videoCount: {
    type: Number,
    default: null,
  },
  showEdit: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['play', 'edit'])
const {t} = useI18n()

const displayThumbs = computed(() => (props.playlist.thumbs || []).slice(0, 4))

const videoCount = computed(() => {
  if (props.videoCount != null) return props.videoCount
  return props.playlist.media?.length || props.playlist.count || 0
})

const videoCountLabel = computed(() => {
  const count = videoCount.value
  if (count === 0) return t('playlists.no_videos_added')
  if (count === 1) return t('playlists.one_video')
  return t('playlists.video_count', {count})
})

const collageClass = computed(() => {
  const count = displayThumbs.value.length
  if (count <= 1) return '1'
  if (count === 2) return '2'
  if (count === 3) return '3'
  return '4'
})
</script>

<style lang="scss" scoped>
.playlist-card {
  overflow: hidden;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);

    .playlist-cover__overlay {
      opacity: 1;
    }

    .playlist-card__edit {
      opacity: 1;
    }
  }
}

.playlist-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(145deg, #1f1f1f 0%, #121212 100%);
  cursor: pointer;
  overflow: hidden;
}

.playlist-cover__state {
  width: 100%;
  height: 100%;
}

.playlist-cover__skeleton {
  width: 100%;
  height: 100%;
}

.playlist-cover__empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.collage {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 2px;
}

.collage--1 {
  grid-template: 1fr / 1fr;
}

.collage--2 {
  grid-template: 1fr / 1fr 1fr;
}

.collage--3 {
  grid-template-columns: 1.2fr 1fr;
  grid-template-rows: 1fr 1fr;

  .collage__cell--0 {
    grid-row: 1 / 3;
  }
}

.collage--4 {
  grid-template: 1fr 1fr / 1fr 1fr;
}

.collage__img {
  width: 100%;
  height: 100%;
}

.playlist-cover__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.42);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.playlist-cover__overlay--visible {
  opacity: 1;
}

.playlist-cover--thumbs-loading:hover .playlist-cover__overlay,
.playlist-cover--playing .playlist-cover__overlay {
  opacity: 1;
}

.play-btn {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.playlist-cover__count {
  position: absolute;
  right: 10px;
  bottom: 10px;
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.62) !important;
  color: #fff;
}

.playlist-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px 12px 14px;
  cursor: pointer;
  min-height: 68px;
}

.playlist-card__footer--loading {
  cursor: default;
}

.playlist-card__info {
  min-width: 0;
  flex: 1;
}

.playlist-card__title {
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-card__meta {
  margin-top: 2px;
  font-size: 0.78rem;
  opacity: 0.7;
}

.playlist-card__edit {
  opacity: 0.55;
  transition: opacity 0.2s ease;
}
</style>
