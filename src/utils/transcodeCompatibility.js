const DIRECT_VIDEO_CONTAINERS = new Set(['.mp4', '.m4v', '.webm'])

export function isLikelyBrowserDirectVideo(filePath) {
  if (!filePath) return false

  const dotIndex = filePath.lastIndexOf('.')
  if (dotIndex < 0) return false

  const extension = filePath.slice(dotIndex).toLowerCase()
  return DIRECT_VIDEO_CONTAINERS.has(extension)
}
