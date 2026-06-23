import {defineStore} from 'pinia'
import {useItemsStore} from '@/stores/items'

export const useImageViewerStore = defineStore('imageViewer', {
  state: () => ({
    active: false,
    imageIds: [],
    fallbackImage: null,
    previewSrc: null,
    index: 0,
    fullscreen: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
    loading: false,
    src: null,
    isFileExists: true,
  }),

  getters: {
    currentImage(state) {
      const id = state.imageIds[state.index]
      if (id == null) return state.fallbackImage

      const itemsStore = useItemsStore()
      const image = itemsStore.resolveMediaById(id)

      if (image) return image
      if (state.fallbackImage?.id === id) return state.fallbackImage

      return null
    },
    hasPrev(state) {
      return state.index > 0
    },
    hasNext(state) {
      return state.index < state.imageIds.length - 1
    },
    counter(state) {
      if (!state.imageIds.length) return ''
      return `${state.index + 1} / ${state.imageIds.length}`
    },
  },

  actions: {
    open({imageIds, index = 0, fallbackImage = null, previewSrc = null}) {
      this.imageIds = imageIds
      this.fallbackImage = fallbackImage
      this.previewSrc = previewSrc
      this.index = Math.min(Math.max(index, 0), Math.max(imageIds.length - 1, 0))
      this.active = true
      this.isFileExists = true
      this.resetTransform()
    },

    setPlaylist(imageIds, index) {
      if (!imageIds?.length) return

      this.imageIds = imageIds
      this.index = Math.min(Math.max(index, 0), Math.max(imageIds.length - 1, 0))
    },

    close() {
      this.active = false
      this.fullscreen = false
      this.imageIds = []
      this.fallbackImage = null
      this.previewSrc = null
      this.index = 0
      this.loading = false
      this.src = null
      this.isFileExists = true
      this.resetTransform()
    },

    resetTransform() {
      this.scale = 1
      this.translateX = 0
      this.translateY = 0
    },

    setSrc(src) {
      this.src = src
    },

    setLoading(loading) {
      this.loading = loading
    },

    setFileExists(exists) {
      this.isFileExists = exists
    },

    next() {
      if (!this.hasNext) return false
      this.index += 1
      this.resetTransform()
      return true
    },

    prev() {
      if (!this.hasPrev) return false
      this.index -= 1
      this.resetTransform()
      return true
    },

    zoomIn() {
      this.scale = Math.min(this.scale * 1.25, 8)
    },

    zoomOut() {
      this.scale = Math.max(this.scale / 1.25, 0.2)
    },

    toggleFullscreen() {
      this.fullscreen = !this.fullscreen
    },
  },
})

export default useImageViewerStore
