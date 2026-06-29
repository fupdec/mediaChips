import { defineStore } from 'pinia'
import _ from 'lodash'
import { searchScraperPerformers } from '@/services/scraperApi'
import type { ScraperPerformer, ScraperTransferField, ScraperPinnedItem } from '@/types/scraper'

const SCRAPER_API_BASE_URL = import.meta.env.VITE_SCRAPER_API_URL || 'https://mediachips.app/wp-json/mediachips/v1/scraper'

export const useScraperStore = defineStore('useScraperStore', {
  state: () => ({
    query: '',
    scraperApiBaseUrl: SCRAPER_API_BASE_URL,
    currentValues: {} as Record<string, unknown>,
    fields: [] as ScraperTransferField[],
    pinned: [] as ScraperPinnedItem[],
  }),
  actions: {
    async searchPerformer({ page = 1, query }: { page?: number; query?: string } = {}) {
      const q = query || this.query
      return searchScraperPerformers(this.scraperApiBaseUrl, {
        gender: 'Female',
        page,
        q,
      })
    },
    async getOnePerformerByQueryString(query: string) {
      const result = await this.searchPerformer({ page: 1, query })
      if (!result) return null
      const slug = query.toLowerCase().replaceAll(' ', '-')
      const matched = result.data?.find((performer: ScraperPerformer) => performer.slug === slug)
      if (matched) return matched
      const sorted = _.orderBy(result.data || [], (performer: ScraperPerformer) => performer.posters?.length || 0, 'desc')
      return sorted[0] || null
    },
    async updateInfoOfPerformer(_params: { metaId?: number; pinnedMetaId?: number } = {}) {
      const performer = await this.getOnePerformerByQueryString(this.query)
      console.log('performer', performer)
    },
  },
})

export default useScraperStore
