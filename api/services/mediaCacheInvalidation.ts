import { clearDynamicPlaylistsSummaryCache } from './dynamicPlaylistsSummaryCache'
import { clearMediaListTotalsCache } from './mediaListTotalsCache'
import { terminateFilterItemsWorker } from './filterItemsWorkerRunner'

export function invalidateMediaDerivedCaches(): void {
  clearMediaListTotalsCache()
  clearDynamicPlaylistsSummaryCache()
  terminateFilterItemsWorker()
}
