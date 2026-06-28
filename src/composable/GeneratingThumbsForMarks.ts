import {ref, watch, onBeforeUnmount} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useTasksStore} from '@/stores/tasks'
import {useMarksStore} from '@/stores/marks'
import {useEventBus} from '@/utils/eventBus'
import {checkFileExists} from '@/services/fileService'
import {
  ensureMarkThumb,
  getMarkImagePath,
  type EnsureMarkThumbResult,
} from '@/utils/markThumb'
import type { MarkWithMedium } from '@/types/itemsPage'

export default function useMarkImageGenerator() {
  const {t} = useI18n()
  const appStore = useAppStore()
  const tasksStore = useTasksStore()
  const marksStore = useMarksStore()
  const eventBus = useEventBus()

  const active = ref(false)
  const stopped = ref(false)
  const timeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const processedMarkIds = ref(new Set<number>())
  const lastMarksCount = ref(0)

  const getMarkImagePathForMark = (markId: number): string => getMarkImagePath(appStore.mediaPath, markId)

  const getMarksToProcess = (marks: MarkWithMedium[]): MarkWithMedium[] => {
    if (!Array.isArray(marks) || !marks.length) return []

    return marks.filter((mark) => mark?.id && !processedMarkIds.value.has(mark.id))
  }

  const markAsProcessed = (marks: MarkWithMedium[]): void => {
    for (const mark of marks) {
      if (mark?.id) processedMarkIds.value.add(mark.id)
    }
  }

  const resetProcessedMarks = (): void => {
    processedMarkIds.value = new Set()
  }

  const ensureMarkThumbLocal = async (mark: MarkWithMedium): Promise<EnsureMarkThumbResult> => {
    const imgPath = getMarkImagePathForMark(mark.id)
    const thumbExists = await checkFileExists(imgPath)

    if (thumbExists) {
      eventBus.emit('updateMarkImage', mark.id)
      return 'exists'
    }

    const videoPath = mark.medium?.path
    if (!videoPath) return 'skipped'

    const videoExists = await checkFileExists(videoPath)
    if (!videoExists) return 'skipped'

    await ensureMarkThumb({
      mark: {
        id: mark.id,
        type: String(mark.type ?? 'meta'),
        time: Number(mark.time ?? 0),
      },
      videoPath,
      mediaPath: appStore.mediaPath,
      mediaId: mark.medium?.id || mark.mediaId,
      onUpdated: (markId) => eventBus.emit('updateMarkImage', markId),
    })
    return 'created'
  }

  const createMarkThumbs = async (marks: MarkWithMedium[]): Promise<void> => {
    if (active.value || !marks.length) return

    const marksToGenerate: MarkWithMedium[] = []

    for (const mark of marks) {
      const imgPath = getMarkImagePathForMark(mark.id)
      const thumbExists = await checkFileExists(imgPath)

      if (thumbExists) {
        eventBus.emit('updateMarkImage', mark.id)
        continue
      }

      if (!mark.medium?.path) continue

      const videoExists = await checkFileExists(mark.medium.path)
      if (!videoExists) continue

      marksToGenerate.push(mark)
    }

    if (!marksToGenerate.length) return

    active.value = true
    stopped.value = false

    const taskId = tasksStore.setTask({
      title: t('tasks_text.generating_mark_images'),
      icon: 'tooltip-outline',
      action: () => {
        stopped.value = true
      },
    })

    try {
      let completed = 0

      for (const mark of marksToGenerate) {
        if (stopped.value) break

        completed += 1
        tasksStore.updateTask(taskId, {
          subtitle: `${completed} of ${marksToGenerate.length}`,
          progress: (completed / marksToGenerate.length) * 100,
        })

        try {
          await ensureMarkThumbLocal(mark)
        } catch (error) {
          console.error(`Failed to create thumb for mark ${mark.id}:`, error)
        }
      }
    } finally {
      active.value = false
      tasksStore.removeTask(taskId)
    }
  }

  const generateImages = (marks: MarkWithMedium[]): void => {
    if (!Array.isArray(marks)) return

    if (marks.length === 0) {
      resetProcessedMarks()
      lastMarksCount.value = 0
      return
    }

    if (marks.length < lastMarksCount.value) {
      resetProcessedMarks()
    }
    lastMarksCount.value = marks.length

    if (timeout.value) {
      clearTimeout(timeout.value)
      timeout.value = null
    }

    stopped.value = false

    timeout.value = setTimeout(() => {
      const marksToProcess = getMarksToProcess(marks as MarkWithMedium[])
      if (!marksToProcess.length) return

      markAsProcessed(marksToProcess)
      void createMarkThumbs(marksToProcess)
    }, 3000)
  }

  watch(() => marksStore.marksOnPage, (marks) => {
    generateImages(marks as MarkWithMedium[])
  })

  const cleanup = (): void => {
    if (timeout.value) clearTimeout(timeout.value)
    stopped.value = true
  }

  onBeforeUnmount(cleanup)

  return {
    active,
    generateImages,
    cleanup,
  }
}
