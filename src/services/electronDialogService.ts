interface OpenDialogResult {
  canceled?: boolean
  error?: boolean
  message?: string
  filePaths?: string[]
}

export async function showOpenDialog(properties: string[] | string | Record<string, boolean> | null) {
  let resultPaths = ''

  try {
    if (!window.electronAPI) {
      console.error('electronAPI не доступен')
      return
    }

    if (!window.electronAPI.invoke) {
      console.error('electronAPI.invoke не доступен')
      return
    }

    let dialogProperties: string[] = []

    if (Array.isArray(properties)) {
      dialogProperties = properties
    } else if (typeof properties === 'string') {
      dialogProperties = [properties]
    } else if (typeof properties === 'object' && properties !== null) {
      dialogProperties = Object.keys(properties).filter((key) => properties[key] === true)
    }

    const result = await window.electronAPI.invoke('showOpenDialog', dialogProperties) as OpenDialogResult | null

    if (!result) {
      console.error('Результат пустой или undefined')
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
      resultPaths = result.filePaths.join('\n')
    }
  } catch (error) {
    const err = error as Error
    console.error('Ошибка в showOpenDialog:', error)
    console.error('Стек ошибки:', err.stack)
  }

  return resultPaths
}
