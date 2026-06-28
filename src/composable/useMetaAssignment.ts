import { apiClient } from '@/services/apiClient'
import { sortPinnedAssignmentItems } from '@/utils/pinnedMetaOrder'
import type { AssignedMeta } from '@/types/stores'

export function useMetaAssignment() {
  const fetchPinnedMediaForMeta = async (metaId: number) => {
    const response = await apiClient.get<AssignedMeta[]>(`/api/MetaInMediaType?metaId=${metaId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchPinnedMetaForMediaType = async (mediaTypeId: number) => {
    const response = await apiClient.get<AssignedMeta[]>(`/api/MetaInMediaType?mediaTypeId=${mediaTypeId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchPinnedChildMeta = async (metaId: number) => {
    const response = await apiClient.get<AssignedMeta[]>(`/api/PinnedMeta?metaId=${metaId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchAllMeta = async () => {
    const response = await apiClient.get('/api/Meta')
    return response.data || []
  }

  const pinMetaToMediaType = async (metaId: number, mediaTypeId: number, order = 0) => {
    await apiClient.post('/api/MetaInMediaType', { metaId, mediaTypeId, order })
  }

  const unpinMetaFromMediaType = async (metaId: number, mediaTypeId: number) => {
    await apiClient.delete(
      `/api/MetaInMediaType?mediaTypeId=${mediaTypeId}&metaId=${metaId}`,
    )
  }

  const updateMetaInMediaTypeOrder = async (metaId: number, mediaTypeId: number, order: number) => {
    await apiClient.put('/api/MetaInMediaType', {
      metaId,
      mediaTypeId,
      data: { order },
    })
  }

  const pinChildMeta = async (metaId: number, pinnedMetaId: number, order = 0) => {
    await apiClient.post('/api/PinnedMeta', { metaId, pinnedMetaId, order })
  }

  const unpinChildMeta = async (metaId: number, pinnedMetaId: number) => {
    await apiClient.delete(`/api/PinnedMeta/${pinnedMetaId}?metaId=${metaId}`)
  }

  const updateChildMetaOrder = async (metaId: number, pinnedMetaId: number, order: number) => {
    await apiClient.put('/api/PinnedMeta', {
      metaId,
      pinnedMetaId,
      data: { order },
    })
  }

  return {
    fetchPinnedMediaForMeta,
    fetchPinnedMetaForMediaType,
    fetchPinnedChildMeta,
    fetchAllMeta,
    pinMetaToMediaType,
    unpinMetaFromMediaType,
    updateMetaInMediaTypeOrder,
    pinChildMeta,
    unpinChildMeta,
    updateChildMetaOrder,
  }
}
