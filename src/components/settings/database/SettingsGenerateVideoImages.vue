<template>
  <div id="settings-generate-video-images" class="mx-4 pb-4">
    <settings-category-divider
      :title="t('settings_labels.database.generate_video_images')"
      icon="image-auto-adjust"
    />

    <v-alert
      v-if="statusError"
      type="error"
      variant="tonal"
      density="compact"
      rounded="xl"
      class="mb-4"
    >
      <span class="text-caption">{{ statusError }}</span>
    </v-alert>

    <div v-if="statusLoading" class="text-body-2 text-medium-emphasis mb-4">
      {{ t('common.loading') }}
    </div>

    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      rounded="xl"
      class="mb-4"
    >
      <span class="text-caption">
        {{ t('settings_labels.database.generate_video_images_hint') }}
      </span>
    </v-alert>

    <v-progress-linear
      v-if="activeType"
      :model-value="progress"
      color="primary"
      height="8"
      rounded
      striped
      class="mb-2"
    />

    <div v-if="activeType && currentPath" class="text-caption text-medium-emphasis mb-4 selectable">
      {{ activeTypeLabel }} · {{ currentPath }}
    </div>

    <div v-if="activeType" class="text-caption text-medium-emphasis mb-4">
      {{ t('settings_labels.database.generate_video_images_progress', counters) }}
    </div>

    <div
      v-for="imageType in imageTypes"
      :key="imageType.id"
      class="mb-6"
    >
      <div class="text-subtitle-2 mb-1">
        {{ t(imageType.titleKey) }}
      </div>

      <div class="text-body-2 text-medium-emphasis mb-3">
        {{ t('settings_labels.database.generate_video_images_status', status[imageType.id] || emptyStatus) }}
      </div>

      <div v-if="lastSummary[imageType.id]" class="text-body-2 mb-3">
        {{ t('settings_labels.database.generate_video_images_complete', lastSummary[imageType.id]) }}
      </div>

      <div class="d-flex flex-wrap ga-2">
        <v-btn
          v-if="activeType !== imageType.id"
          @click="startGeneration(imageType.id, false)"
          :disabled="statusLoading || !!activeType || (status[imageType.id]?.pending || 0) === 0"
          color="primary"
          rounded
          variant="flat"
          class="pr-4"
        >
          <v-icon icon="mdi-play" start/>
          {{ t('settings_labels.database.generate_video_images_start') }}
        </v-btn>

        <v-btn
          v-if="activeType !== imageType.id"
          @click="startGeneration(imageType.id, true)"
          :disabled="statusLoading || !!activeType || (status[imageType.id]?.total || 0) === 0"
          color="secondary"
          rounded
          variant="outlined"
          class="pr-4"
        >
          <v-icon icon="mdi-refresh" start/>
          {{ t('settings_labels.database.generate_video_images_regenerate') }}
        </v-btn>

        <v-btn
          v-if="activeType === imageType.id"
          @click="stopGeneration"
          color="error"
          rounded
          variant="flat"
          class="pr-4"
        >
          <v-icon icon="mdi-stop" start/>
          {{ t('common.stop') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useTasksStore} from '@/stores/tasks'
import {useApiBaseUrl} from '@/composable/useApiBaseUrl'
import SettingsCategoryDivider from '@/components/ui/SettingsCategoryDivider.vue'

const {t} = useI18n()
const tasksStore = useTasksStore()
const apiBaseUrl = useApiBaseUrl()

const imageTypes = [
  {id: 'preview', titleKey: 'settings_labels.database.generate_video_images_preview'},
  {id: 'grid', titleKey: 'settings_labels.database.generate_video_images_grid'},
  {id: 'timeline', titleKey: 'settings_labels.database.generate_video_images_timeline'},
  {id: 'marks', titleKey: 'settings_labels.database.generate_video_images_marks'},
]

const emptyStatus = {total: 0, pending: 0, generated: 0}

const status = ref({
  preview: {...emptyStatus},
  grid: {...emptyStatus},
  timeline: {...emptyStatus},
  marks: {...emptyStatus},
})

const activeType = ref(null)
const progress = ref(0)
const currentPath = ref('')
const statusLoading = ref(false)
const statusError = ref('')
const lastSummary = ref({})
const counters = ref({
  processed: 0,
  total: 0,
  created: 0,
  skipped: 0,
  missing: 0,
  failed: 0,
})

let abortController = null
let taskId = null

const activeTypeLabel = computed(() => {
  const item = imageTypes.find((type) => type.id === activeType.value)
  return item ? t(item.titleKey) : ''
})

const fetchStatus = async () => {
  const baseUrl = apiBaseUrl.value
  if (!baseUrl) return

  statusLoading.value = true
  statusError.value = ''

  try {
    const response = await fetch(`${baseUrl}/api/Task/videoImagesGenerationStatus`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(t('settings_labels.database.generate_video_images_api_unavailable'))
      }
      throw new Error(response.statusText || 'Failed to load video images generation status')
    }

    status.value = await response.json()
  } catch (error) {
    statusError.value = error.message
    throw error
  } finally {
    statusLoading.value = false
  }
}

