<template>
  <v-dialog
    v-model="isDialogVisible"
    :fullscreen="xs"
    scrollable
    width="800"
  >
    <template v-if="!hideActivator" v-slot:activator="{ props: activatorProps }">
      <AppBarButton
        v-bind="activatorProps"
        :action="()=>isDialogVisible=true"
        :text="t('appbar.buttons.add_files')"
        :color="buttonColor"
        :size="buttonSize"
        :variant="buttonVariant"
        icon="plus"
      />
    </template>
    <template #default>
      <v-card>
        <!-- Заголовок диалога с кнопками действий -->
        <DialogHeader
          @close="isDialogVisible = false"
          :header="dialogHeader"
          :buttons="dialogActionButtons"
          closable
        />

        <!-- Основное содержимое диалога -->
        <v-card-text
          @drop.prevent="handleFileDrop"
          @dragenter.prevent
          @dragover.prevent
          class="pa-2 pa-sm-4"
        >
          <!-- Кнопки выбора папок (только в Electron) -->
          <v-btn
            v-if="isElectron"
            @click="selectMultipleDirectories"
            color="primary"
            rounded="lg"
            variant="flat"
            class="mb-6"
          >
            <v-icon start>mdi-folder-open</v-icon>
            {{ t('media.adding.select_folders') }}
          </v-btn>

          <!-- Форма с путями к файлам -->
          <v-form ref="mediaForm" v-model="isFormValid">
            <v-textarea
              v-model="mediaAddingState.paths"
              :rules="[requiredPathRule]"
              :label="t('media.adding.paths_label')"
              :hint="t('media.adding.paths_hint')"
              variant="outlined"
              no-resize
              autofocus
              rounded="lg"
              rows="5"
            />
          </v-form>

          <!-- Проверка дубликатов по содержимому файла -->
          <v-checkbox
            v-model="mediaAddingState.is_check_duplicates"
            :label="t('media.adding.check_duplicates')"
            class="mt-0 mb-2 mr-4"
            hide-details
          />

          <v-alert
            v-if="isImageAdding"
            type="info"
            variant="tonal"
            density="compact"
            rounded="xl"
            class="mb-2 text-caption"
          >
            {{ t('media.adding.images_skip_by_path_hint') }}
          </v-alert>

          <!-- Опция парсинга тегов с кнопкой помощи -->
          <div class="d-flex align-center mb-2">
            <v-checkbox
              v-model="mediaAddingState.is_parsing"
              :label="t('media.adding.parse_tags')"
              class="mt-0"
              hide-details
            />
            <button-documentation id="media.parser"></button-documentation>
          </div>

          <!-- Опция исключения путей -->
          <v-checkbox
            v-model="tasksStore.mediaAdding.is_exclude"
            :label="t('media.adding.exclude_paths')"
            class="mt-0"
          />

          <!-- Кнопки выбора папок (только в Electron) -->
          <v-btn
            v-if="tasksStore.mediaAdding.is_exclude && isElectron"
            @click="selectMultipleDirectoriesExcluded"
            color="primary"
            rounded="lg"
            variant="flat"
            class="mb-6"
          >
            <v-icon start>mdi-folder-open</v-icon>
            {{ t('media.adding.select_folders') }}
          </v-btn>

          <!-- Поле для исключенных путей (показывается условно) -->
          <v-textarea
            v-if="tasksStore.mediaAdding.is_exclude"
            v-model="mediaAddingState.excluded"
            :label="t('media.adding.excluded_paths_label')"
            :hint="t('media.adding.excluded_paths_hint')"
            variant="outlined"
            rounded="lg"
            no-resize
            rows="3"
          />
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'
import {useTasksStore} from '@/stores/tasks'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {getCurrentMediaType, isImageMediaType} from '@/utils/mediaType'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'

// Компоненты
import DialogHeader from '@/components/elements/DialogHeader.vue'
import AppBarButton from "@/components/app/appbar/AppBarButton.vue"
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue"
import {useMediaAdding} from '@/composable/AddingMedia'


// Хуки
const {t} = useI18n()
const {xs} = useDisplay()

const props = defineProps({
  buttonColor: {
    type: String,
    default: undefined,
  },
  buttonSize: {
    type: String,
    default: undefined,
  },
  buttonVariant: {
    type: String,
    default: 'text',
  },
  hideActivator: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Boolean,
    default: undefined,
  },
})

const emit = defineEmits(['update:modelValue'])

