import {defineStore} from 'pinia'

export const useImageViewerStore = defineStore('imageViewer', {
  state: () => ({
    active: false,
    images: [],
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
      return state.images[state.index] || null
    },
    hasPrev(state) {
      return state.index > 0
    },
    hasNext(state) {
      return state.index < state.images.length - 1
    },
    counter(state) {
      if (!state.images.length) return ''
      return `${state.index + 1} / ${state.images.length}`
    },
  },

  actions: {
    open({images, index = 0}) {
      this.images = images
      this.index = Math.min(Math.max(index, 0), Math.max(images.length - 1, 0))
      this.active = true
      this.isFileExists = true
      this.resetTransform()
    },

    close() {
      this.active = false
      this.fullscreen = false
      this.images = []
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
