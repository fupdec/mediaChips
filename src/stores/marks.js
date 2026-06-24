import {defineStore} from 'pinia'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {MARKS_PAGE_LIMIT} from '@/utils/markSort'

export const useMarksStore = defineStore('marks', {
  state: () => ({
    marksOnPage: [],
    filterMetas: [],
    selectedTypes: [],
    sortBy: 'time',
    sortDir: 'desc',
    search: '',
    page: 1,
    total: 0,
    totalFiltered: 0,
    isLoaded: false,
    isLoading: false,
    isLoadingMore: false,
  }),

  getters: {
    hasMore(state) {
      return state.marksOnPage.length < state.totalFiltered
    },
  },

  actions: {
    getDefaultTypes(filterMetas = []) {
      return [
        'favorite',
        'bookmark',
        ...filterMetas.map((meta) => String(meta.id)),
      ]
    },

    async loadFilterMetas() {
      const appStore = useAppStore()
      const response = await axios.get(`${appStore.localhost}/api/Mark/filter-metas`)
      this.filterMetas = response.data || []

      if (!this.selectedTypes.length) {
        this.selectedTypes = this.getDefaultTypes(this.filterMetas)
      }
    },

    async fetchMarks({append = false} = {}) {
      const appStore = useAppStore()

      if (append) {
        if (this.isLoadingMore || !this.hasMore) return
        this.isLoadingMore = true
      } else {
        this.isLoading = true
        this.page = 1
        this.marksOnPage = []
      }

      try {
        const response = await axios.post(`${appStore.localhost}/api/Mark/items`, {
          types: this.selectedTypes,
          sortBy: this.sortBy,
          sortDir: this.sortDir,
          search: this.search,
          page: this.page,
          limit: MARKS_PAGE_LIMIT,
        })

        const items = response.data?.items || []
        this.total = response.data?.total || 0
        this.totalFiltered = response.data?.totalFiltered || 0

        if (append) {
          const existingIds = new Set(this.marksOnPage.map((mark) => mark.id))
          this.marksOnPage = [
            ...this.marksOnPage,
            ...items.filter((mark) => !existingIds.has(mark.id)),
          ]
        } else {
          this.marksOnPage = items
        }

        this.isLoaded = true
      } catch (error) {
        console.error(error)
        if (!append) {
          this.marksOnPage = []
          this.total = 0
          this.totalFiltered = 0
          this.isLoaded = true
        }
      } finally {
        this.isLoading = false
        this.isLoadingMore = false
      }
    },

    async reloadMarks() {
      this.page = 1
      await this.fetchMarks()
    },

    async setSelectedTypes(types) {
      this.selectedTypes = types
      await this.reloadMarks()
    },

    async setSortBy(sortBy) {
      this.sortBy = sortBy
      await this.reloadMarks()
    },

    async setSortDir(sortDir) {
      this.sortDir = sortDir
      await this.reloadMarks()
    },

    async setSearch(search) {
      this.search = search
      await this.reloadMarks()
    },

    async loadNextPage() {
      if (!this.hasMore || this.isLoading || this.isLoadingMore) return

      this.page += 1
      await this.fetchMarks({append: true})
    },
  },
})
