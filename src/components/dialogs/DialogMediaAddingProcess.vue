<template>
  <v-dialog
    v-model="tasksStore.mediaAdding.dialogProcess"
    :fullscreen="xs"
    scrollable
    width="800"
    persistent
  >
    <v-card>
      <DialogHeader
        @close="tasksStore.mediaAdding.dialogProcess = false"
        :header="t('media.adding.files')"
        :buttons="buttons"
        closable
      />

      <v-card-actions class="pa-4">
        <v-progress-linear
          v-model="task.progress"
          :striped="task.active && !task.stopped"
          height="20"
          color="primary"
          rounded
        >
          <template v-slot:default="{ value }">
            <strong class="process-percents">{{ Math.ceil(value) }} %</strong>
          </template>
        </v-progress-linear>
      </v-card-actions>

      <div class="d-flex justify-space-between px-4">
        <div>{{ task.status }}</div>
        <v-card class="text-medium-emphasis text-caption" variant="flat">
          <v-progress-linear v-if="task.active && !task.stopped" height="3" indeterminate reverse/>
          {{ task.processed }}
        </v-card>
      </div>

      <v-card-text class="pa-4">
        <!-- Added files -->
        <div v-if="task.added.length > 0" class="mb-4">
          <div v-if="task.finished" class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              v-if="task.suggestedTags?.length"
              @click="openSuggestedTags"
              color="primary"
              rounded
              variant="flat"
            >
              <v-icon icon="mdi-tag-plus-outline"
                start/>
              {{ t('media.adding.add_suggested_tags') }}
            </v-btn>

            <v-btn
              v-if="canRecognizeObjects && clipModelNeedsDownload"
              @click="downloadClipModel"
              :loading="clipModelDownloading"
              :disabled="clipModelDownloading"
              color="secondary"
              rounded
              variant="outlined"
            >
              <v-icon icon="mdi-download"
                start/>
              {{ t('media.adding.download_video_recognition_model') }}
            </v-btn>

            <v-btn
              v-if="canRecognizeObjects && clipModelReady"
              @click="recognizeVideoObjects"
              :loading="task.recognizingObjects"
              :disabled="task.recognizingObjects"
              color="secondary"
              rounded
              variant="flat"
            >
              <v-icon icon="mdi-image-search-outline"
                start/>
              {{ t('media.adding.recognize_video_objects') }}
            </v-btn>
            <ButtonDocumentation
              v-if="canRecognizeObjects"
              id="media.video_object_recognition"
            />
          </div>

          <div
            v-if="canRecognizeObjects && clipModelNeedsDownload"
            class="text-caption text-medium-emphasis mb-4"
          >
            {{ t('media.adding.download_video_recognition_model_hint') }}
          </div>

          <div v-if="task.recognizingObjects || task.objectRecognitionTotal > 0" class="mb-4">
            <v-progress-linear
              v-model="task.objectRecognitionProgress"
              color="secondary"
              height="18"
              rounded
              :striped="task.recognizingObjects"
            >
              <template #default="{ value }">
                <strong class="process-percents">{{ Math.ceil(value) }} %</strong>
              </template>
            </v-progress-linear>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ t('media.adding.video_object_recognition_progress', {
                processed: task.objectRecognitionProcessed,
                total: task.objectRecognitionTotal,
                remaining: task.objectRecognitionRemaining,
              }) }}
            </div>
          </div>

          <v-chip
            @click="is_show_added = !is_show_added"
            :text="t('media.adding.added_count', {count: task.added.length})"
            color="success"
            class="mb-2"
            size="small"
          />
          <v-card v-if="is_show_added" variant="outlined" class="pa-2">
            <v-virtual-scroll
              :height="task.added.length > 10 ? 150 : task.added.length * 15"
              :items="task.added"
              class="virtual-scroller"
              item-height="15"
            >
              <template v-slot:default="{ item }">
                <div class="text-caption selectable">{{ item }}</div>
              </template>
            </v-virtual-scroll>
          </v-card>
        </div>

        <!-- Existing files (by path) -->
        <div v-if="duplicates_by_path.length">
          <v-card-actions class="pa-0 mb-2">
            <v-chip
              @click="is_show_duplicates_by_path = !is_show_duplicates_by_path"
              :text="t('media.adding.existing_count', {count: duplicates_by_path.length})"
              color="info"
              size="small"
            />

            <v-spacer></v-spacer>

            <v-btn
              @click="deletePathDuplicates"
              :disabled="task.active"
              color="error"
              class="pr-4"
              variant="flat"
              rounded
              size="small"
            >
              <v-icon icon="mdi-delete-alert" class="mr-1"></v-icon>
              {{ t('media.adding.delete_incoming_files') }}
            </v-btn>
          </v-card-actions>
          <v-card v-if="is_show_duplicates_by_path" variant="outlined" class="pa-2">
            <v-virtual-scroll
              :height="duplicates_by_path.length > 10 ? 150 : duplicates_by_path.length * 15"
              :items="duplicates_by_path"
              class="virtual-scroller"
              item-height="15"
            >
              <template v-slot:default="{ item }">
                <div class="text-caption selectable">{{ item }}</div>
              </template>
            </v-virtual-scroll>
          </v-card>
        </div>

        <!-- Duplicates by filesize -->
        <div v-if="duplicates_by_filesize.length">
          <v-card-actions class="pa-0 mt-4 mb-2">
            <v-chip
              @click="is_show_duplicates_by_filesize = !is_show_duplicates_by_filesize"
              :text="t('media.adding.duplicates_by_size_count', {count: duplicates_by_filesize.length})"
              color="warning"
              size="small"
            />

            <v-spacer></v-spacer>

            <v-btn
              @click="deleteDuplicates('incoming')"
              :disabled="task.active"
              color="error"
              class="pr-4"
              variant="flat"
              rounded
              size="small"
            >
              <v-icon icon="mdi-delete-alert" class="mr-1"></v-icon>
              {{ t('media.adding.delete_incoming_files') }}
            </v-btn>

            <v-btn
              @click="deleteDuplicates('existing')"
              :disabled="task.active"
              color="error"
              class="pr-4"
              variant="flat"
              rounded
              size="small"
            >
              <v-icon icon="mdi-delete-alert" class="mr-1"></v-icon>
              {{ t('media.adding.delete_existing_files') }}
            </v-btn>
          </v-card-actions>

          <v-card v-if="is_show_duplicates_by_filesize" variant="outlined" class="pa-2">
            <v-virtual-scroll
              :height="duplicates_by_filesize.length > 10 ? 150 : duplicates_by_filesize.length * 15"
              :items="duplicates_by_filesize"
              class="virtual-scroller"
              item-height="15"
            >
              <template v-slot:default="{ item }">
                <div class="text-caption selectable">{{ item }}</div>
              </template>
            </v-virtual-scroll>
          </v-card>
        </div>

        <!-- Errors -->
        <div v-if="task.errors.length > 0">
          <v-chip
            @click="is_show_errors = !is_show_errors"
            :text="t('media.adding.errors_count', {count: task.errors.length})"
            color="error"
            class="mb-2 mt-4"
            size="small"
          />
          <v-card v-if="is_show_errors" variant="outlined" class="pa-2">
            <v-virtual-scroll
              :height="task.errors.length > 10 ? 150 : task.errors.length * 15"
              :items="task.errors"
              class="virtual-scroller"
              item-height="15"
            >
              <template v-slot:default="{ item }">
                <div class="text-caption selectable">{{ item }}</div>
              </template>
            </v-virtual-scroll>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed, nextTick, onMounted, watch} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'
