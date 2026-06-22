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
        :key="item.key || item.id"
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

<script setup>
import {computed, ref, toRef} from 'vue'
import Item from '@/components/items/Item.vue'
import {useVirtualGridWindow} from '@/composable/useVirtualGridWindow'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  itemsType: String,
  meta: Object,
  mediaType: Object,
  reg: Boolean,
  size: [Number, String],
  view: [Number, String],
  gapSize: String,
  gridClasses: {
    type: Array,
    default: () => [],
  },
  imageGrid: Boolean,
  wideImage: Boolean,
  lineGrid: Boolean,
  chipsGrid: Boolean,
})

const layoutRef = ref(null)
const itemsSource = toRef(props, 'items')

const layoutOptions = computed(() => ({
  size: props.size,
  gapSize: props.gapSize,
  imageGrid: props.imageGrid,
  wideImage: props.wideImage,
  lineGrid: props.lineGrid,
  chipsGrid: props.chipsGrid,
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
