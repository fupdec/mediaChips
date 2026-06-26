import {apiClient} from '@/services/apiClient'
import {sortPinnedAssignmentItems} from '@/utils/pinnedMetaOrder'

export function useMetaAssignment() {
  const fetchPinnedMediaForMeta = async (metaId) => {
    const response = await apiClient.get(`/api/MetaInMediaType?metaId=${metaId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchPinnedMetaForMediaType = async (mediaTypeId) => {
    const response = await apiClient.get(`/api/MetaInMediaType?mediaTypeId=${mediaTypeId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchPinnedChildMeta = async (metaId) => {
    const response = await apiClient.get(`/api/PinnedMeta?metaId=${metaId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchAllMeta = async () => {
    const response = await apiClient.get('/api/Meta')
    return response.data || []
  }

  const pinMetaToMediaType = async (metaId, mediaTypeId, order = 0) => {
    await apiClient.post('/api/MetaInMediaType', {metaId, mediaTypeId, order})
  }

  const unpinMetaFromMediaType = async (metaId, mediaTypeId) => {
    await apiClient.delete(
      `/api/MetaInMediaType?mediaTypeId=${mediaTypeId}&metaId=${metaId}`
    )
  }

  const updateMetaInMediaTypeOrder = async (metaId, mediaTypeId, order) => {
    await apiClient.put('/api/MetaInMediaType', {
      metaId,
      mediaTypeId,
      data: {order},
    })
  }

  const pinChildMeta = async (metaId, pinnedMetaId, order = 0) => {
    await apiClient.post('/api/PinnedMeta', {metaId, pinnedMetaId, order})
  }

  const unpinChildMeta = async (metaId, pinnedMetaId) => {
    await apiClient.delete(`/api/PinnedMeta/${pinnedMetaId}?metaId=${metaId}`)
  }

  const updateChildMetaOrder = async (metaId, pinnedMetaId, order) => {
    await apiClient.put('/api/PinnedMeta', {
      metaId,
      pinnedMetaId,
      data: {order},
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