const stopGeneration = () => {
  abortController?.abort()
}

const startGeneration = async (imageType, force = false) => {
  if (activeType.value) return

  const typeStatus = status.value[imageType] || emptyStatus
  if (!force && typeStatus.pending === 0) return
  if (force && typeStatus.total === 0) return

  activeType.value = imageType
  progress.value = 0
  currentPath.value = ''
  lastSummary.value = {...lastSummary.value, [imageType]: null}
  counters.value = {
    processed: 0,
    total: force ? typeStatus.total : typeStatus.pending,
    created: 0,
    skipped: 0,
    missing: 0,
    failed: 0,
  }

  abortController = new AbortController()

  const typeItem = imageTypes.find((type) => type.id === imageType)
  const baseUrl = apiBaseUrl.value

  taskId = tasksStore.setTask({
    title: t(typeItem.titleKey),
    subtitle: t('settings_labels.database.generate_video_images_progress', counters.value),
    icon: 'image-auto-adjust',
    progress: 0,
    action: stopGeneration,
  })

  try {
    const response = await fetch(
      `${baseUrl}/api/Task/streamVideoImagesGeneration?type=${imageType}&force=${force ? 'true' : 'false'}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        signal: abortController.signal,
        body: JSON.stringify({}),
      },
    )

    if (!response.ok || !response.body) {
      throw new Error(response.statusText || 'Video images generation request failed')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const handleEvent = (event) => {
      if (event.type === 'progress') {
        counters.value = {
          processed: event.processed || 0,
          total: event.total || counters.value.total,
          created: event.created || 0,
          skipped: event.skipped || 0,
          missing: event.missing || 0,
          failed: event.failed || 0,
        }
        currentPath.value = event.current || ''
        progress.value = event.total
          ? Math.min((event.processed / event.total) * 100, 100)
          : 0

        tasksStore.updateTask(taskId, {
          subtitle: t('settings_labels.database.generate_video_images_progress', counters.value),
          progress: progress.value,
        })
      }

      if (event.type === 'complete') {
        const summary = {
          created: event.created || 0,
          skipped: event.skipped || 0,
          missing: event.missing || 0,
          failed: event.failed || 0,
          stopped: event.stopped === true,
        }
        lastSummary.value = {...lastSummary.value, [imageType]: summary}
        progress.value = 100

        tasksStore.updateTask(taskId, {
          subtitle: event.stopped
            ? t('common.stop')
            : t('settings_labels.database.generate_video_images_complete', summary),
          progress: 100,
          color: event.stopped ? 'warning' : 'success',
          done: true,
          action: () => {},
        })

        if (!event.stopped) {
          $operable.setNotification({
            type: summary.created > 0 ? 'success' : 'info',
            title: t(typeItem.titleKey),
            text: t('settings_labels.database.generate_video_images_complete', summary),
            icon: 'mdi-image-auto-adjust',
          })
        }
      }

      if (event.type === 'error') {
        throw new Error(event.message || 'Video images generation failed')
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

    await fetchStatus()
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Video images generation failed:', error)
      $operable.setNotification({
        type: 'error',
        title: t(typeItem.titleKey),
        text: error.message,
      })

      if (taskId) {
        tasksStore.updateTask(taskId, {
          subtitle: error.message,
          color: 'error',
          done: true,
          action: () => {},
        })
      }
    } else if (taskId) {
      tasksStore.updateTask(taskId, {
        subtitle: t('common.stop'),
        color: 'warning',
        done: true,
        action: () => {},
      })
    }
  } finally {
    activeType.value = null
    abortController = null
    currentPath.value = ''
    await fetchStatus().catch(() => {})
  }
}

watch(apiBaseUrl, (baseUrl) => {
  if (!baseUrl) return

  fetchStatus().catch((error) => {
    console.error('Failed to load video images generation status:', error)
  })
}, {immediate: true})
</script>

<style scoped>
.selectable {
  user-select: text;
  word-break: break-all;
}
</style>
