export async function showOpenDialog(properties) {
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

    let dialogProperties = []

    if (Array.isArray(properties)) {
      dialogProperties = properties
    } else if (typeof properties === 'string') {
      dialogProperties = [properties]
    } else if (typeof properties === 'object' && properties !== null) {
      dialogProperties = Object.keys(properties).filter((key) => properties[key] === true)
    }

    const result = await window.electronAPI.invoke('showOpenDialog', dialogProperties)

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

    if (result.filePaths?.length > 0) {
      resultPaths = result.filePaths.join('\n')
    }
  } catch (error) {
    console.error('Ошибка в showOpenDialog:', error)
    console.error('Стек ошибки:', error.stack)
  }

  return resultPaths
}
