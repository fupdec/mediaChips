import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {getReadableDuration} from '@/services/formatUtils'
import {
  filterMarksByTypes,
  getMarkListColor,
  getMarkListIcon,
} from '@/composable/playerMarkDisplay'
import {
  ensureMarkThumb,
  loadMarkImageDisplayUrl,
} from '@/utils/markThumb'

export function usePlayerMarks({emit}) {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const itemsStore = useItemsStore()
  const eventBus = useEventBus()

  const marksType = ref(['favorite', 'bookmark'])
  const is_thumbs_loaded = ref(false)

  const player = computed(() => playerStore)
  const assigned = computed(() => itemsStore.assigned.filter((i) => i.meta?.marks))

  const marks = computed(() => filterMarksByTypes(playerStore.marks, marksType.value))

  const loadMarkThumb = async (mark) => {
    if (!appStore.mediaPath) return

    mark.thumb = await loadMarkImageDisplayUrl({
      markId: mark.id,
      mediaPath: appStore.mediaPath,
      mediaId: playerStore.media?.id,
    })
  }

  const getThumbs = async () => {
    if (!appStore.mediaPath) return

    is_thumbs_loaded.value = false

    for (const mark of playerStore.marks) {
      await loadMarkThumb(mark)
    }

    is_thumbs_loaded.value = true
  }

  const getDuration = (duration) => getReadableDuration(duration)

  const jumpTo = (time) => {
    if (player.value.player) {
      player.value.player.currentTime = time
    }
  }

  const remove = (mark) => {
    emit('removeMark', mark)
  }

  const handleUpdateMarkImage = (id) => {
    if (player.value.marks.some((i) => i.id === id)) {
      getThumbs()
    }
  }

  const ensureMetaTypeSelected = (metaId) => {
    if (metaId != null && !marksType.value.some((type) => type == metaId)) {
      marksType.value.push(metaId)
    }
  }

  watch(() => playerStore.marks, (storeMarks) => {
    getThumbs()

    storeMarks.forEach((mark) => {
      if (mark.type !== 'meta') return
      ensureMetaTypeSelected(mark.meta?.id || mark.metaId)
    })
  })

  watch(() => appStore.mediaPath, (mediaPath) => {
    if (mediaPath) {
      getThumbs()
    }
  })

  watch(assigned, (arr) => {
    arr.forEach((i) => ensureMetaTypeSelected(i.meta?.id))
  }, {immediate: true})

  const handleRefreshMarkThumbs = () => {
    getThumbs()
  }

  onMounted(() => {
    eventBus.on('updateMarkImage', handleUpdateMarkImage)
    eventBus.on('refreshMarkThumbs', handleRefreshMarkThumbs)
    getThumbs()
  })

  onBeforeUnmount(() => {
    eventBus.off('updateMarkImage', handleUpdateMarkImage)
    eventBus.off('refreshMarkThumbs', handleRefreshMarkThumbs)
  })

  return {
    player,
    marksType,
    is_thumbs_loaded,
    assigned,
    marks,
    getThumbs,
    getIcon: getMarkListIcon,
    getColor: getMarkListColor,
    getDuration,
    jumpTo,
    remove,
  }
}
