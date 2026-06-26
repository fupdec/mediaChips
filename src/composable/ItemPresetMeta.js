import {ref, computed, onBeforeMount} from 'vue'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useItemsStore} from '@/stores/items'
import {useI18n} from 'vue-i18n'
import {apiClient} from '@/services/apiClient'
import {
  getCurrentMediaType,
  matchesMediaTypeFilter,
  getDefaultMediaTypeId,
} from '@/utils/mediaType'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
import {
  getReadableBitrate,
  getReadableDuration,
  getReadableFileSize,
} from '@/services/formatUtils'

export function usePresetMeta(props) {
  const appStore = useAppStore()
  const settingsStore = useSettingsStore()
  const itemsStore = useItemsStore()
  const {t} = useI18n()

  const numberOfMedia = ref(0)

  // Computed
  const SETTINGS = computed(() => settingsStore)
  const ENV = computed(() => itemsStore.environment)

  const preset_meta = computed(() => {

    if (SETTINGS.value.show_preset_metadata_in_card !== '1' && !props.isShowAll) {
      return []
    }

    const item = props.item
    if (!item) return []

    const currentMediaType = getCurrentMediaType(appStore.mediaTypes, ENV.value?.media_type_id)
    const numberOfMediaLabel = currentMediaType
      ? getMediaTypeName(currentMediaType, t)
      : t('settings_labels.appearance.number_of_media')

    let params = [
      {
        name: 'filesize',
        text: t('settings_labels.appearance.filesize'),
        icon: 'harddisk',
        types: ['media'],
        show: SETTINGS.value.show_default_meta_filesize === '1',
        value: getReadableFileSize(item.filesize),
      },
      {
        name: 'duration',
        text: t('settings_labels.appearance.duration'),
        icon: 'clock-outline',
        types: ['media'],
        media_types: ['video'],
        show: SETTINGS.value.show_default_meta_duration === '1',
        value: getReadableDuration(item.duration),
      },
      {
        name: 'resolution',
        text: t('settings_labels.appearance.resolution'),
        icon: 'monitor-screenshot',
        types: ['media'],
        media_types: ['video', 'image'],
        show: SETTINGS.value.show_default_meta_resolution === '1',
        value: item.width + 'x' + item.height,
      },
      {
        name: 'ext',
        text: 'Extension',
        icon: 'file-video-outline',
        types: ['media'],
        show: SETTINGS.value.show_default_meta_ext === '1',
      },
      {
        name: 'codec',
        text: t('settings_labels.appearance.codec'),
        icon: 'filmstrip',
        types: ['media'],
        media_types: ['video'],
        show: SETTINGS.value.show_default_meta_codec === '1',
      },
      {
        name: 'bitrate',
        text: t('settings_labels.appearance.bitrate'),
        icon: 'filmstrip',
        types: ['media'],
        media_types: ['video'],
        show: SETTINGS.value.show_default_meta_bitrate === '1',
        value: getReadableBitrate(item.bitrate),
      },
      {
        name: 'fps',
        text: t('settings_labels.appearance.framerate'),
        icon: 'filmstrip',
        types: ['media'],
        show: SETTINGS.value.show_default_meta_fps === '1',
        media_types: ['video'],
      },
      {
        name: 'numberOfMedia',
        text: numberOfMediaLabel,
        icon: 'video-outline',
        types: ['tag'],
        show: SETTINGS.value.show_default_meta_number_media === '1',
        value: numberOfMedia.value,
      },
      {
        name: 'views',
        text: t('settings_labels.appearance.number_of_views'),
        icon: 'eye-outline',
        show: SETTINGS.value.show_default_meta_number_views === '1',
        types: ['media', 'tag'],
      },
    ]

    // Фильтрация для определенных компонентов
    if (!props.isShowAll) {
      params = params.filter((i) => i.show)
    }

    return params.filter((param) => {
      return param.types.some((type) => {
        if (type !== props.type) return false
        return matchesMediaTypeFilter(param, currentMediaType)
      })
    }).filter((i) => {
      return item[i.name] !== '' && item[i.name] !== null
    })
  })

  // Methods
  const countMediaInTag = () => {
    const mediaTypeId = ENV.value?.media_type_id || getDefaultMediaTypeId(appStore.mediaTypes)
    if (!mediaTypeId) return

    let url = `/api/media/numberOfMediaWithTag?mediaTypeId=${mediaTypeId}&tagId=${props.item?.id}`
    apiClient
      .get(url)
      .then((res) => {
        numberOfMedia.value = res.data.count
      })
      .catch((e) => {
        console.log(e)
      })
  }

  // Lifecycle
  onBeforeMount(() => {
    if (props.type == "tag") countMediaInTag()
  })

  return {
    preset_meta,
    numberOfMedia,
    countMediaInTag
  }
}