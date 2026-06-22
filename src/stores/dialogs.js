import {defineStore} from 'pinia'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {getCurrentMediaType} from '@/utils/mediaType'

export const useDialogsStore = defineStore('useDialogsStore', {
  state: () => ({
    documentation: false,
    feedback: false,
    versions: false,
    mediaEditing: {show: false, media: null, mediaType: {type: null}},
    tagEditing: {show: false, tag: null, meta: null, assigned: null, values: null},
    bulkEditingItems: false,
    markAdding: {show: false, type: 'favorite', meta: {}, time: null, end: null, color: '#fff', is_end_time_active: false},
    error: {show: false, text: null},
    confirm: {show: false, text: null, action: null, checkBox: false, checkBoxText: ''},
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
  }
})

export default useDialogsStore
