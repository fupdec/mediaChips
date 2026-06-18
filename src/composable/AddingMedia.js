import {computed, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useTasksStore} from '@/stores/tasks'
import {useEventBus} from '@/utils/eventBus'

export const useMediaAdding = () => {
  // Stores and composables
  const appStore = useAppStore()
  const itemsStore = useItemsStore()
  const tasksStore = useTasksStore()
  const eventBus = useEventBus()
  const {t, locale} = useI18n()

  // Computed properties
  const apiUrl = computed(() => appStore.localhost)
  const ENV = computed(() => itemsStore.environment)
  const mediaTypes = computed(() => appStore.mediaTypes)

  const task = computed({
    get() {
      return tasksStore.mediaAdding
    },
    set(value) {
      tasksStore.mediaAdding = value
    }
  })

  // Methods
  const handleAddMedia = async (action) => {
    await addMedia()
    if (action && typeof action === 'function') {
      action()
    }
  }

  const openMediaAddingProcess = async () => {
    if (task.value.dialogProcess) return
    await nextTick()
    task.value.dialogProcess = true
  }

  const openProcessAction = () => ({
    id: 'open-media-adding-process',
    text: t('media.adding.open_process_dialog'),
    icon: 'open-in-new',
    action: openMediaAddingProcess,
    hide: true,
  })

  const addMedia = async () => {
    // Инициализация задачи
    task.value.active = true
    task.value.status = "Scanning files..."
    task.value.processed = ""
    task.value.progress = 0
    task.value.stopped = false
    task.value.finished = false
    task.value.current = 0
    task.value.total = 0
    task.value.errors = []
    task.value.duplicates = []
    task.value.added = []
    task.value.suggestedTags = []
    task.value.videoSuggestedTags = []
    task.value.addedMediaTypeId = null
    task.value.addedMediaType = null
    task.value.recognizingObjects = false
    task.value.objectRecognitionProgress = 0
    task.value.objectRecognitionProcessed = 0
    task.value.objectRecognitionTotal = 0
    task.value.objectRecognitionRemaining = 0

    const taskData = {
      title: "Adding files",
      icon: "file-plus",
      click: () => {
        task.value.dialogProcess = true
      },
      action: () => {
        task.value.stopped = true
      }
    }

    // Создание задачи в UI
    const taskId = await tasksStore.setTask(taskData)
    let keepTaskAfterComplete = false

    const mediaTypeId = task.value.media_type_id || ENV.value.media_type_id
    const mediaType = mediaTypes.value.find(i => i.id === Number(mediaTypeId))

    if (!mediaType) {
      console.error('Media type not found')
      task.value.finished = true
      $operable.setNotification({
        title: 'Error',
        text: 'Media type not found',
      })
      return
    }

    task.value.addedMediaTypeId = mediaType.id
    task.value.addedMediaType = mediaType.type

    // Создание regex для фильтрации файлов
    const regex = "." + mediaType.extensions.split(',').join("$|.") + "$"
    const regexString = JSON.stringify(regex)

    // Преобразование путей
    const paths = $readable.transformTextToArray(task.value.paths)
    const excluded = $readable.transformTextToArray(task.value.excluded)

    let files = []

    try {
      // Получение списка файлов
      for (const entryPath of paths) {
        const response = await axios({
          method: "post",
          url: `${apiUrl.value}/api/Task/getFileList`,
          data: {
            path: entryPath,
            filter: regexString,
            excluded: task.value.is_exclude ? excluded : []
          }
        })

        files = files.concat(response.data)
      }

      // Фильтрация системных файлов (Unix ._ files)
      files = files.filter(i => {
        const filename = i.split('\\').pop().split('/').pop()
        return !filename.match(/^\._/)
      })

      // Обработка файлов
      task.value.status = `Gathering metadata and adding files to the database...`
      task.value.total = files.length
      task.value.current = 0
      task.value.progress = 0

      const percentage = files.length > 0 ? 100 / files.length : 0
      const addedForParsing = []
      let lastProgressUpdate = 0
      let current = 0

      const updateProgress = async (force = false) => {
        const now = Date.now()
        if (!force && now - lastProgressUpdate < 150) return

        lastProgressUpdate = now
        const progress = Math.min(current * percentage, 100)

        task.value.current = current
        task.value.progress = progress
        task.value.processed = `Processed: ${current} / ${files.length}`

        await tasksStore.updateTask(taskId, {
          subtitle: `In progress: ${current} of ${files.length}`,
          progress: progress
        })
      }

      for (const filePath of files) {
        if (task.value.stopped) break

        try {
          const response = await axios({
            method: "post",
            url: `${apiUrl.value}/api/Task/addMedia${mediaType.type}`,
            data: {
              path: filePath,
              type: mediaType,
              is_check_duplicates: task.value.is_check_duplicates
            }
          })

          if (response.status === 202) {
            // Дубликат найден
            task.value.duplicates.push({
              path: filePath,
              duplicate: response.data.duplicate
            })
          } else if (response.status === 201) {
            // Файл добавлен
            task.value.added.push(filePath)

            if (task.value.is_parsing && response.data?.id) {
              addedForParsing.push({path: filePath, mediaId: response.data.id})
            }
          }
        } catch (error) {
          console.error(`Error adding file ${filePath}:`, error)
          task.value.errors.push(filePath)
        }

        // Обновление прогресса
        current += 1
        await updateProgress()
      }

      await updateProgress(true)

      if (addedForParsing.length > 0) {
        task.value.status = `Adding metadata to media...`
        await parseTagsForAddedMedia(addedForParsing)
      }

      // Показ уведомлений
      if (task.value.added.length > 0) {
        await suggestTagsFromAddedFiles()

        // Завершение задачи
        task.value.finished = true
        task.value.active = false
        task.value.media_type_id = null
        task.value.status = 'Adding files is complete!'
        keepTaskAfterComplete = String(mediaType.type || '').toLowerCase() === 'video'

        if (keepTaskAfterComplete) {
          await tasksStore.updateTask(taskId, {
            subtitle: `Added ${task.value.added.length} media`,
            progress: 100,
            color: 'success',
            done: true,
            action: () => {},
          })
        }

        $operable.setNotification({
          type: "success",
          title: 'Adding files complete',
          text: `Added ${task.value.added.length} media`,
          actions: [openProcessAction()],
        })
      } else {
        // Завершение задачи
        task.value.finished = true
        task.value.active = false
        task.value.media_type_id = null
        task.value.status = 'Adding files is complete!'

        $operable.setNotification({
          type: "info",
          title: 'Adding files complete',
          text: 'No new media found',
          actions: [openProcessAction()],
        })
      }

      // Обновление списка медиа
      eventBus.emit('getItemsFromDb', {
        ids: [],
        type: 'media'
      })

      // Обновление watcher (если используется)
      eventBus.emit('update:watcher')

    } catch (error) {
      console.error('Error in addMedia process:', error)
      $operable.setNotification({
        title: 'Error adding files',
        text: error.message
      })
      task.value.status = null
      task.value.errors.push(error.message)
    } finally {
      if (!keepTaskAfterComplete) {
        // Удаление задачи из UI
        await tasksStore.removeTask(taskId)
      }
    }
  }

  // Вспомогательные функции
  const chunkArray = (items, size = 100) => {
    const chunks = []
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size))
    }
    return chunks
  }

  const parseTagsForAddedMedia = async (items) => {
    for (const chunk of chunkArray(items, 100)) {
      if (task.value.stopped) break

      let vals = []
      try {
        const parseResponse = await axios({
          method: "post",
          url: `${apiUrl.value}/api/Task/parsePathTags`,
          data: {
            paths: chunk
          }
        })
        vals = parseResponse.data || []
      } catch (error) {
        console.error('Error parsing tags for added media:', error)
        vals = chunk.flatMap(item => $readable.parseFilePath(item.path, item.mediaId))
      }

      for (const valsChunk of chunkArray(vals, 500)) {
        if (!valsChunk.length) continue
        await axios({
          method: "post",
          url: `${apiUrl.value}/api/TagsInMedia`,
          data: valsChunk
        })
      }
    }
  }

  const uniqueNames = (items) => {
    const seen = new Set()
    return items.filter((name) => {
      const key = String(name || '').trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const suggestTagsFromAddedFiles = async () => {
    const names = []

    try {
      task.value.status = t('media.adding.suggesting_tags_from_paths')
      const response = await axios({
        method: "post",
        url: `${apiUrl.value}/api/Task/suggestTagsFromPaths`,
        data: {
          paths: task.value.added,
          limit: 30,
          maxWords: 3,
          excludeExisting: true,
        }
      })

      const suggestions = response.data?.suggestions || []
      names.push(...suggestions
        .map(item => item.word)
        .filter(Boolean)
        .slice(0, 30))
    } catch (error) {
      console.error('Error suggesting tags from added files:', error)
    }

    task.value.suggestedTags = uniqueNames(names).slice(0, 80)
  }

  // Lifecycle hooks для компонента
  const setupEventListeners = () => {
    eventBus.on('addMedia', handleAddMedia)
  }

  const cleanupEventListeners = () => {
    eventBus.off('addMedia', handleAddMedia)
    if (task.value) {
      task.value.stopped = true
    }
  }

  return {
    // State
    task,

    // Methods
    addMedia,
    handleAddMedia,

    // Lifecycle methods
    setupEventListeners,
    cleanupEventListeners,
  }
}