import DialogHeader from "@/components/elements/DialogHeader.vue"
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue"
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useTasksStore} from '@/stores/tasks'
import {useDialogsStore} from '@/stores/dialogs'
import {useEventBus} from '@/utils/eventBus'

// Props - dialog state is controlled via tasksStore.mediaAdding.dialogProcess

// Emits
const emit = defineEmits(['close'])

// Stores and composables
const {xs} = useDisplay()
const {t, locale} = useI18n()
const appStore = useAppStore()
const tasksStore = useTasksStore()
const dialogsStore = useDialogsStore()
const eventBus = useEventBus()

// Reactive state
const buttons = ref([])
const is_show_added = ref(false)
const is_show_duplicates_by_filesize = ref(false)
const is_show_duplicates_by_path = ref(false)
const is_show_errors = ref(false)
const clipModelStatus = ref('unknown')
const clipModelDownloading = ref(false)

// Computed properties
const task = computed(() => tasksStore.mediaAdding)
const canRecognizeObjects = computed(() => (
  task.value.finished &&
  task.value.added.length > 0 &&
  String(task.value.addedMediaType || '').toLowerCase() === 'video'
))
const clipModelReady = computed(() => ['downloaded', 'loaded'].includes(clipModelStatus.value))
const clipModelNeedsDownload = computed(() => (
  !clipModelReady.value && !['loading'].includes(clipModelStatus.value)
))

