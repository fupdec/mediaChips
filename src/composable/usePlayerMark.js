import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import path from 'path-browserify'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useEventBus} from '@/utils/eventBus'
import {getLocalImage} from '@/services/fileService'
import {checkColorForDarkText, getReadableDuration} from '@/services/formatUtils'
import {
  formatMarkTimeRange,
  getMarkTimelineColor,
  getMarkTimelineIcon,
  getMarkTimelinePositionStyle,
  getMarkTimelineWidthStyle,
} from '@/composable/playerMarkDisplay'

export function usePlayerMark(props, emit) {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const eventBus = useEventBus()

  const thumb = ref(null)

  const icon = computed(() => getMarkTimelineIcon(props.mark))
  const color = computed(() => getMarkTimelineColor(props.mark))

  const colorMetaIcon = computed(() => {
    const isDark = checkColorForDarkText(color.value)
    return isDark ? 'white' : 'black'
  })

  const time = computed(() => formatMarkTimeRange(
    props.mark,
    (duration) => getReadableDuration(duration),
  ))

  const position = computed(() => getMarkTimelinePositionStyle(props.mark, playerStore.duration))

  const timeline_width = computed(() => getMarkTimelineWidthStyle(
    props.mark,
    playerStore.duration,
    props.controls_width,
  ))

  const getImg = async () => {
    const imgPath = path.join(
      appStore.mediaPath,
      'videos/marks',
      `${props.mark.id}.jpg`,
    )

    thumb.value = await getLocalImage(imgPath)
  }

  const jumpTo = () => {
    if (playerStore.player) {
      playerStore.player.currentTime = props.mark.time
    }
  }

  const remove = () => {
    emit('removeMark', props.mark)
  }

  const handleUpdateMarkImage = (id) => {
    if (props.mark.id === id) {
      getImg()
    }
  }

  onMounted(() => {
    eventBus.on('updateMarkImage', handleUpdateMarkImage)
    getImg()
  })

  onBeforeUnmount(() => {
    eventBus.off('updateMarkImage', handleUpdateMarkImage)
  })

  return {
    playerStore,
    thumb,
    icon,
    color,
    colorMetaIcon,
    time,
    position,
    timeline_width,
    jumpTo,
    remove,
  }
}
