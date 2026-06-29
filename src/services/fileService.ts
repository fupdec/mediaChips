import path from 'path-browserify'
import { normalizePastedFilePath } from '@/utils/filePathInput'
import { getApiBaseUrl } from '@/services/apiClient'
import { typedApi } from '@/services/typedApi'
import { checkFileExistsElectron, isElectron } from '@/services/electronBridge'

const NEGATIVE_CACHE_TTL_MS = 60_000
const negativeCache = new Map<string, number>()

function getUnavailableVolumeRoot(filePath: string) {
  if (!isElectron()) return null

  const normalized = filePath.replace(/\\/g, '/')
  const volumesMatch = normalized.match(/^\/Volumes\/([^/]+)(?:\/|$)/i)
  if (!volumesMatch) return null

  return `/Volumes/${volumesMatch[1]}`
}

function getCachedNegativeResult(filePath: string) {
  const expiresAt = negativeCache.get(filePath)
  if (!expiresAt) return null
  if (Date.now() >= expiresAt) {
    negativeCache.delete(filePath)
    return null
  }
  return false
}

function rememberNegativeResult(filePath: string) {
  negativeCache.set(filePath, Date.now() + NEGATIVE_CACHE_TTL_MS)
}

export async function checkFileExists(filePath: string) {
  const normalized = normalizePastedFilePath(filePath)
  filePath = typeof normalized === 'string' ? normalized : filePath
  if (!filePath) return false

  const cachedNegative = getCachedNegativeResult(filePath)
  if (cachedNegative === false) return false

  const volumeRoot = getUnavailableVolumeRoot(filePath)
  if (volumeRoot && volumeRoot !== filePath) {
    const volumeExists = await checkFileExistsElectron(volumeRoot)
    if (volumeExists === false) {
      rememberNegativeResult(filePath)
      return false
    }
  }

  const electronResult = await checkFileExistsElectron(filePath)
  if (electronResult !== null) {
    if (!electronResult) rememberNegativeResult(filePath)
    return electronResult
  }

  if (!getApiBaseUrl()) return false

  try {
    const response = await typedApi.checkFileExists(filePath)
    const exists = response.data?.exists === true
    if (!exists) rememberNegativeResult(filePath)
    return exists
  } catch {}

  try {
    const response = await typedApi.resolvePath(filePath)
    const exists = Boolean(response.data?.exists)
    if (!exists) rememberNegativeResult(filePath)
    return exists
  } catch {
    rememberNegativeResult(filePath)
    return false
  }
}

export async function getLocalImage(imgPath: string, outside?: boolean, cacheBust = false) {
  try {
    const res = await typedApi.getFileBlob({
      url: imgPath,
      outside,
      ...(cacheBust ? { _t: Date.now() } : {}),
    })
    return URL.createObjectURL(res.data)
  } catch {
    return path.join('/', 'images/unavailable.png')
  }
}

export async function createThumb(
  timestamp: number,
  inputPath: string,
  outputPath: string,
  width: number,
  overwrite?: boolean,
) {
  return typedApi.createThumb({
    timestamp,
    inputPath,
    outputPath,
    width,
    overwrite,
  })
}

export async function deleteLocalFile(filePath: string) {
  return typedApi.deleteLocalFile(filePath)
}

export async function createImage(
  image: string,
  outputPath: string,
  sizes: unknown,
) {
  let url: string | null = null
  const base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

  const image_string = image?.length > 100 ? image.substring(0, 99) : null

  if (image_string && !base64regex.test(image_string) && image.includes('http')) {
    url = image
  }

  return typedApi.createImage({
    image,
    outputPath,
    url,
    sizes,
  })
}