const duplicates_by_path = computed(() => {
  return task.value.duplicates
    .filter(i => i.duplicate?.parameter === 'path')
    .map(i => i.path)
})

const duplicates_by_filesize = computed(() => {
  return task.value.duplicates
    .filter(i => i.duplicate?.parameter === 'filesize')
    .map(i => i.path)
})

// Methods
const initButtons = () => {
  buttons.value = [{
    icon: "stop",
    text: t("common.stop"),
    color: "error",
    variant: "flat",
    action: stop,
  }]
}

const stop = () => {
  tasksStore.mediaAdding.stopped = true
  buttons.value = []
}

const deletePathDuplicates = async () => {
  dialogsStore.confirm.show = true
  dialogsStore.confirm.text = t('media.adding.delete_files_confirm')
  dialogsStore.confirm.action = async () => {
    try {
      const dupes = task.value.duplicates.filter(i => i.duplicate?.parameter === 'path')

      for (const dupe of dupes) {
        if (!dupe.path) continue

        try {
          await $operable.deleteLocalFile(dupe.path)
        } catch (error) {
          console.error('Error deleting local file:', error)
        }
      }

      $operable.setNotification({
        type: 'success',
        title: t('media.adding.deleting_files'),
        text: t('media.adding.files_deleted')
      })

      eventBus.emit('update:watcher')
    } catch (error) {
      console.error('Error deleting path duplicates:', error)
    }
  }
}

const deleteDuplicates = async (delete_type) => {
  dialogsStore.confirm.show = true
  dialogsStore.confirm.text = t('media.adding.delete_files_confirm')
  dialogsStore.confirm.action = async () => {
    try {
      const dupes = task.value.duplicates.filter(i => i.duplicate?.parameter === 'filesize')

      for (const dupe of dupes) {
        const file_path = delete_type === 'incoming' ? dupe.path : dupe.duplicate?.path

        if (!file_path) continue

        try {
          await $operable.deleteLocalFile(file_path)
        } catch (error) {
          console.error('Error deleting local file:', error)
        }

        if (delete_type === 'existing' && dupe.duplicate?.id) {
          await axios({
            method: "post",
            url: appStore.localhost + "/api/media/updatePath",
            data: {
              id: dupe.duplicate.id,
              path: dupe.path,
            },
          })
        }
      }

      if (delete_type === "existing") {
        const ids = dupes.map(i => i.duplicate?.id).filter(Boolean)

        if (ids.length > 0) {
          eventBus.emit('getItemsFromDb', {
            ids: ids,
            type: 'media',
          })
        }
      }

      emit('close')

      $operable.setNotification({
        type: 'success',
        title: t('media.adding.deleting_files'),
        text: t('media.adding.files_deleted')
      })

      // Обновляем стор watcher
      eventBus.emit('update:watcher')

    } catch (error) {
      console.error('Error deleting duplicates:', error)
    }
  }
}

