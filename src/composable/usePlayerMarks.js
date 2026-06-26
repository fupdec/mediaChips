import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import path from 'path-browserify'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {getLocalImage} from '@/services/fileService'
import {getReadableDuration} from '@/services/formatUtils'
import {
  filterMarksByTypes,
  getMarkListColor,
  getMarkListIcon,
} from '@/composable/playerMarkDisplay'

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

  const getThumbs = async () => {
    is_thumbs_loaded.value = false

    for (const mark of playerStore.marks) {
      const imgPath = path.join(
        appStore.mediaPath,
        'videos/marks',
        `${mark.id}.jpg`,
      )

      mark.thumb = await getLocalImage(imgPath)
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

  watch(assigned, (arr) => {
    arr.forEach((i) => ensureMetaTypeSelected(i.meta?.id))
  }, {immediate: true})

  onMounted(() => {
    eventBus.on('updateMarkImage', handleUpdateMarkImage)
    getThumbs()
  })

  onBeforeUnmount(() => {
    eventBus.off('updateMarkImage', handleUpdateMarkImage)
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
