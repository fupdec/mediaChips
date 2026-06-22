<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppZoom} from '@/composable/useAppZoom'
import {MAX_ZOOM, MIN_ZOOM} from '@/utils/appZoom'

const {t} = useI18n({useScope: 'global'})
const {zoom, setZoom, zoomIn, zoomOut, resetZoom, formatZoomPercent} = useAppZoom()

const zoomPercent = computed(() => Math.round(zoom.value * 100))
</script>

<template>
  <div class="d-flex align-center flex-wrap mt-4 mb-2">
    <div class="text-body-1 text-high-emphasis mb-2 mr-4">
      <v-icon start>mdi-magnify-plus-outline</v-icon>
      {{ t('settings_labels.appearance.zoom') }}
    </div>

    <v-btn
      icon
      size="small"
      variant="text"
      :disabled="zoom <= MIN_ZOOM"
      @click="zoomOut"
    >
      <v-icon>mdi-minus</v-icon>
    </v-btn>

    <v-slider
      :model-value="zoomPercent"
      :min="Math.round(MIN_ZOOM * 100)"
      :max="Math.round(MAX_ZOOM * 100)"
      :step="5"
      class="mx-2 app-zoom-slider"
      hide-details
      @update:model-value="value => setZoom(value / 100)"
    />

    <v-btn
      icon
      size="small"
      variant="text"
      :disabled="zoom >= MAX_ZOOM"
      @click="zoomIn"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <span class="text-body-2 ml-2 text-medium-emphasis">
      {{ formatZoomPercent(zoom) }}
    </span>

    <v-btn
      size="small"
      variant="text"
      class="ml-2"
      :disabled="zoom === 1"
      @click="resetZoom"
    >
      {{ t('settings_labels.appearance.zoom_reset') }}
    </v-btn>
  </div>

  <div class="text-caption text-medium-emphasis mb-2">
    {{ t('settings_labels.appearance.zoom_hint') }}
  </div>
</template>

<style lang="scss" scoped>
.app-zoom-slider {
  max-width: 280px;
  min-width: 180px;
}
</style>
