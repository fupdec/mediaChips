<template>
  <section v-if="items.length" class="home-media-row mb-6">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center text-h6">
        <v-icon class="mr-2" size="24">{{ icon }}</v-icon>
        <span>{{ title }}</span>
      </div>

      <v-btn
        v-if="showViewAll"
        @click="emit('view-all')"
        color="primary"
        variant="text"
        rounded
        size="small"
      >
        {{ t('home.widgets.view_all') }}
        <v-icon end size="18">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <div class="home-media-row__scroll">
      <WidgetMediaCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :thumb="item.thumb"
        :variant="variant"
        @click="emit('open', item)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n'
import WidgetMediaCard from '@/components/widgets/WidgetMediaCard.vue'
import type { HomeMediaCardVariant, HomeMediaItem } from '@/types/widgets'

withDefaults(defineProps<{
  title: string
  icon?: string
  items?: HomeMediaItem[]
  variant?: HomeMediaCardVariant
  showViewAll?: boolean
}>(), {
  icon: 'mdi-play-circle-outline',
  items: () => [],
  variant: 'views',
  showViewAll: true,
})

const emit = defineEmits<{
  open: [item: HomeMediaItem]
  'view-all': []
}>()
const {t} = useI18n()
</script>

<style lang="scss" scoped>
.home-media-row {
  &__scroll {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 4px;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;

    & > * {
      scroll-snap-align: start;
    }
  }
}
</style>
