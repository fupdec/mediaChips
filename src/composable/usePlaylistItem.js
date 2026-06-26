import {ref, computed, watch, onMounted} from 'vue'
import path from 'path-browserify'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useRegistrationStore} from '@/stores/registration'
import {useItemsStore} from '@/stores/items'
import {checkFileExists as checkPathExists, getLocalImage} from '@/services/fileService'
import {getReadableDuration} from '@/services/formatUtils'

const UNREGISTERED_PLAYLIST_LIMIT = 14

export function usePlaylistItem(props, emit) {
  const appStore = useAppStore()
  const playerStore = usePlayerStore()
  const registrationStore = useRegistrationStore()
  const itemsStore = useItemsStore()

  const thumb = ref(null)
  const is_file_exists = ref(true)

  const player = computed(() => playerStore)
  const reg = computed(() => registrationStore.reg)

  const is_now_playing = computed(() => player.value.nowPlaying === props.index)

  const is_locked = computed(() => !reg.value && props.index > UNREGISTERED_PLAYLIST_LIMIT)

  const getThumb = async () => {
    const imgPath = path.join(
      appStore.mediaPath,
      'videos/thumbs',
      `${props.video.id}.jpg`,
    )

    thumb.value = await getLocalImage(imgPath)
  }

  const getDuration = (time) => getReadableDuration(time)

  const checkVideoFileExists = async () => {
    is_file_exists.value = await checkPathExists(props.video.path)
  }

  const play = () => {
    if (is_file_exists.value && !is_now_playing.value && !is_locked.value) {
      emit('play', props.index)
    }
  }

  watch(() => itemsStore.thumbRefreshKeys[Number(props.video.id)], (version) => {
    if (version == null) return
    getThumb()
  })

  onMounted(() => {
    if (!thumb.value) {
      getThumb()
    }
    checkVideoFileExists()
  })

  return {
    thumb,
    is_file_exists,
    is_now_playing,
    is_locked,
    reg,
    getDuration,
    play,
  }
}
