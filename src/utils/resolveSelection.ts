import { apiClient } from '@/services/apiClient'
import { useItemsStore } from '@/stores/items'
import type { MediaItem } from '@/types/stores'

export async function resolveSelectedMediaItems(ids: number[] = []): Promise<MediaItem[]> {
  const itemsStore = useItemsStore()
  const itemsById = new Map(itemsStore.entities.map((entry) => [entry.id, entry]))
  const missingIds = ids.filter((id) => !itemsById.has(id))

  if (missingIds.length) {
    const response = await apiClient.post<{ items?: MediaItem[] }>('/api/media/basics', { ids: missingIds })
    for (const entry of response.data.items || []) {
      itemsById.set(entry.id, entry)
    }
  }

  return ids.map((id) => itemsById.get(id)).filter((item): item is MediaItem => Boolean(item))
}

export function shouldReloadListAfterBulkAction(selectedIds: number[] = []): boolean {
  const itemsStore = useItemsStore()

  if (!selectedIds.length) return false

  return selectedIds.length > itemsStore.itemsOnPage.length
    || selectedIds.some((id) => !itemsStore.entities.find((entry) => entry.id === id))
}
