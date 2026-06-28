import { defineStore } from 'pinia'
import _ from 'lodash'
import { apiClient } from '@/services/apiClient'

const SCRAPER_API_BASE_URL = import.meta.env.VITE_SCRAPER_API_URL || 'https://mediachips.app/wp-json/mediachips/v1/scraper'

import type { ScraperTransferField, ScraperPinnedItem } from '@/types/scraper'

interface ScraperPerformer {
  slug?: string
  posters?: unknown[]
  [key: string]: unknown
}

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

      try {
        const res = await apiClient.get<{ data?: ScraperPerformer[] }>(`${this.scraperApiBaseUrl}/performers`, {
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
    async getOnePerformerByQueryString(query: string) {
      const result = await this.searchPerformer({ page: 1, query })
      if (!result) return null
      const slug = query.toLowerCase().replaceAll(' ', '-')
      const matched = result.data?.find((i: ScraperPerformer) => i.slug === slug)
      if (matched) return matched
      const sorted = _.orderBy(result.data || [], (i: ScraperPerformer) => i.posters?.length || 0, 'desc')
      return sorted[0] || null
    },
    async updateInfoOfPerformer(_params: { metaId?: number; pinnedMetaId?: number } = {}) {
      const performer = await this.getOnePerformerByQueryString(this.query)
      console.log('performer', performer)
    },
  },
})

export default useScraperStore
