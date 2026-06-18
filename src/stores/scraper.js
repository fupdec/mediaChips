import { defineStore } from 'pinia'
import _ from 'lodash'
import axios from 'axios'

const SCRAPER_API_BASE_URL = import.meta.env.VITE_SCRAPER_API_URL || 'https://mediachips.app/wp-json/mediachips/v1/scraper'

export const useScraperStore = defineStore('useScraperStore', {
  state: () => ({
    query: '',
    scraperApiBaseUrl: SCRAPER_API_BASE_URL,
    currentValues: {},
    fields: [],
    pinned: [],
  }),
  actions: {
    async searchPerformer({ page = 1, query } = {}) {
      const q = query || this.query

      try {
        const res = await axios.get(`${this.scraperApiBaseUrl}/performers`, {
          params: {
            gender: 'Female',
            page,
            q,
          },
        })
        return res.data
      } catch (e) {
        console.error('searchPerformer error', e)
        return null
      }
    },
    async getOnePerformerByQueryString(query) {
      const result = await this.searchPerformer({ page: 1, query })
      if (!result) return null
      const slug = query.toLowerCase().replaceAll(' ', '-')
      const matched = result.data.find(i => i.slug === slug)
      if (matched) return matched
      const sorted = _.orderBy(result.data, (i) => i.posters?.length || 0, 'desc')
      return sorted[0] || null
    },
    async updateInfoOfPerformer({ metaId, pinnedMetaId } = {}) {
      const performer = await this.getOnePerformerByQueryString()
      console.log('performer', performer)
      // further logic to update meta in DB can go here
    }
  }
})

export default useScraperStore
