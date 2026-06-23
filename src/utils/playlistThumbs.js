import axios from 'axios'
import {useAppStore} from '@/stores/app'

export async function loadPlaylistThumbs(playlists, {mediaType = 'videos'} = {}) {
  const appStore = useAppStore()
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
    const response = await axios.post(`${appStore.localhost}/api/Media/thumbs`, {
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
