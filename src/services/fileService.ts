import path from 'path-browserify'
import { normalizePastedFilePath } from '@/utils/filePathInput'
import { apiClient, getApiBaseUrl } from '@/services/apiClient'

async function checkFileExistsViaElectron(filePath: string): Promise<boolean | null> {
  if (typeof window === 'undefined') return null

  const electronOperable = (window as Window & {
    $electronOperable?: { checkFileExists?: (path: string) => Promise<boolean> }
    operableAPI?: { checkFileExists?: (path: string) => Promise<boolean> }
  })

  if (electronOperable.$electronOperable?.checkFileExists) {
    const exists = await electronOperable.$electronOperable.checkFileExists(filePath)
    if (exists) return true
  }

  if (electronOperable.operableAPI?.checkFileExists) {
    const exists = await electronOperable.operableAPI.checkFileExists(filePath)
    if (exists) return true
  }

  return null
}

export async function checkFileExists(filePath: string) {
  const normalized = normalizePastedFilePath(filePath)
  filePath = typeof normalized === 'string' ? normalized : filePath
  if (!filePath) return false

  const electronResult = await checkFileExistsViaElectron(filePath)
  if (electronResult === true) return true

  if (!getApiBaseUrl()) return false

  try {
    const response = await apiClient.post('/api/Task/checkFileExists', {
      path: filePath,
    })
    if (response.status === 200 || response.status === 201) {
      return true
    }
  } catch {}

  try {
    const response = await apiClient.post<{ exists?: boolean }>('/api/resolve-path', { filePath })
    return Boolean(response.data?.exists)
  } catch {
    return false
  }
}

export async function getLocalImage(imgPath: string, outside?: boolean, cacheBust = false) {
  try {
    const res = await apiClient.post<Blob>(
      '/api/get-file',
      {
        url: imgPath,
        outside,
        ...(cacheBust ? { _t: Date.now() } : {}),
      },
      { responseType: 'blob' },
    )
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
  return apiClient.post('/api/Task/createThumb', {
    timestamp,
    inputPath,
    outputPath,
    width,
    overwrite,
  })
}

export async function deleteLocalFile(filePath: string) {
  return apiClient.post('/api/Task/deleteFile', {
    path: filePath,
  })
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

  return apiClient.post('/api/Task/createImage', {
    image,
    outputPath,
    url,
    sizes,
  })
}
