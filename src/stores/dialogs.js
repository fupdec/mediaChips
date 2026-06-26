import {defineStore} from 'pinia'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {getCurrentMediaType} from '@/utils/mediaType'
import {BASE_MARK_TYPES, findAssignedMeta, isMetaMarkType, normalizeMarkTime} from '@/utils/markAdding'

export const useDialogsStore = defineStore('useDialogsStore', {
  state: () => ({
    documentation: false,
    feedback: false,
    versions: false,
    mediaEditing: {show: false, media: null, mediaType: {type: null}},
    tagEditing: {show: false, tag: null, meta: null, assigned: null, values: null},
    bulkEditingItems: false,
    markAdding: {
      show: false,
      type: 'favorite',
      meta: {},
      time: null,
      end: null,
      color: '#e91e63',
      is_end_time_active: false,
      submitting: false,
    },
    error: {show: false, text: null},
    confirm: {show: false, text: null, action: null, checkBox: false, checkBoxText: ''},
    playlistAdd: {show: false, mediaIds: []},
    process: {show: false, text: null},
    tabEditing: {show: false, tab: null},
    about: {show: false},
    scraperConfig: {show: false},
    scraper: {show: false, images: []},
    scraperMultiple: {show: false, performers: [], progress: 0},
  }),
  actions: {
    editMedia(media, mediaType = null) {
      const appStore = useAppStore()
      const itemsStore = useItemsStore()
      const resolvedMediaType = mediaType || getCurrentMediaType(
        appStore.mediaTypes,
        media?.mediaTypeId || itemsStore.environment?.media_type_id,
      )

      this.$patch({
        mediaEditing: {
          show: true,
          media: media ? {...media} : null,
          mediaType: resolvedMediaType || {type: null},
        },
      })
    },
    editTag(tag, meta) {
      this.tagEditing.tag = tag
      this.tagEditing.meta = meta
      this.tagEditing.show = true
    },
    editTab(tab) {
      this.tabEditing.tab = tab
      this.tabEditing.show = true
    },
    showAbout() {
      this.about.show = true
    },
    createPlaylistForMedia(mediaIds) {
      this.playlistAdd.mediaIds = Array.isArray(mediaIds) ? mediaIds : [mediaIds]
      this.playlistAdd.show = true
    },
    closePlaylistAdd() {
      this.playlistAdd.show = false
      this.playlistAdd.mediaIds = []
    },
    openMarkAdding({time = 0, type = 'favorite'} = {}) {
      const normalizedType = type || 'favorite'
      const preset = BASE_MARK_TYPES.find((item) => item.value === normalizedType)

      this.markAdding.time = normalizeMarkTime(time)
      this.markAdding.type = normalizedType
      this.markAdding.end = null
      this.markAdding.is_end_time_active = false
      this.markAdding.submitting = false
      this.markAdding.meta = {}
      this.markAdding.color = preset?.color || '#fff'

      if (isMetaMarkType(normalizedType)) {
        const itemsStore = useItemsStore()
        const found = findAssignedMeta(itemsStore.assigned, normalizedType)
        if (found?.meta) {
          this.markAdding.meta = found.meta
        }
      }

      this.markAdding.show = true
    },
    closeMarkAdding() {
      this.markAdding.show = false
      this.markAdding.submitting = false
    },
    setMarkAddingSubmitting(value) {
      this.markAdding.submitting = value
    },
  }
})

export default useDialogsStore