const openSuggestedTags = () => {
  eventBus.emit('openTagsAddWithNames', {
    names: task.value.suggestedTags || [],
    title: t('media.adding.suggested_tags_from_added_files'),
  })
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

const openProcessAction = () => ({
  id: 'open-media-adding-process',
  text: t('media.adding.open_process_dialog'),
  icon: 'open-in-new',
  action: async () => {
    if (task.value.dialogProcess) return
    await nextTick()
    task.value.dialogProcess = true
  },
  hide: true,
})

const fetchClipModelStatus = async () => {
  try {
    const response = await axios.get(`${appStore.localhost}/api/Task/clipModelStatus`)
    clipModelStatus.value = response.data?.status || 'unknown'
  } catch (error) {
    console.error('Error checking CLIP model status:', error)
    clipModelStatus.value = 'error'
  }
}

const downloadClipModel = async () => {
  clipModelDownloading.value = true
  clipModelStatus.value = 'loading'

  try {
    const response = await axios.post(`${appStore.localhost}/api/Task/downloadClipModel`)
    clipModelStatus.value = response.data?.status || 'downloaded'
    $operable.setNotification({
      type: 'success',
      title: t('media.adding.download_video_recognition_model'),
      text: t('settings.path_parser.statuses.downloaded'),
    })
  } catch (error) {
    console.error('Error downloading CLIP model:', error)
    clipModelStatus.value = 'error'
    $operable.setNotification({
      type: 'error',
      title: t('media.adding.download_video_recognition_model'),
      text: error.response?.data?.message || error.message,
    })
  } finally {
    clipModelDownloading.value = false
  }
}

const recognizeVideoObjects = async () => {
  if (!clipModelReady.value) {
    $operable.setNotification({
      type: 'warning',
      title: t('media.adding.recognize_video_objects'),
      text: t('media.adding.download_video_recognition_model_hint'),
    })
    return
  }

  task.value.recognizingObjects = true
  task.value.objectRecognitionProgress = 0
  task.value.objectRecognitionProcessed = 0
  task.value.objectRecognitionTotal = task.value.added.length
  task.value.objectRecognitionRemaining = task.value.added.length

  const previousStatus = task.value.status
  task.value.status = t('media.adding.recognizing_video_objects')
  const controller = new AbortController()
  const recognitionTaskId = tasksStore.setTask({
    title: t('media.adding.recognizing_video_objects'),
    subtitle: t('media.adding.video_object_recognition_progress', {
      processed: 0,
      total: task.value.added.length,
      remaining: task.value.added.length,
    }),
    icon: 'image-search-outline',
    progress: 0,
    click: () => {
      task.value.dialogProcess = true
    },
    action: () => {
      controller.abort()
    },
  })

  try {
    const response = await fetch(`${appStore.localhost}/api/Task/streamVideoObjectRecognition`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      signal: controller.signal,
      body: JSON.stringify({
        paths: task.value.added,
        mediaTypeId: task.value.addedMediaTypeId,
        locale: locale.value,
        framesPerVideo: 4,
        limit: 50,
        excludeExisting: true,
      })
    })

    if (!response.ok || !response.body) {
      throw new Error(response.statusText || 'Object recognition request failed')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let names = []

    const handleEvent = (event) => {
      if (event.type === 'progress') {
        task.value.objectRecognitionProcessed = event.processed || 0
        task.value.objectRecognitionTotal = event.total || task.value.objectRecognitionTotal || 0
        task.value.objectRecognitionRemaining = event.remaining ?? Math.max(task.value.objectRecognitionTotal - task.value.objectRecognitionProcessed, 0)
        task.value.objectRecognitionProgress = task.value.objectRecognitionTotal
          ? Math.min((task.value.objectRecognitionProcessed / task.value.objectRecognitionTotal) * 100, 100)
          : 0

        tasksStore.updateTask(recognitionTaskId, {
          subtitle: t('media.adding.video_object_recognition_progress', {
            processed: task.value.objectRecognitionProcessed,
            total: task.value.objectRecognitionTotal,
            remaining: task.value.objectRecognitionRemaining,
          }),
          progress: task.value.objectRecognitionProgress,
        })
      }

      if (event.type === 'complete') {
        names = (event.suggestions || [])
          .map(item => item.word)
          .filter(Boolean)
          .slice(0, 50)

        task.value.objectRecognitionProcessed = event.media || task.value.objectRecognitionTotal
        task.value.objectRecognitionTotal = event.media || task.value.objectRecognitionTotal
        task.value.objectRecognitionRemaining = 0
        task.value.objectRecognitionProgress = 100

        tasksStore.updateTask(recognitionTaskId, {
          subtitle: t('media.adding.video_object_recognition_complete'),
          progress: 100,
          color: 'success',
          done: true,
          action: () => {},
        })
      }

      if (event.type === 'error') {
        throw new Error(event.message || 'Object recognition failed')
      }
    }

    while (true) {
      const {value, done} = await reader.read()
      if (done) break

      buffer += decoder.decode(value, {stream: true})
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        handleEvent(JSON.parse(line))
      }
    }

    if (buffer.trim()) {
      handleEvent(JSON.parse(buffer))
    }

    task.value.videoSuggestedTags = names
    task.value.suggestedTags = uniqueNames([
      ...(task.value.suggestedTags || []),
      ...names,
    ]).slice(0, 80)

    if (names.length > 0) {
      $operable.setNotification({
        type: 'success',
        title: t('media.adding.video_object_recognition_complete'),
        text: t('media.adding.video_object_tags_found', {count: names.length}),
        actions: [openProcessAction()],
      })
    } else {
      $operable.setNotification({
        type: 'info',
        title: t('media.adding.video_object_recognition_complete'),
        text: t('media.adding.video_object_tags_not_found'),
        actions: [openProcessAction()],
      })
    }
  } catch (error) {
    console.error('Error recognizing video objects:', error)
    tasksStore.updateTask(recognitionTaskId, {
      subtitle: error.name === 'AbortError'
        ? t('common.stop')
        : t('media.adding.video_object_recognition_failed'),
      color: error.name === 'AbortError' ? 'warning' : 'error',
      done: true,
      action: () => {},
    })
    $operable.setNotification({
      type: 'error',
      title: t('media.adding.video_object_recognition_failed'),
      text: error.response?.data?.message || error.message,
    })
  } finally {
    task.value.status = previousStatus
    task.value.recognizingObjects = false
  }
}


// Lifecycle
onMounted(() => {
  initButtons()
  if (task.value && !task.value.finished) {
    task.value.active = true
  }
})

// Watchers
watch(() => task.value?.finished, (finished) => {
  if (finished) {
    buttons.value = []
    if (task.value) {
      task.value.progress = 100
    }
    if (
      task.value.added.length > 0 &&
      String(task.value.addedMediaType || '').toLowerCase() === 'video'
    ) {
      fetchClipModelStatus()
    }
  }
})

watch(canRecognizeObjects, (enabled) => {
  if (enabled) {
    fetchClipModelStatus()
  }
})
</script>

<style lang="scss" scoped>
.process-percents {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 1px 4px 1px;
  border-radius: 10px;
  line-height: 1;
}

.selectable {
  user-select: text;
  cursor: text;
}

.virtual-scroller {
  :deep(.v-virtual-scroll__item) {
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}
</style>