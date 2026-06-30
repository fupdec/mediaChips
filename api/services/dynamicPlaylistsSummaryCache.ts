const SUMMARY_TTL_MS = 45_000

interface TimedSummary {
  expiresAt: number
  value: unknown
}

let cachedSummary: TimedSummary | null = null
let cachedMediaTypeId: number | null = null

export function getCachedDynamicPlaylistsSummary(mediaTypeId: number): unknown | null {
  if (!cachedSummary || cachedMediaTypeId !== mediaTypeId) return null
  if (cachedSummary.expiresAt <= Date.now()) {
    cachedSummary = null
    cachedMediaTypeId = null
    return null
  }
  return cachedSummary.value
}

export function setCachedDynamicPlaylistsSummary(mediaTypeId: number, value: unknown): void {
  cachedMediaTypeId = mediaTypeId
  cachedSummary = {
    value,
    expiresAt: Date.now() + SUMMARY_TTL_MS,
  }
}

export function clearDynamicPlaylistsSummaryCache(): void {
  cachedSummary = null
  cachedMediaTypeId = null
}
