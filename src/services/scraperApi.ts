import { apiClient } from '@/services/apiClient'
import { parseScraperPerformerSearchResponse } from '@/schemas/scraper'
import type { ScraperPerformerSearchResponse } from '@/types/scraper'

export async function searchScraperPerformers(
  baseUrl: string,
  params: { gender?: string; page?: number; q?: string },
): Promise<ScraperPerformerSearchResponse | null> {
  try {
    const response = await apiClient.get(`${baseUrl}/performers`, { params })
    return parseScraperPerformerSearchResponse(response.data)
  } catch (error) {
    console.error('searchScraperPerformers error', error)
    return null
  }
}
