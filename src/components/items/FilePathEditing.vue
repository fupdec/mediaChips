<template>
  <div class="editing">
    <v-card class="rounded-xl" color="rgba(150, 150, 150, 0.09)" flat>
      <v-card-text class="pb-0">
        <div class="text-medium-emphasis text-caption">{{ t('media.file_path.operations') }}</div>
        <div>
          <span>{{ t('media.file_path.full_path') }} </span>
          <span>{{ media.path }}</span>
        </div>

        <v-alert
          v-if="!is_file_exists"
          type="error"
          icon="mdi-file-alert"
          class="caption mb-0 mt-2"
          density="compact"
          variant="tonal"
          rounded="xl"
        >
          {{ t('media.file_path.file_missing_operations_unavailable') }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="flex-wrap px-4 pb-4">
        <v-btn
          @click="openDialogEdit"
          color="primary"
          variant="flat"
          rounded="xl"
          class="px-4"
        >
          <v-icon start icon="mdi-folder-edit"></v-icon>
          {{ t('media.file_path.edit_path') }}
        </v-btn>

        <v-btn
          @click="openFolder"
          :disabled="!is_file_exists"
          color="primary"
          variant="flat"
          rounded="xl"
          class="px-4"
        >
          <v-icon start icon="mdi-folder-open"></v-icon>
          {{ t('media.file_path.open_directory') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="dialog_edit" width="840">
      <v-card>
        <DialogHeader
          @close="closeDialog"
          :header="t('media.file_path.editing_path')"
          :buttons="headerButtons"
          closable
        ></DialogHeader>

        <v-card-text class="pt-4">
          <v-form v-model="valid" ref="form">
            <v-text-field
              v-model="file_path"
              @update:model-value="onPathInput"
              :disabled="is_file_moving"
              :rules="[v => !!v || t('validation.valid_path_required')]"
              :hint="t('media.file_path.full_path_hint')"
              autofocus
              variant="filled"
              density="compact"
              class="mb-2"
            ></v-text-field>
          </v-form>

          <v-alert
            v-if="!is_file_exists"
            type="error"
            icon="mdi-file-alert"
            class="text-caption"
            density="compact"
            variant="tonal"
            rounded="xl"
          >
            {{ t('media.file_path.file_missing_operations_unavailable') }}
          </v-alert>

          <v-alert
            v-if="isAnotherMoveActive"
            type="warning"
            density="compact"
            variant="tonal"
            rounded="xl"
            class="text-caption"
          >
            {{ t('media.file_path.move_in_progress') }}
          </v-alert>

          <div v-if="is_file_exists && is_file_moving" class="mt-2">
            <div class="text-caption text-medium-emphasis mb-1">
              {{ move_status || t('media.file_path.file_moving') }}
            </div>
            <div v-if="move_size" class="text-caption text-medium-emphasis mb-2">
              {{ t('media.file_path.file_moving_size', { size: move_size }) }}
              <span v-if="move_eta"> • {{ t('media.file_path.file_moving_eta', { eta: move_eta }) }}</span>
            </div>
            <v-progress-linear
              :model-value="move_progress"
              color="primary"
              height="6"
              rounded
              striped
              :indeterminate="move_progress === 0"
            ></v-progress-linear>
          </div>

          <v-card-actions v-if="is_file_exists">
            <v-checkbox
              v-model="move_file"
              :disabled="is_file_moving || !is_different_path"
              :label="t('actions.move_rename_file')"
              class="mt-0"
              hide-details
            ></v-checkbox>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import path from 'path-browserify'
import axios from "axios"
import { useAppStore } from '@/stores/app'
import { useOperationsStore } from '@/stores/operations'
import DialogHeader from "@/components/elements/DialogHeader.vue"

const props = defineProps({
  media: Object,
})
const { t } = useI18n()

const emit = defineEmits(['update'])

const valid = ref(true)
const dialog_edit = ref(false)
const file_path = ref('')
const move_file = ref(true)
const is_different_path = ref(false)
const is_file_moving = ref(false)
const is_file_exists = ref(false)
const move_progress = ref(0)
const move_status = ref('')
const move_size = ref('')
const move_eta = ref('')
const form = ref(null)

const appStore = useAppStore()
const operationsStore = useOperationsStore()

const apiUrl = computed(() => appStore.localhost)

const isAnotherMoveActive = computed(() => operationsStore.moving.active && !is_file_moving.value)

const headerButtons = computed(() => [{
  icon: 'content-save',
  color: 'success',
  text: t('common.save'),
  disabled: !file_path.value || is_file_moving.value || isAnotherMoveActive.value,
  action: updateFilePath,
}])

const onPathInput = (value) => {
  is_different_path.value = path.normalize(props.media.path) !== path.normalize(value || '')
}

const resetMoveState = () => {
  move_progress.value = 0
  move_status.value = ''
  move_size.value = ''
  move_eta.value = ''
}

const closeDialog = () => {
  if (is_file_moving.value) return
  dialog_edit.value = false
}

const openFolder = () => {
  if (!props.media?.path) return
  $operable.openPath(props.media.path, true)
}

const savePathToDb = async (filePath, { notify = true } = {}) => {
  const basename = path.basename(filePath)

  try {
    await axios({
      method: "post",
      url: `${apiUrl.value}/api/media/updatePath`,
      data: {
        id: props.media.id,
        path: filePath,
      },
    })

    is_different_path.value = false
    emit('update', { ...props.media, path: filePath })

    if (notify) {
      $operable.setNotification({
        type: "success",
        title: t("media.file_path.updated"),
        text: basename,
        icon: 'folder-edit',
      })
    }

    return true
  } catch (error) {
    if (notify) {
      $operable.setNotification({
        type: "error",
        title: t("media.file_path.already_exists"),
        text: basename,
        icon: 'folder-edit',
      })
    }
    return false
  }
}

const handleMoveProgress = (msg) => {
  if (msg.type === 'init') {
    move_size.value = operationsStore.formatSize(msg.totalBytes || 0)
    move_eta.value = msg.estimatedSeconds > 0
      ? operationsStore.formatEta(msg.estimatedSeconds)
      : ''
    move_progress.value = 0
  }

  if (msg.type === 'progress') {
    move_progress.value = msg.overallProgress || 0
    move_status.value = t('media.file_path.file_moving_progress', { file: msg.fileName })
    if (msg.etaSeconds > 0) {
      move_eta.value = operationsStore.formatEta(msg.etaSeconds)
    }
  }
}

const updateFilePath = async () => {
  if (!form.value || is_file_moving.value) return

  const { valid: formValid } = await form.value.validate()
  if (!formValid) return
  if (!file_path.value) return

  const filePath = file_path.value
  const basename = path.basename(filePath)
  const shouldMove = is_file_exists.value && is_different_path.value && move_file.value

  if (shouldMove) {
    is_file_moving.value = true
    resetMoveState()

    try {
      const result = await operationsStore.renameFilePath({
        oldPath: props.media.path,
        newPath: filePath,
        onProgress: handleMoveProgress,
        notifyOnComplete: false,
      })

      if (!result?.success) {
        if (!result?.aborted && result?.failed === 0) {
          $operable.setNotification({
            type: "error",
            title: t("media.file_path.renaming_failed"),
            text: basename,
            icon: 'folder-edit',
          })
        }
        return
      }

      const saved = await savePathToDb(filePath, { notify: false })

      if (saved) {
        $operable.setNotification({
          type: "success",
          title: t("media.file_path.moved_renamed"),
          text: basename,
          icon: 'folder-edit',
        })
        dialog_edit.value = false
        await checkFileExists(filePath)
      }
    } finally {
      is_file_moving.value = false
      resetMoveState()
    }
    return
  }

  const saved = await savePathToDb(filePath)
  if (saved) {
    dialog_edit.value = false
    await checkFileExists(filePath)
  }
}

const checkFileExists = async (filePath) => {
  is_file_exists.value = await $operable.checkFileExists(filePath)
}

const openDialogEdit = async () => {
  file_path.value = props.media.path
  is_different_path.value = false
  resetMoveState()
  dialog_edit.value = true
  await nextTick()
  await form.value?.resetValidation()
  await form.value?.validate()
}

onMounted(async () => {
  await checkFileExists(props.media.path)
})
</script>
