import path from 'path-browserify'
import {normalizePastedFilePath} from '@/utils/filePathInput'
import {apiClient, getApiBaseUrl} from '@/services/apiClient'

async function checkFileExistsViaElectron(filePath) {
  if (typeof window === 'undefined') return null

  if (window.$electronOperable?.checkFileExists) {
    const exists = await window.$electronOperable.checkFileExists(filePath)
    if (exists) return true
  }

  if (window.operableAPI?.checkFileExists) {
    const exists = await window.operableAPI.checkFileExists(filePath)
    if (exists) return true
  }

  return null
}

export async function checkFileExists(filePath) {
  filePath = normalizePastedFilePath(filePath)
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
    const response = await apiClient.post('/api/resolve-path', {filePath})
    return Boolean(response.data?.exists)
  } catch {
    return false
  }
}

export async function getLocalImage(imgPath, outside) {
  try {
    const res = await apiClient.post(
      '/api/get-file',
      {url: imgPath, outside},
      {responseType: 'blob'},
    )
    return URL.createObjectURL(res.data)
  } catch {
    return path.join('/', 'images/unavailable.png')
  }
}

export async function createThumb(timestamp, inputPath, outputPath, width, overwrite) {
  return apiClient.post('/api/Task/createThumb', {
    timestamp,
    inputPath,
    outputPath,
    width,
    overwrite,
  })
}

export async function deleteLocalFile(filePath) {
  return apiClient.post('/api/Task/deleteFile', {
    path: filePath,
  })
}

export async function createImage(image, outputPath, sizes) {
  let url = null
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
