<template>
  <v-dialog
    v-model="dialogLocal"
    :fullscreen="smAndDown"
    scrollable
    width="600"
    :transition="false"
  >
    <v-card>
      <DialogHeader
        @close="dialogLocal = false"
        :header="t('settings_labels.database.select_folder')"
        closable
        :buttons="[
          {
            icon: 'check',
            text: t('common.select'),
            color: 'success',
            variant: 'flat',
            function: select,
          },
        ]"
      />

      <v-card-text class="pa-2 pa-sm-4">
        <v-alert
          v-if="folderPath.trim() && isFolderExists === false"
          type="error"
          density="compact"
          variant="outlined"
        >
          {{ t('settings_labels.database.folder_missing') }}
        </v-alert>

        <v-btn
          v-if="isElectron"
          @click="chooseDir"
          class="mb-4"
          color="primary"
          rounded="pill"
          variant="flat"
        >
          <v-icon start>mdi-folder-open</v-icon>
          {{ t('settings_labels.database.select_folder') }}
        </v-btn>

        <v-form v-model="valid" ref="form">
          <v-text-field
            :label="t('settings_labels.database.path_to_folder')"
            v-model="folderPath"
            @blur="validateFolderPath"
            :rules="[(v) => !!v || t('validation.write_path')]"
            variant="outlined"
            rounded="pill"
          ></v-text-field>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useAppStore} from '@/stores/app'
import {useOperationsStore} from '@/stores/operations'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import {checkFileExists} from '@/services/fileService'
import {normalizePastedFilePath} from '@/utils/filePathInput'

const emit = defineEmits(['select'])

const {smAndDown} = useDisplay()
const {t} = useI18n()
const appStore = useAppStore()
const operationsStore = useOperationsStore()
const {isElectron} = storeToRefs(appStore)

const operations = computed(() => operationsStore)

const valid = ref(true)
const isFolderExists = ref(null)
const form = ref(null)

const onFolderPathInput = (value) => {
  if (operations.value.moving) {
    operations.value.moving.folderPath = normalizePastedFilePath(value)
  }
  isFolderExists.value = null
}

const validateFolderPath = async () => {
  const path = folderPath.value.trim()
  if (!path) {
    isFolderExists.value = null
    return
  }
  try {
    isFolderExists.value = await checkFileExists(path)
  } catch (error) {
    console.error('Error checking folder:', error)
    isFolderExists.value = false
  }
}

const dialogLocal = computed({
  get() {
    return operations.value?.moving?.dialog || false
  },
  set(value) {
    if (operations.value.moving) {
      operations.value.moving.dialog = value
    }
  },
})

const folderPath = computed({
  get() {
    return operations.value?.moving?.folderPath || ''
  },
  set(value) {
    onFolderPathInput(value)
  },
})

const chooseDir = async () => {
  try {
    const result = await window.electronAPI.invoke('showOpenDialog', ['openDirectory'])
    if (result.filePaths.length !== 0) {
      folderPath.value = result.filePaths[0]
      isFolderExists.value = true
    }
  } catch (error) {
    console.error('Error choosing directory:', error)
  }
}

const select = async () => {
  if (!form.value) return

  const {valid: isValid} = await form.value.validate()

  if (isValid) {
    try {
      isFolderExists.value = await checkFileExists(folderPath.value)

      if (isFolderExists.value) {
        emit('select', folderPath.value)
        dialogLocal.value = false
      }
    } catch (error) {
      console.error('Error checking folder:', error)
      isFolderExists.value = false
    }
  }
}
</script>