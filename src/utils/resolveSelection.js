import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'

export async function resolveSelectedMediaItems(ids = []) {
  const appStore = useAppStore()
  const itemsStore = useItemsStore()
  const itemsById = new Map(itemsStore.entities.map((entry) => [entry.id, entry]))
  const missingIds = ids.filter((id) => !itemsById.has(id))

  if (missingIds.length) {
    const response = await axios.post(`${appStore.localhost}/api/media/basics`, {ids: missingIds})
    for (const entry of response.data.items || []) {
      itemsById.set(entry.id, entry)
    }
  }

  return ids.map((id) => itemsById.get(id)).filter(Boolean)
}

export function shouldReloadListAfterBulkAction(selectedIds = []) {
  const itemsStore = useItemsStore()

  if (!selectedIds.length) return false

  return selectedIds.length > itemsStore.itemsOnPage.length
    || selectedIds.some((id) => !itemsStore.entities.find((entry) => entry.id === id))
}
