import {apiClient} from '@/services/apiClient'
import {setNotification} from '@/services/notificationService'

export async function openPath(entryPath, isDirectory) {
  try {
    return await apiClient.post('/api/Task/openPath', {
      path: entryPath,
      isDir: isDirectory,
    })
  } catch (error) {
    const message = error.response?.data?.message || error.message
    setNotification({
      type: 'error',
      title: 'Failed to open path',
      text: message,
    })
    throw error
  }
}
