import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {usePlayerStore} from '@/stores/player'
import {
  getPrimaryWheelDelta,
  getSeekSecondsFromWheel,
  preventWheelDefault,
} from '@/utils/playerWheel'
import _ from 'lodash'

export function findMarkToJump(marks, currentTime, type) {
  const ordered = type === 'prev'
    ? _.orderBy(marks, 'time', ['desc'])
    : marks

  const threshold = type === 'prev' ? currentTime - 5 : currentTime

  for (const mark of ordered) {
    if (type === 'prev' && mark.time < threshold) return mark
    if (type === 'next' && mark.time > threshold) return mark
  }

  return null
}

export function getMarkStatusLabel(mark) {
  if (!mark) return ''
  if (mark.type === 'meta') return mark['tag.name'] || ''
  return mark.name || ''
}

export function usePlayerTimeline({emit}) {
  const playerStore = usePlayerStore()
  const player = computed(() => playerStore)

  const slider_progress = ref(null)
  const is_mounted = ref(false)
  const resized = ref(0)
  const preview_event_target = ref(null)
  const preview_show = ref(true)

  let previewRafId = null
  let previewPendingX = null
  let timelineResizeObserver = null

  const controls_width = computed(() => {
    if (is_mounted.value && resized.value > -1 && slider_progress.value) {
      return slider_progress.value?.$el?.clientWidth || 0
    }
    return 0
  })

  const jumpTo = (time) => {
    playerStore.playerJumpTo(time)
  }

  const jumpToSeconds = (time) => {
    jumpTo(player.value.currentTime + time)
  }

  const jumpToMark = (type) => {
    const mark = findMarkToJump(player.value.marks, player.value.currentTime, type)
    if (!mark) return

    jumpTo(mark.time)
    playerStore.changePlayerStatusText({
      text: getMarkStatusLabel(mark),
      icon: 'tooltip',
    })
  }

  const startSeeking = (time) => {
    playerStore.seeking = true
    playerStore.seekTime = time
  }

  const seek = (time) => {
    playerStore.seeking = false
    jumpTo(time)
  }

  const handleSliderChange = (value) => {
    if (player.value.seeking) {
      playerStore.seekTime = value
    }
  }

  const wheelSeek = (e) => {
    if (!player.value.is_file_exists || player.value.playbackError) return

    preventWheelDefault(e)
    emit('showControls')

    if (e.altKey) {
      getPrimaryWheelDelta(e) > 0 ? jumpToMark('prev') : jumpToMark('next')
      return
    }

    const seconds = getSeekSecondsFromWheel(e)
    if (!seconds) return

    jumpToSeconds(seconds)
  }

  const handleMouseSeek = (e) => {
    switch (e.button) {
      case 3:
        jumpToMark('prev')
        break
      case 4:
        jumpToMark('next')
        break
    }
  }

  const saveEvent = (e) => {
    preview_show.value = true
    preview_event_target.value = e.currentTarget
  }

  const showPreview = (e) => {
    if (!preview_show.value || !preview_event_target.value) return

    previewPendingX = e.pageX
    if (previewRafId) return

    previewRafId = requestAnimationFrame(() => {
      previewRafId = null
      const pageX = previewPendingX
      if (pageX == null || !preview_event_target.value) return

      const currentTargetRect = preview_event_target.value.getBoundingClientRect()
      const width = currentTargetRect.width
      if (!width) return

      const left = pageX - currentTargetRect.left
      playerStore.progress_hover = left / width * 100
    })
  }

  const clearPreviewHover = () => {
    playerStore.progress_hover = null
    preview_show.value = false
  }

  const resize = () => {
    ++resized.value
  }

  const observeTimelineResize = () => {
    const el = slider_progress.value?.$el || slider_progress.value
    if (!el || typeof ResizeObserver === 'undefined') return

    timelineResizeObserver?.disconnect()
    timelineResizeObserver = new ResizeObserver(() => {
      resize()
    })
    timelineResizeObserver.observe(el)
  }

  onMounted(() => {
    is_mounted.value = true
    window.addEventListener('resize', resize)
    nextTick(observeTimelineResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    timelineResizeObserver?.disconnect()
    timelineResizeObserver = null
    if (previewRafId) {
      cancelAnimationFrame(previewRafId)
    }
  })

  watch(
    () => [playerStore.marksVisible, playerStore.playlistVisible],
    () => nextTick(resize),
  )

  return {
    player,
    playerStore,
    slider_progress,
    controls_width,
    startSeeking,
    seek,
    handleSliderChange,
    wheelSeek,
    handleMouseSeek,
    saveEvent,
    showPreview,
    clearPreviewHover,
    jumpToMark,
    resize,
  }
}
