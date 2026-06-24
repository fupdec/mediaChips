import {computed} from 'vue'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {sortPinnedAssignmentItems} from '@/utils/pinnedMetaOrder'

export function useMetaAssignment() {
  const apiUrl = computed(() => useAppStore().localhost)

  const fetchPinnedMediaForMeta = async (metaId) => {
    const response = await axios.get(`${apiUrl.value}/api/MetaInMediaType?metaId=${metaId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchPinnedMetaForMediaType = async (mediaTypeId) => {
    const response = await axios.get(`${apiUrl.value}/api/MetaInMediaType?mediaTypeId=${mediaTypeId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchPinnedChildMeta = async (metaId) => {
    const response = await axios.get(`${apiUrl.value}/api/PinnedMeta?metaId=${metaId}`)
    return sortPinnedAssignmentItems(response.data || [])
  }

  const fetchAllMeta = async () => {
    const response = await axios.get(`${apiUrl.value}/api/Meta`)
    return response.data || []
  }

  const pinMetaToMediaType = async (metaId, mediaTypeId, order = 0) => {
    await axios.post(`${apiUrl.value}/api/MetaInMediaType`, {metaId, mediaTypeId, order})
  }

  const unpinMetaFromMediaType = async (metaId, mediaTypeId) => {
    await axios.delete(
      `${apiUrl.value}/api/MetaInMediaType?mediaTypeId=${mediaTypeId}&metaId=${metaId}`
    )
  }

  const updateMetaInMediaTypeOrder = async (metaId, mediaTypeId, order) => {
    await axios.put(`${apiUrl.value}/api/MetaInMediaType`, {
      metaId,
      mediaTypeId,
      data: {order},
    })
  }

  const pinChildMeta = async (metaId, pinnedMetaId, order = 0) => {
    await axios.post(`${apiUrl.value}/api/PinnedMeta`, {metaId, pinnedMetaId, order})
  }

  const unpinChildMeta = async (metaId, pinnedMetaId) => {
    await axios.delete(`${apiUrl.value}/api/PinnedMeta/${pinnedMetaId}?metaId=${metaId}`)
  }

  const updateChildMetaOrder = async (metaId, pinnedMetaId, order) => {
    await axios.put(`${apiUrl.value}/api/PinnedMeta`, {
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
