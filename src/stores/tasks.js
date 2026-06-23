import {defineStore} from 'pinia'

export const useTasksStore = defineStore('useTasksStore', {
  state: () => ({
    list: [],
    mediaAdding: {
      paths: '',
      excluded: '',
      dialogProcess: false,
      active: false,
      stopped: false,
      finished: false,
      status: '',
      processed: '',
      progress: 0,
      current: 0,
      total: 0,
      errors: [],
      duplicates: [],
      added: [],
      addedMedia: [],
      parsingTags: false,
      suggestedTags: [],
      videoSuggestedTags: [],
      addedMediaTypeId: null,
      addedMediaType: null,
      recognizingObjects: false,
      objectRecognitionProgress: 0,
      objectRecognitionProcessed: 0,
      objectRecognitionTotal: 0,
      objectRecognitionRemaining: 0,
      media_type_id: null,
      is_parsing: true,
      is_exclude: false,
      is_check_duplicates: true,
      skipFileScan: false,
      directFiles: [],
    },
  }),
  actions: {
    setTask({title, subtitle, icon, click, action, progress} = {}) {
      const id = $readable.getRandomId('task_')
      this.list.push({id, title, subtitle, icon, click, action, progress})
      return id
    },
    updateTask(id, data) {
      const x = this.list.findIndex(i => i.id === id)
      if (x > -1) {
        for (const k in data) {
          this.list[x][k] = data[k]
        }
      }
    },
    removeTask(id) {
      const x = this.list.findIndex(i => i.id === id)
      if (x > -1) this.list.splice(x, 1)
    }
  }
})

export default useTasksStore
