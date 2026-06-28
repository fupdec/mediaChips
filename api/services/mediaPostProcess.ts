import type { ApiDb, MediaLike } from '../types/db'
import type {
  MediaId,
  MediaPostProcessorDeps,
  MediaTypeLike,
  ImageMetadataResult,
} from '../types/mediaPostProcess'

const {
  isVideoMediaType,
  isImageMediaType,
  isAudioMediaType,
} = require('../utils/mediaType')

function createMediaPostProcessor({
  db,
  dbPath,
  getVideoMetadata,
  getAudioMetadata,
  getImageMedia,
  createThumbMiddle,
  withTimeout,
}: MediaPostProcessorDeps) {
  async function processVideoMedia(media: MediaLike) {
    const videoPath = String(media.path || '')
    const metadata = await getVideoMetadata(videoPath)

    if (metadata) {
      await db.VideoMetadata.create({
        mediaId: media.id,
        duration: metadata.duration,
        bitrate: metadata.bitrate,
        width: metadata.width,
        height: metadata.height,
        codec: metadata.codec,
        fps: metadata.fps,
      })
    }

    try {
      await createThumbMiddle(videoPath, media.id)
    } catch (error: unknown) {
      console.error(`Thumbnail generation failed for ${videoPath}:`, error)
    }
  }

  async function processImageMedia(media: MediaLike) {
    const imagePath = String(media.path || '')
    const metadata = await withTimeout(
      getImageMedia().getImageMetadata(imagePath),
      60000,
      'image metadata',
    ).catch((error: unknown) => {
      console.error(`Image metadata extraction failed for ${imagePath}:`, error instanceof Error ? error.message : String(error))
      return null
    }) as ImageMetadataResult | null

    if (metadata) {
      await db.ImageMetadata.create({
        mediaId: media.id,
        width: metadata.width,
        height: metadata.height,
        orientation: metadata.orientation,
      })
    }

    try {
      await withTimeout(
        getImageMedia().createImageThumb(imagePath, media.id, dbPath),
        120000,
        'image thumbnail',
      )
    } catch (error: unknown) {
      console.error(`Thumbnail generation failed for ${imagePath}:`, error instanceof Error ? error.message : String(error))
    }
  }

  async function processAudioMedia(media: MediaLike) {
    const audioPath = String(media.path || '')
    const metadata = await getAudioMetadata(audioPath)

    if (metadata) {
      await db.VideoMetadata.create({
        mediaId: media.id,
        duration: metadata.duration,
        bitrate: metadata.bitrate,
        codec: metadata.codec,
      })
    }
  }

  async function processNewMedia(media: MediaLike, mediaType: MediaTypeLike) {
    if (isVideoMediaType(mediaType)) {
      await processVideoMedia(media)
      return
    }

    if (isImageMediaType(mediaType)) {
      await processImageMedia(media)
      return
    }

    if (isAudioMediaType(mediaType)) {
      await processAudioMedia(media)
    }
  }

  async function refreshVideoMedia(mediaId: MediaId, mediaPath: string) {
    const metadata = await getVideoMetadata(mediaPath)

    if (metadata) {
      await db.VideoMetadata.update({
        duration: metadata.duration,
        bitrate: metadata.bitrate,
        width: metadata.width,
        height: metadata.height,
        codec: metadata.codec,
        fps: metadata.fps,
      }, {
        where: {mediaId: mediaId},
      })
    }
  }

  async function refreshImageMedia(mediaId: MediaId, mediaPath: string) {
    const metadata = await getImageMedia().getImageMetadata(mediaPath)

    if (metadata) {
      await db.ImageMetadata.upsert({
        mediaId: mediaId,
        width: metadata.width,
        height: metadata.height,
        orientation: metadata.orientation,
      })
    }

    try {
      await getImageMedia().createImageThumb(mediaPath, mediaId, dbPath)
    } catch (error: unknown) {
      console.error(`Thumbnail regeneration failed for media ${mediaId}:`, error instanceof Error ? error.message : String(error))
    }
  }

  async function refreshAudioMedia(mediaId: MediaId, mediaPath: string) {
    const metadata = await getAudioMetadata(mediaPath)

    if (metadata) {
      await db.VideoMetadata.upsert({
        mediaId: mediaId,
        duration: metadata.duration,
        bitrate: metadata.bitrate,
        codec: metadata.codec,
      })
    }
  }

  async function refreshMediaInfo(media: MediaLike, mediaType: MediaTypeLike) {
    const mediaPath = String((media as { dataValues?: { path?: string } }).dataValues?.path ?? media.path ?? '')
    const mediaId = media.id as MediaId

    if (isVideoMediaType(mediaType)) {
      await refreshVideoMedia(mediaId, mediaPath)
      return
    }

    if (isImageMediaType(mediaType)) {
      await refreshImageMedia(mediaId, mediaPath)
      return
    }

    if (isAudioMediaType(mediaType)) {
      await refreshAudioMedia(mediaId, mediaPath)
    }
  }

  return {
    processNewMedia,
    refreshMediaInfo,
  }
}

module.exports = {
  createMediaPostProcessor,
}
