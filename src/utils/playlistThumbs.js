import {apiClient} from '@/services/apiClient'

export async function loadPlaylistThumbs(playlists, {mediaType = 'videos'} = {}) {
  const previewIds = [...new Set(
    playlists.flatMap((playlist) => (playlist.previewIds || []).slice(0, 4)),
  )]

  if (!previewIds.length) {
    for (const playlist of playlists) {
      playlist.thumbs = []
    }
    return
  }

  try {
    const response = await apiClient.post('/api/Media/thumbs', {
      ids: previewIds,
      mediaType,
    })
    const thumbsById = response.data?.thumbs || {}

    for (const playlist of playlists) {
      playlist.thumbs = (playlist.previewIds || [])
        .slice(0, 4)
        .map((id) => thumbsById[id])
        .filter(Boolean)
    }
  } catch (error) {
    console.log('Error loading playlist thumbs:', error)
    for (const playlist of playlists) {
      playlist.thumbs = []
    }
  }
}
