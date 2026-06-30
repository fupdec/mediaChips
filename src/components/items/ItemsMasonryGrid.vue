<template>
  <div
    ref="layoutRef"
    :class="[gridClasses, { 'items-masonry-grid--virtual': virtual }]"
    :style="virtual ? undefined : gridStyle"
    class="items-masonry-grid masonry-grid"
  >
    <div
      v-if="virtual"
      class="masonry-virtual-surface"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        v-for="position in visibleItems"
        :key="position.item.id"
        :style="itemStyle(position)"
        class="masonry-virtual-item"
      >
        <Item
          v-memo="[position.item.id, position.item.rating, position.item.favorite, position.item.views, position.item.name, size, view, itemsType]"
          :type="itemsType"
          :item="position.item"
          :meta="meta"
          :media-type="mediaType"
          :reg="reg"
          :x="position.index"
        />
      </div>
    </div>

    <template v-else>
      <div
        v-for="(column, colIndex) in columns"
        :key="colIndex"
        :style="columnStyle"
        class="masonry-column"
      >
        <Item
          v-for="{ item, index } in column.items"
          v-memo="[item.id, item.rating, item.favorite, item.views, item.name, size, view, itemsType]"
          :key="item.id"
          :type="itemsType"
          :item="item"
          :meta="meta"
          :media-type="mediaType"
          :reg="reg"
          :x="index"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, onMounted, onBeforeUnmount, type HTMLAttributes} from 'vue'
import Item from '@/components/items/Item.vue'
import {useVirtualMasonryWindow} from '@/composable/useVirtualMasonryWindow'
import {
  estimateMasonryItemHeight,
  getColumnCount,
  getGridGap,
  getMinColumnWidth,
  packMasonryColumns,
} from '@/utils/gridLayout'
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
  virtual?: boolean
}>(), {
  items: () => [],
  itemsType: 'media',
  meta: null,
  mediaType: null,
  reg: true,
  size: 3,
  view: 3,
  gapSize: 'default',
  gridClasses: undefined,
  virtual: false,
})

const layoutRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const columnCount = ref(1)
const itemsSource = computed(() => props.items)
const virtualEnabled = computed(() => props.virtual)

const layoutOptions = computed(() => ({
  size: Number(props.size),
  gapSize: props.gapSize ?? 'xs',
}))

const {
  visibleItems,
  totalHeight,
  itemStyle,
} = useVirtualMasonryWindow(itemsSource, layoutRef, layoutOptions, virtualEnabled)

const gap = computed(() => getGridGap(props.gapSize ?? 'xs'))

const colWidth = computed(() => {
  const cols = columnCount.value
  const width = containerWidth.value
  const gapX = gap.value.x

  if (!width || cols < 1) return 200

  return (width - gapX * (cols - 1)) / cols
})

const columns = computed(() => {
  if (props.virtual) return []

  const items = props.items || []
  const width = colWidth.value

  return packMasonryColumns(
    items,
    columnCount.value,
    (item) => estimateMasonryItemHeight(item, width),
    width,
    gap.value.y,
  )
})

const gridStyle = computed(() => ({
  columnGap: `${gap.value.x}px`,
}))

const columnStyle = computed(() => ({
  rowGap: `${gap.value.y}px`,
}))

let resizeObserver: ResizeObserver | null = null

const measureLayout = () => {
  const layoutEl = layoutRef.value
  if (!layoutEl) return

  containerWidth.value = layoutEl.clientWidth

  const options = {
    size: Number(props.size),
    gapSize: props.gapSize ?? 'xs',
    imageGrid: true,
    containerWidth: layoutEl.clientWidth,
  }
  const gapX = getGridGap(options.gapSize).x
  const minColumnWidth = getMinColumnWidth(options)

  columnCount.value = getColumnCount(
    layoutEl.clientWidth,
    minColumnWidth,
    gapX,
    options,
  )
}

onMounted(() => {
  if (props.virtual) return

  measureLayout()

  if (layoutRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      measureLayout()
    })
    resizeObserver.observe(layoutRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.items-masonry-grid {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.items-masonry-grid--virtual {
  display: block;
}

.masonry-virtual-surface {
  position: relative;
  width: 100%;
}

.masonry-virtual-item {
  position: absolute;
}

.masonry-column {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.items-masonry-grid :deep(.item) {
  content-visibility: auto;
  contain-intrinsic-size: auto 180px;
}
</style>
