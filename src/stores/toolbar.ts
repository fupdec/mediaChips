import { defineStore } from 'pinia'

export const useToolbarStore = defineStore('useToolbarStore', {
  state: () => ({
    show: false,
    sort: { show: false, type: 'media' as string },
    appearance: { show: false },
  }),
  actions: {
    updateSort(updates: Partial<{ show: boolean; type: string }>) {
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
