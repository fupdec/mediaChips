import { normalizePastedFilePath } from '@/utils/filePathInput'

function getDroppedFilePath(file: File & { path?: string }): string {
  if (!file) return ''

  const fromElectron = window.electronAPI?.getPathForFile?.(file)
  if (fromElectron) return String(normalizePastedFilePath(fromElectron))

  return String(normalizePastedFilePath(file.path || ''))
}

function getDroppedFilesFromEvent(event: DragEvent | null | undefined): File[] {
  const files: File[] = []
  const seen = new Set<File>()

  for (const file of Array.from(event?.dataTransfer?.files || [])) {
    if (!file || seen.has(file)) continue
    seen.add(file)
    files.push(file)
  }

  if (!files.length) {
    for (const item of Array.from(event?.dataTransfer?.items || [])) {
      if (item.kind !== 'file') continue
      const file = item.getAsFile()
      if (!file || seen.has(file)) continue
      seen.add(file)
      files.push(file)
    }
  }

  return files
}

function collapseNestedDroppedPaths(paths: string[]): string[] {
  const normalized = [...new Set(paths.filter(Boolean))]
  if (normalized.length <= 1) return normalized

  const isNestedIn = (path: string, parent: string): boolean => {
    if (path === parent) return false
    const prefix = parent.endsWith('\\') || parent.endsWith('/') ? parent : `${parent}\\`
    const altPrefix = `${parent}/`
    return path.startsWith(prefix) || path.startsWith(altPrefix)
  }

  const roots = normalized.filter((path) =>
    !normalized.some((other) => isNestedIn(path, other)),
  )

  return roots.length ? roots : normalized
}

export function collectDroppedPaths(event: DragEvent | null | undefined): string[] {
  const paths = getDroppedFilesFromEvent(event)
    .map((file) => getDroppedFilePath(file))
    .filter(Boolean)

  return collapseNestedDroppedPaths(paths)
}

interface MediaAddingStore {
  mediaAdding: {
    media_type_id: number
    directFiles: unknown[]
    skipFileScan: boolean
    paths: string
    dialogProcess: boolean
    active: boolean
  }
}

interface EventBusLike {
  emit: (event: string, ...args: unknown[]) => void
}

export function startDroppedMediaAdding({
  paths,
  mediaTypeId,
  tasksStore,
  eventBus,
}: {
  paths: string[]
  mediaTypeId: number | string
  tasksStore: MediaAddingStore
  eventBus: EventBusLike
}): boolean {
  if (!paths.length || !mediaTypeId) return false

  tasksStore.mediaAdding.media_type_id = Number(mediaTypeId)
  tasksStore.mediaAdding.directFiles = []
  tasksStore.mediaAdding.skipFileScan = false
  tasksStore.mediaAdding.paths = paths.join('\n')
  tasksStore.mediaAdding.dialogProcess = true
  tasksStore.mediaAdding.active = true
  eventBus.emit('addMedia')

  return true
}
