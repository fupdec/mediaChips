import {ref, watch, onBeforeUnmount} from 'vue'
import {useI18n} from 'vue-i18n'
import path from 'path-browserify'
import {useAppStore} from '@/stores/app'
import {useTasksStore} from '@/stores/tasks'
import {useMarksStore} from '@/stores/marks'
import {useEventBus} from '@/utils/eventBus'

function formatMarkTimestamp(time) {
  return new Date(1000 * time).toISOString().substr(11, 12)
}

export default function useMarkImageGenerator() {
  const {t} = useI18n()
  const appStore = useAppStore()
  const tasksStore = useTasksStore()
  const marksStore = useMarksStore()
  const eventBus = useEventBus()

  const active = ref(false)
  const stopped = ref(false)
  const timeout = ref(null)
  const processedMarkIds = ref(new Set())
  const lastMarksCount = ref(0)

  const getMarkImagePath = (markId) => path.join(
    appStore.mediaPath || '',
    'videos/marks',
    `${markId}.jpg`,
  )

  const getMarksToProcess = (marks) => {
    if (!Array.isArray(marks) || !marks.length) return []

    return marks.filter((mark) => mark?.id && !processedMarkIds.value.has(mark.id))
  }

  const markAsProcessed = (marks) => {
    for (const mark of marks) {
      if (mark?.id) processedMarkIds.value.add(mark.id)
    }
  }

  const resetProcessedMarks = () => {
    processedMarkIds.value = new Set()
  }

  const ensureMarkThumb = async (mark) => {
    const imgPath = getMarkImagePath(mark.id)
    const thumbExists = await $operable.checkFileExists(imgPath)

    if (thumbExists) {
      eventBus.emit('updateMarkImage', mark.id)
      return 'exists'
    }

    const videoPath = mark.medium?.path
    if (!videoPath) return 'skipped'

    const videoExists = await $operable.checkFileExists(videoPath)
    if (!videoExists) return 'skipped'

    await $operable.createThumb(
      formatMarkTimestamp(mark.time),
      videoPath,
      imgPath,
      180,
    )
    eventBus.emit('updateMarkImage', mark.id)
    return 'created'
  }

  const createMarkThumbs = async (marks) => {
    if (active.value || !marks.length) return

    const marksToGenerate = []

    for (const mark of marks) {
      const imgPath = getMarkImagePath(mark.id)
      const thumbExists = await $operable.checkFileExists(imgPath)

      if (thumbExists) {
        eventBus.emit('updateMarkImage', mark.id)
        continue
      }

      if (!mark.medium?.path) continue

      const videoExists = await $operable.checkFileExists(mark.medium.path)
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
          await ensureMarkThumb(mark)
        } catch (error) {
          console.error(`Failed to create thumb for mark ${mark.id}:`, error)
        }
      }
    } finally {
      active.value = false
      tasksStore.removeTask(taskId)
    }
  }

  const generateImages = (marks) => {
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
      const marksToProcess = getMarksToProcess(marks)
      if (!marksToProcess.length) return

      markAsProcessed(marksToProcess)
      createMarkThumbs(marksToProcess)
    }, 3000)
  }

  watch(() => marksStore.marksOnPage, (marks) => {
    generateImages(marks)
  })

  const cleanup = () => {
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
