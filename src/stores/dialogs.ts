import { defineStore } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useItemsStore } from '@/stores/items'
import { getCurrentMediaType } from '@/utils/mediaType'
import { BASE_MARK_TYPES, findAssignedMeta, isMetaMarkType, normalizeMarkTime } from '@/utils/markAdding'
import type { MediaItem, Meta, Tag } from '@/types/stores'
import type { MediaType } from '@/types/media'

export const useDialogsStore = defineStore('useDialogsStore', {
  state: () => ({
    documentation: false,
    feedback: false,
    versions: false,
    mediaEditing: { show: false, media: null as MediaItem | null, mediaType: {} as Partial<MediaType> },
    tagEditing: { show: false, tag: null as Tag | null, meta: null as Meta | null, assigned: null as unknown, values: null as unknown },
    bulkEditingItems: false,
    markAdding: {
      show: false,
      type: 'favorite',
      meta: {} as Meta | Record<string, unknown>,
      time: null as number | null,
      end: null as number | null,
      color: '#e91e63',
      is_end_time_active: false,
      submitting: false,
    },
    error: { show: false, text: null as string | null },
    confirm: { show: false, text: null as string | null, action: null as (() => void) | null, checkBox: false, checkBoxText: '' },
    playlistAdd: { show: false, mediaIds: [] as number[] },
    process: { show: false, text: null as string | null },
    tabEditing: { show: false, tab: null as Record<string, unknown> | null },
    about: { show: false },
    scraperConfig: { show: false },
    scraper: { show: false, images: [] as unknown[] },
    scraperMultiple: { show: false, performers: [] as unknown[], progress: 0 },
  }),
  actions: {
    editMedia(media: MediaItem | null, mediaType: MediaType | null = null) {
      const appStore = useAppStore()
      const itemsStore = useItemsStore()
      const resolvedMediaType = mediaType || getCurrentMediaType(
        appStore.mediaTypes,
        media?.mediaTypeId || itemsStore.environment?.media_type_id,
      )

      this.mediaEditing.show = true
      this.mediaEditing.media = media ? { ...media } : null
      this.mediaEditing.mediaType = (resolvedMediaType || {}) as Partial<MediaType>
    },
    editTag(tag: Tag, meta: Meta) {
      this.tagEditing.tag = tag
      this.tagEditing.meta = meta
      this.tagEditing.show = true
    },
    editTab(tab: Record<string, unknown>) {
      this.tabEditing.tab = tab
      this.tabEditing.show = true
    },
    showAbout() {
      this.about.show = true
    },
    createPlaylistForMedia(mediaIds: number | number[]) {
      this.playlistAdd.mediaIds = Array.isArray(mediaIds) ? mediaIds : [mediaIds]
      this.playlistAdd.show = true
    },
    closePlaylistAdd() {
      this.playlistAdd.show = false
      this.playlistAdd.mediaIds = []
    },
    openMarkAdding({ time = 0, type = 'favorite' }: { time?: number; type?: string } = {}) {
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
    setMarkAddingSubmitting(value: boolean) {
      this.markAdding.submitting = value
    },
  },
})

export default useDialogsStore
