import { defineStore } from 'pinia'

export const useToolbarStore = defineStore('useToolbarStore', {
  state: () => ({
    show: false,
    sort: { show: false, type: 'media' },
    appearance: { show: false },
  }),
  actions: {
    updateSort(updates) {
      Object.assign(this.sort, updates)
    },

    toggleSort() {
      this.sort.show = !this.sort.show
    },

    toggleAppearance() {
      this.appearance.show = !this.appearance.show
    },
  },
})

export default useToolbarStore
