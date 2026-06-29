<template>
  <div ref="layoutRef" class="items-virtual-grid">
    <div
      class="virtual-grid-spacer"
      :style="{ height: `${topSpacer}px` }"
      aria-hidden="true"
    />

    <div
      v-for="row in visibleRows"
      :key="row.startIndex"
      :class="gridClasses"
      class="virtual-grid-row"
    >
      <Item
        v-for="(item, idx) in row.items"
        v-memo="[item.id, item.rating, item.favorite, item.views, item.name, size, view, itemsType]"
        :key="item.id"
        :type="itemsType"
        :item="item"
        :meta="meta"
        :media-type="mediaType"
        :reg="reg"
        :x="row.startIndex + idx"
      />
    </div>

    <div
      class="virtual-grid-spacer"
      :style="{ height: `${bottomSpacer}px` }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import {computed, ref, type HTMLAttributes} from 'vue'
import Item from '@/components/items/Item.vue'
import {useVirtualGridWindow} from '@/composable/useVirtualGridWindow'
import type {MediaType} from '@/types/media'
import type {MediaItem, Meta} from '@/types/stores'

const props = withDefaults(defineProps<{
  items?: MediaItem[]
  itemsType?: 'media' | 'tag'
  meta?: Meta | null
  mediaType?: MediaType | null
  reg?: boolean
  size?: number | string
  view?: number | string
  gapSize?: string
  gridClasses?: HTMLAttributes['class']
  imageGrid?: boolean
  wideImage?: boolean
  lineGrid?: boolean
  chipsGrid?: boolean
}>(), {
  items: () => [],
  itemsType: 'media',
  meta: null,
  mediaType: null,
  reg: true,
  size: 3,
  view: 1,
  gapSize: 'default',
  gridClasses: undefined,
  imageGrid: false,
  wideImage: false,
  lineGrid: false,
  chipsGrid: false,
})

const layoutRef = ref<HTMLElement | null>(null)
const itemsSource = computed(() => props.items)

const layoutOptions = computed(() => ({
  size: Number(props.size),
  gapSize: props.gapSize ?? 'default',
  imageGrid: props.imageGrid ?? false,
  wideImage: props.wideImage ?? false,
  lineGrid: props.lineGrid ?? false,
  chipsGrid: props.chipsGrid ?? false,
}))

const {
  visibleRows,
  topSpacer,
  bottomSpacer,
} = useVirtualGridWindow(itemsSource, layoutRef, layoutOptions)
</script>

<style scoped>
.items-virtual-grid {
  width: 100%;
}

.items-virtual-grid :deep(.item) {
  content-visibility: auto;
  contain-intrinsic-size: auto 280px;
}

.virtual-grid-spacer {
  width: 100%;
  pointer-events: none;
}
</style>
