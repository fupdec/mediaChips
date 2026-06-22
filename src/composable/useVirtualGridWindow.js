import {ref, computed, watch, onMounted, onBeforeUnmount, nextTick} from 'vue'
import {getMainScrollEl} from '@/utils/mainScroll'
import {
  chunkIntoRows,
  estimateRowHeight,
  getColumnCount,
  getGridGap,
  getLayoutTopInScroll,
  getMinColumnWidth,
  VIRTUAL_ROW_BUFFER,
} from '@/utils/gridLayout'

export function useVirtualGridWindow(itemsSource, layoutRef, layoutOptions) {
  const columnCount = ref(1)
  const rowHeight = ref(320)
  const topSpacer = ref(0)
  const bottomSpacer = ref(0)
  const visibleRows = ref([])

  const allRows = computed(() => {
    const items = itemsSource.value || []
    return chunkIntoRows(items, columnCount.value)
  })

  let scrollEl = null
  let resizeObserver = null
  let scrollRaf = null
  let measureRaf = null

  const getOptions = () => ({
    size: layoutOptions.value.size,
    gapSize: layoutOptions.value.gapSize,
    imageGrid: layoutOptions.value.imageGrid,
    wideImage: layoutOptions.value.wideImage,
    lineGrid: layoutOptions.value.lineGrid,
    chipsGrid: layoutOptions.value.chipsGrid,
    containerWidth: layoutRef.value?.clientWidth || 0,
    columnCount: columnCount.value,
  })

  const measureLayout = () => {
    const layoutEl = layoutRef.value
    if (!layoutEl) return

    const options = getOptions()
    const gap = getGridGap(options.gapSize)
    const minColumnWidth = getMinColumnWidth(options)

    columnCount.value = getColumnCount(
      layoutEl.clientWidth,
      minColumnWidth,
      gap.x,
      options,
    )

    rowHeight.value = estimateRowHeight({
      ...options,
      containerWidth: layoutEl.clientWidth,
      columnCount: columnCount.value,
    })
  }

  const measureVisibleRows = () => {
    const layoutEl = layoutRef.value
    if (!layoutEl) return

    const rowEls = layoutEl.querySelectorAll('.virtual-grid-row')
    if (!rowEls.length) return

    let maxHeight = 0
    rowEls.forEach((rowEl) => {
      maxHeight = Math.max(maxHeight, rowEl.offsetHeight)
    })

    if (maxHeight > 0 && Math.abs(maxHeight - rowHeight.value) > 6) {
      rowHeight.value = maxHeight
      updateWindow(false)
    }
  }

  const updateWindow = (scheduleMeasure = true) => {
    const layoutEl = layoutRef.value
    if (!layoutEl) return

    const rows = allRows.value
    if (!rows.length) {
      visibleRows.value = []
      topSpacer.value = 0
      bottomSpacer.value = 0
      return
    }

    if (!scrollEl) {
      visibleRows.value = rows
      topSpacer.value = 0
      bottomSpacer.value = 0
      return
    }

    const layoutTop = getLayoutTopInScroll(layoutEl, scrollEl)
    const scrollTop = scrollEl.scrollTop
    const viewportHeight = scrollEl.clientHeight
    const rh = Math.max(rowHeight.value, 1)
    const totalGridHeight = rows.length * rh

    const viewportStart = scrollTop
    const viewportEnd = scrollTop + viewportHeight
    const visibleGridStart = Math.max(0, viewportStart - layoutTop)
    const visibleGridEnd = Math.min(totalGridHeight, viewportEnd - layoutTop)

    if (visibleGridEnd <= visibleGridStart) {
      visibleRows.value = []
      topSpacer.value = 0
      bottomSpacer.value = totalGridHeight
      return
    }

    let start = Math.floor(visibleGridStart / rh) - VIRTUAL_ROW_BUFFER
    let end = Math.ceil(visibleGridEnd / rh) + VIRTUAL_ROW_BUFFER

    start = Math.max(0, start)
    end = Math.min(rows.length, end)

    if (end <= start) {
      end = Math.min(rows.length, start + VIRTUAL_ROW_BUFFER * 2 + 1)
    }

    topSpacer.value = start * rh
    bottomSpacer.value = (rows.length - end) * rh
    visibleRows.value = rows.slice(start, end)

    if (scheduleMeasure) {
      if (measureRaf) cancelAnimationFrame(measureRaf)
      measureRaf = requestAnimationFrame(() => {
        nextTick(measureVisibleRows)
      })
    }
  }

  const onScroll = () => {
    if (scrollRaf) cancelAnimationFrame(scrollRaf)
    scrollRaf = requestAnimationFrame(() => updateWindow())
  }

  const bind = () => {
    unbind()
    scrollEl = getMainScrollEl()
    scrollEl?.addEventListener('scroll', onScroll, {passive: true})

    if (layoutRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measureLayout()
        updateWindow()
      })
      resizeObserver.observe(layoutRef.value)
    }

    measureLayout()
    updateWindow(false)
  }

  let bindAttempts = 0

  const tryBind = () => {
    bind()
    if (!scrollEl && bindAttempts < 20) {
      bindAttempts += 1
      requestAnimationFrame(tryBind)
    }
  }

  const unbind = () => {
    if (scrollEl) {
      scrollEl.removeEventListener('scroll', onScroll)
      scrollEl = null
    }

    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    if (scrollRaf) cancelAnimationFrame(scrollRaf)
    if (measureRaf) cancelAnimationFrame(measureRaf)
  }

  onMounted(() => {
    nextTick(tryBind)
  })
  onBeforeUnmount(unbind)

  watch(itemsSource, () => {
    measureLayout()
    nextTick(() => updateWindow())
  })

  watch(layoutOptions, () => {
    measureLayout()
    updateWindow()
  }, {deep: true})

  return {
    visibleRows,
    topSpacer,
    bottomSpacer,
    columnCount,
    rowHeight,
    measureLayout,
    updateWindow,
  }
}