// Pinia stores
const tasksStore = useTasksStore()
const appStore = useAppStore()
const itemsStore = useItemsStore()

// Composable
const mediaAdding = useMediaAdding()

// Реактивные переменные
const internalDialogVisible = ref(false)
const isFormValid = ref(false)
const mediaForm = ref()

const isDialogVisible = computed({
  get() {
    return props.modelValue !== undefined
      ? props.modelValue
      : internalDialogVisible.value
  },
  set(value) {
    internalDialogVisible.value = value
    emit('update:modelValue', value)
  },
})

// Computed свойства
const isElectron = computed(() => appStore.isElectron)
const mediaAddingState = computed(() => tasksStore.mediaAdding)

const currentMediaType = computed(() =>
  getCurrentMediaType(
    appStore.mediaTypes,
    tasksStore.mediaAdding.media_type_id || itemsStore.environment?.media_type_id,
  )
)

const isImageAdding = computed(() => isImageMediaType(currentMediaType.value))

const dialogHeader = computed(() => {
  const typeName = getMediaTypeName(currentMediaType.value, t)
  if (typeName) {
    return t('media.adding.files_for_type', {type: typeName})
  }
  return t('media.adding.files')
})

// Кнопки действий в диалоге
const dialogActionButtons = computed(() => [
  {
    icon: 'plus',
    text: t('common.add'),
    color: 'success',
    variant: 'flat',
    action: startMediaAddingProcess
  }
])

// Правило валидации для обязательного поля путей
const requiredPathRule = (value) => {
  if (!value || value.trim().length === 0) {
    return t('validation.path_required')
  }
  return true
}

// Методы

/**
 * Инициализирует состояние диалога при монтировании
 */
onMounted(() => {
  resetDialogState()
})

const handleAddMedia = async () => {
  await mediaAdding.addMedia()
}

/**
 * Обрабатывает изменения пропса dialog для синхронизации с локальным состоянием
 */
watch(isDialogVisible, (newValue) => {
  if (newValue) {
    resetDialogState()
  }
})

/**
 * Сбрасывает состояние диалога к начальным значениям
 */
const resetDialogState = () => {
  syncMediaTypeFromContext()
  tasksStore.mediaAdding.paths = ''
  tasksStore.mediaAdding.excluded = ''
  tasksStore.mediaAdding.skipFileScan = false
  tasksStore.mediaAdding.directFiles = []
  if (mediaForm.value) {
    mediaForm.value.reset()
  }
}

const syncMediaTypeFromContext = () => {
  const mediaTypeId = tasksStore.mediaAdding.media_type_id
    || itemsStore.environment?.media_type_id
  if (mediaTypeId) {
    tasksStore.mediaAdding.media_type_id = Number(mediaTypeId)
  }
}

/**
 * Выбирает несколько директорий через системный диалог (только Electron)
 */
const selectMultipleDirectories = async () => {
  const paths = await $operable.showOpenDialog(['openDirectory', 'multiSelections'])
  tasksStore.mediaAdding.paths = paths
}

const selectMultipleDirectoriesExcluded = async () => {
  const paths = await $operable.showOpenDialog(['openDirectory', 'multiSelections'])
  tasksStore.mediaAdding.excluded = paths
}

/**
 * Запускает процесс добавления медиафайлов после валидации формы
 */
const startMediaAddingProcess = async () => {
  const {valid} = await mediaForm.value.validate()

  if (!valid) {
    console.warn('Form validation failed')
    return
  }

  // Активируем задачу и показываем диалог процесса
  syncMediaTypeFromContext()
  tasksStore.mediaAdding.dialogProcess = true
  tasksStore.mediaAdding.active = true
  isDialogVisible.value = false

  await handleAddMedia()
}

/**
 * Обрабатывает событие перетаскивания файлов в диалог
 * @param {DragEvent} event - Событие перетаскивания
 */
const handleFileDrop = (event) => {
  if (!isElectron.value) return

  const files = event.dataTransfer.files
  let existingPaths = tasksStore.mediaAdding.paths || ''

  // Добавляем пути новых файлов
  const newPaths = Array.from(files)
    .map(file => file.path)
    .filter(Boolean)
    .join('\n')

  if (newPaths) {
    const updatedPaths = existingPaths
      ? `${existingPaths}\n${newPaths}`
      : newPaths

    tasksStore.mediaAdding.paths = updatedPaths
  }
}
</script>