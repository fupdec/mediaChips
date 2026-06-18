import {ref, computed, onBeforeMount} from 'vue'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useItemsStore} from '@/stores/items'
import {useI18n} from 'vue-i18n'
import axios from 'axios'

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

    let params = [
      {
        name: 'filesize',
        text: t('settings_labels.appearance.filesize'),
        icon: 'harddisk',
        types: ['media'],
        show: SETTINGS.value.show_default_meta_filesize === '1',
        value: $readable.getReadableFileSize(item.filesize),
      },
      {
        name: 'duration',
        text: t('settings_labels.appearance.duration'),
        icon: 'clock-outline',
        types: ['media'],
        media_type_id: [1],
        show: SETTINGS.value.show_default_meta_duration === '1',
        value: $readable.getReadableDuration(item.duration),
      },
      {
        name: 'resolution',
        text: t('settings_labels.appearance.resolution'),
        icon: 'monitor-screenshot',
        types: ['media'],
        media_type_id: [1],
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
        media_type_id: [1],
        show: SETTINGS.value.show_default_meta_codec === '1',
      },
      {
        name: 'bitrate',
        text: t('settings_labels.appearance.bitrate'),
        icon: 'filmstrip',
        types: ['media'],
        media_type_id: [1],
        show: SETTINGS.value.show_default_meta_bitrate === '1',
        value: $readable.getReadableBitrate(item.bitrate),
      },
      {
        name: 'fps',
        text: t('settings_labels.appearance.framerate'),
        icon: 'filmstrip',
        types: ['media'],
        show: SETTINGS.value.show_default_meta_fps === '1',
        media_type_id: [1],
      },
      {
        name: 'numberOfMedia',
        text: t('media.type_names.video'),
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
        // Проверка типа
        if (type !== props.type) return false

        // Если есть media_type_id, проверяем его
        if (param.media_type_id?.length > 0) {
          const currentMediaTypeId = ENV.value?.media_type_id
          return param.media_type_id.includes(currentMediaTypeId)
        }

        // Если media_type_id нет - тип совпал, возвращаем true
        return true
      })
    }).filter((i) => {
      return item[i.name] !== '' && item[i.name] !== null
    })
  })

  // Methods
  const countMediaInTag = () => {
    let url = `/api/media/numberOfMediaWithTag?mediaTypeId=1&tagId=${props.item?.id}`
    axios
      .get(appStore.localhost + url)
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