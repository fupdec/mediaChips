<template>
  <v-card
    class="home-media-card"
    rounded="lg"
    elevation="2"
    hover
    @click="emit('click')"
  >
    <div class="home-media-card__preview">
      <v-img
        v-if="thumb"
        :src="thumb"
        cover
        class="home-media-card__thumb"
      />
      <div v-else class="home-media-card__placeholder">
        <v-icon size="36" color="grey-darken-1">{{ placeholderIcon }}</v-icon>
      </div>

      <v-chip
        v-if="variant === 'views' && item.views"
        class="home-media-card__badge"
        color="primary"
        size="x-small"
        variant="flat"
      >
        <v-icon start size="12">mdi-eye</v-icon>
        {{ item.views }}
      </v-chip>

      <v-icon
        v-if="item.favorite && variant !== 'favorite'"
        class="home-media-card__favorite"
        color="pink"
        size="18"
      >
        mdi-heart
      </v-icon>

      <v-rating
        v-if="variant === 'favorite' && item.rating > 0"
        class="home-media-card__rating"
        :model-value="item.rating"
        active-color="yellow-darken-2"
        color="grey-darken-1"
        density="compact"
        half-increments
        readonly
        size="x-small"
      />
    </div>

    <v-progress-linear
      v-if="variant === 'continue' && progress > 0"
      :model-value="progress"
      color="primary"
      height="3"
    />

    <div class="home-media-card__body pa-2">
      <div class="text-caption text-truncate" :title="item.name">
        {{ item.name }}
      </div>
      <div
        v-if="subtitle"
        class="text-caption text-medium-emphasis text-truncate"
      >
        {{ subtitle }}
      </div>
    </div>
  </v-card>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useAppStore} from '@/stores/app'
import {findMediaTypeById, isImageMediaType, isVideoMediaType} from '@/utils/mediaType'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  thumb: {
    type: String,
    default: null,
  },
  variant: {
    type: String,
    default: 'views',
    validator: (value) => ['continue', 'favorite', 'views'].includes(value),
  },
})

const emit = defineEmits(['click'])

dayjs.extend(relativeTime)

const {t} = useI18n()
const appStore = useAppStore()

const mediaType = computed(() =>
  findMediaTypeById(appStore.mediaTypes, props.item.mediaTypeId),
)

const placeholderIcon = computed(() => {
  if (isImageMediaType(mediaType.value)) return 'mdi-image'
  if (isVideoMediaType(mediaType.value)) return 'mdi-movie-open'
  return 'mdi-file'
})

const progress = computed(() => {
  const duration = Number(props.item.duration || 0)
  const time = Number(props.item.time || 0)
  if (!duration) return 0
  return Math.min(100, (time / duration) * 100)
})

const subtitle = computed(() => {
  if (props.variant === 'continue' && progress.value > 0) {
    return t('home.widgets.continue_progress', {percent: Math.round(progress.value)})
  }

  if (props.item.viewedAt) {
    return dayjs(props.item.viewedAt).fromNow()
  }

  return ''
})
</script>

<style lang="scss" scoped>
.home-media-card {
  width: 148px;
  flex: 0 0 148px;
  overflow: hidden;
  cursor: pointer;

  &__preview {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: rgba(var(--v-theme-on-surface), 0.06);
  }

  &__thumb {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;

    :deep(.v-img__img) {
      object-fit: cover;
    }
  }

  &__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__badge {
    position: absolute;
    right: 6px;
    bottom: 6px;
    z-index: 1;
  }

  &__favorite {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 1;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
  }

  &__rating {
    position: absolute;
    left: 4px;
    bottom: 4px;
    z-index: 1;
  }

  &__body {
    min-height: 48px;
  }
}
</style>
