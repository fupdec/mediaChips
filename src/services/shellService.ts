import { typedApi } from '@/services/typedApi'
import { setNotification } from '@/services/notificationService'

interface AxiosLikeError {
  response?: { data?: { message?: string } }
  message?: string
}

export async function openPath(entryPath: string, isDirectory?: boolean) {
  try {
    return await typedApi.openPath({
      path: entryPath,
      isDir: isDirectory,
    })
  } catch (error) {
    const err = error as AxiosLikeError
    const message = err.response?.data?.message || err.message
    setNotification({
      type: 'error',
      title: 'Failed to open path',
      text: message,
    })
    throw error
  }
}
