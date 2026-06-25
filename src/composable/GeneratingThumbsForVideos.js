import {ref, watch, onBeforeUnmount, computed} from 'vue'
import {useTasksStore} from '@/stores/tasks'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useEventBus} from '@/utils/eventBus'
import {useApiBaseUrl} from '@/composables/useApiBaseUrl'
import axios from 'axios'

export default function useVideoImageGenerator() {

  const tasksStore = useTasksStore()
  const itemsStore = useItemsStore()
  const settingsStore = useSettingsStore()
  const eventBus = useEventBus()

// Реактивные переменные
  const grid = ref({
    active: false,
    stopped: false
  })

  const timeline = ref({
    active: false,
    stopped: false
  })

  const timeout = ref(null)
  const processedVideoIds = ref(new Set())
  const lastItemsCount = ref(0)

// Computed свойства
  const apiUrl = useApiBaseUrl()

  const ITEMS = computed(() => itemsStore)

// Методы
  const createVideoGrid = (input, output) => {
    return new Promise((resolve, reject) => {
      axios({
        method: "post",
        url: `${apiUrl.value}/api/Task/createGrid`,
        data: {
          input: input,
          output: output,
          width: 180,
          cols: 3,
          rows: 3,
        },
      })
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          // console.log(e);
          reject(e);
        });
    })
  }

  const createVideoTimeline = (video) => {
    return new Promise((resolve, reject) => {
      axios({
        method: "post",
        url: `${apiUrl.value}/api/Task/createTimeline`,
        data: video,
      })
        .then((res) => {
          eventBus.emit('updateVideoFrames', video.id)
          resolve(res);
        })
        .catch((e) => {
          // console.log(e);
          reject(e);
        });
    })
  }

  const createGrids = async (videos) => {
    if (grid.value.active) return

    grid.value.active = true
    grid.value.stopped = false

    // Создаем задачу в хранилище Pinia
    const taskId = tasksStore.setTask({
      title: 'Generating grids images',
      icon: 'apps',
      action: () => {
        grid.value.stopped = true
      }
    })

    try {
      let completed = 0
      for (const video of videos) {
        if (grid.value.stopped) break

        completed++
        // Обновляем прогресс задачи
        tasksStore.updateTask(taskId, {
          subtitle: `${completed} of ${videos.length}`,
          progress: (completed / videos.length) * 100
        })

        try {
          await createVideoGrid(video.path, `${video.id}.jpg`)

          // Обновляем элементы
          eventBus.emit('getItemsFromDb', {
            ids: [video.id],
            type: 'media'
          })
        } catch (error) {
          console.error(`Failed to create grid for video ${video.id}:`, error)
          // Продолжаем обработку остальных видео
        }
      }

      // TODO: rerender tags if grid is created
    } catch (error) {
      console.error('Error in createGrids:', error)
    } finally {
      grid.value.active = false
      // Удаляем задачу из хранилища
      tasksStore.removeTask(taskId)
    }
  }

  const createTimelines = async (videos) => {
    if (timeline.value.active) return

    timeline.value.active = true
    timeline.value.stopped = false

    // Создаем задачу в хранилище Pinia
    const taskId = tasksStore.setTask({
      title: 'Generating timeline images',
      icon: 'view-column',
      action: () => {
        timeline.value.stopped = true
      }
    })

    try {
      let completed = 0
      for (const video of videos) {
        if (timeline.value.stopped) break

        completed++
        // Обновляем прогресс задачи
        tasksStore.updateTask(taskId, {
          subtitle: `${completed} of ${videos.length}`,
          progress: (completed / videos.length) * 100
        })

        try {
          await createVideoTimeline(video)
        } catch (error) {
          console.error(`Failed to create timeline for video ${video.id}:`, error)
          // Продолжаем обработку остальных видео
        }
      }
    } catch (error) {
      console.error('Error in createTimelines:', error)
    } finally {
      timeline.value.active = false
      // Удаляем задачу из хранилища
      tasksStore.removeTask(taskId)
    }
  }

  const getVideosToProcess = (videos) => {
    if (!Array.isArray(videos) || !videos.length) return []

    return videos.filter((video) => video?.id && !processedVideoIds.value.has(video.id))
  }

  const markVideosProcessed = (videos) => {
    for (const video of videos) {
      if (video?.id) processedVideoIds.value.add(video.id)
    }
  }

  const resetProcessedVideos = () => {
    processedVideoIds.value = new Set()
  }

  const generateImages = (videos) => {
    if (!Array.isArray(videos)) return

    if (videos.length === 0) {
      resetProcessedVideos()
      lastItemsCount.value = 0
      return
    }

    if (videos.length < lastItemsCount.value) {
      resetProcessedVideos()
    }
    lastItemsCount.value = videos.length

    // Очищаем предыдущий таймаут
    if (timeout.value) {
      clearTimeout(timeout.value)
      timeout.value = null
    }

    // Сбрасываем флаги остановки
    grid.value.stopped = false
    timeline.value.stopped = false

    // Устанавливаем новый таймаут
    timeout.value = setTimeout(() => {
      const videosToProcess = getVideosToProcess(videos)
      if (!videosToProcess.length) return

      markVideosProcessed(videosToProcess)

      if (!grid.value.active && settingsStore.videoPreviewStatic === 'grid') {
        createGrids(videosToProcess)
      }

      if (!timeline.value.active &&
        (settingsStore.videoPreviewHover === 'timeline' ||
          itemsStore.view === 2 ||
          itemsStore.view === '2')) {
        createTimelines(videosToProcess)
      }
    }, 3000)
  }

// Watcher для отслеживания изменений элементов на странице
  watch(() => itemsStore.itemsOnPage, (videos) => {
    if (itemsStore.type === 'media') {
      generateImages(videos)
    }
  })

// Очистка при размонтировании компонента

  const cleanup = () => {
    if (timeout.value) clearTimeout(timeout.value)
    grid.value.stopped = true
    timeline.value.stopped = true
  }

  onBeforeUnmount(cleanup)

  return {
    grid,
    timeline,
    generateImages,
    createGrids,
    createTimelines,
    cleanup,
  }
}