import { showElectronOpenDialog } from '@/services/electronBridge'

export type { OpenDialogResult } from '@/services/electronBridge'

export async function showOpenDialog(properties: string[] | string | Record<string, boolean> | null) {
  try {
    const result = await showElectronOpenDialog(properties)

    if (!result) {
      console.error('electronAPI не доступен')
      return
    }

    if (result.canceled) {
      return ''
    }

    if (result.error) {
      console.error('Ошибка в результате:', result.message)
      return ''
    }

    if (result.filePaths?.length) {
      return result.filePaths.join('\n')
    }
  } catch (error) {
    const err = error as Error
    console.error('Ошибка в showOpenDialog:', error)
    console.error('Стек ошибки:', err.stack)
  }

  return ''
}
