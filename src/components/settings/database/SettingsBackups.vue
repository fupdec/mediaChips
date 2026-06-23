<template>
  <div>
    <!-- OPEN -->
    <v-btn
      id="database_backups"
      color="primary"
      rounded
    >
      <v-icon icon="mdi-database" class="mr-2"/>
      {{ t('settings_labels.database.manage_backups') }}
    </v-btn>

    <!-- MAIN DIALOG -->
    <v-dialog
      :fullscreen="xs"
      :model-value="dialog"
      activator="#database_backups"
      @after-enter="manageBackups"
      max-width="800"
      scrollable
      persistent
    >
      <v-card>
        <DialogHeader
          :header="t('settings_labels.database.backups_management')"
          closable
          @close="dialog = false"
        />

        <!-- ACTIONS -->
        <v-card-actions class="flex-wrap mt-4 mx-4">
          <v-btn
            prepend-icon="mdi-database-plus"
            :text="t('settings_labels.database.create_backup')"
            color="success"
            variant="tonal"
            @click="createBackup"
          />

          <v-btn
            prepend-icon="mdi-database-refresh"
            :text="t('settings_labels.database.restore_backup')"
            color="warning"
            variant="tonal"
            :disabled="!isSelectedSingle"
            @click="dialogRestoreConfirm = true"
          />

          <v-btn
            prepend-icon="mdi-database-remove"
            :text="t('settings_labels.database.delete_backup')"
            color="error"
            variant="tonal"
            :disabled="notSelected"
            @click="dialogDelete = true"
          />

          <v-btn
            prepend-icon="mdi-database-import"
            :text="t('settings_labels.database.import_backup')"
            color="info"
            variant="tonal"
            @click="dialogImport = true"
          />

          <v-btn
            prepend-icon="mdi-database-export"
            :text="t('settings_labels.database.export_backup')"
            color="info"
            variant="tonal"
            :disabled="notSelected"
            @click="dialogExport = true"
          />
          <v-spacer></v-spacer>
        </v-card-actions>

        <!-- TABLE -->
        <v-card-text>
          <v-data-table
            v-model="selected"
            :loading="!isLoaded"
            :headers="headers"
            :items="backups"
            item-value="date"
            show-select
            hide-default-footer
            return-object
            :no-data-text="t('settings_labels.database.no_backups')"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- CONFIRMS -->
    <DialogConfirm
      :dialog="dialogRestoreConfirm"
      :text="t('settings_labels.database.restore_confirm')"
      @confirm="restoreBackup"
    />

    <DialogConfirm
      :dialog="dialogRestoreFinished"
      :closable="false"
      :text="restartText"
      @confirm="relaunchApp"
    />

    <DialogDeleteConfirm
      v-if="dialogDelete"
      :dialog="dialogDelete"
      :text="t('settings_labels.database.delete_confirm')"
      @close="dialogDelete = false"
      @delete="deleteBackups"
    ></DialogDeleteConfirm>

    <v-dialog v-model="dialogImport" width="700">
      <v-card>
        <DialogHeader
          @close="dialogImport = false"
          :header="t('settings_labels.database.select_backup')"
          closable
          :buttons="[
            {
              icon: 'database-import',
              text: t('settings_labels.database.import_backup'),
              color: 'success',
              outlined: false,
              disabled: !filePath,
              action: importBackup,
            },
          ]"
        />

        <v-card-text class="pt-8">
          <v-alert
            v-if="filePath.trim() && isFileExists === false"
            type="error"
            density="compact"
            rounded="xl"
            variant="tonal"
            class="mb-4"
          >
            {{ t('settings_labels.database.file_missing') }}
          </v-alert>

          <v-btn v-if="isElectron" @click="chooseFile" class="mb-4" color="primary" variant="flat">
            <v-icon left>mdi-folder-open</v-icon>
            {{ t('settings_labels.database.select_backup') }}
          </v-btn>

          <v-text-field
            :model-value="filePath"
            @update:model-value="onFilePathInput"
            @blur="validateFilePath"
            :label="t('settings_labels.database.path_to_backup')"
            autofocus
          ></v-text-field>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogExport" width="700">
      <v-card>
        <DialogHeader
          @close="dialogExport = false"
          :header="t('settings_labels.database.select_folder')"
          closable
          :buttons="[
            {
              icon: 'database-export',
              text: t('settings_labels.database.export_backup'),
              color: 'success',
              outlined: false,
              disabled: !folderPath,
              action: exportBackup,
            },
          ]"
        />

        <v-card-text class="pt-8">
          <v-alert
            v-if="folderPath.trim() && isFolderExists === false"
            type="error"
            density="compact"
            rounded="xl"
            variant="tonal"
            class="mb-4"
          >
            {{ t('settings_labels.database.folder_missing') }}
          </v-alert>

          <v-btn v-if="isElectron" @click="chooseDir" class="mb-4" color="primary" rounded depressed>
            <v-icon left>mdi-folder-open</v-icon>
            {{ t('settings_labels.database.select_folder') }}
          </v-btn>

          <v-text-field
            :model-value="folderPath"
            @update:model-value="onFolderPathInput"
            @blur="validateFolderPath"
            :label="t('settings_labels.database.path_to_folder')"
            autofocus
          ></v-text-field>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useDialogsStore} from '@/stores/dialogs'

import DialogHeader from '@/components/elements/DialogHeader.vue'
import DialogConfirm from '@/components/dialogs/DialogConfirm.vue'
import DialogDeleteConfirm from '@/components/dialogs/DialogDeleteConfirm.vue'
import {normalizePastedFilePath} from '@/utils/filePathInput'

/* ---------- UI ---------- */

const {xs} = useDisplay()
const {t} = useI18n()

const dialog = ref(false)
const dialogRestoreConfirm = ref(false)
const dialogRestoreFinished = ref(false)
const dialogDelete = ref(false)
const dialogImport = ref(false)
const dialogExport = ref(false)

/* ---------- DATA ---------- */

const isLoaded = ref(false)
const backups = ref([])
const selected = ref([])

const filePath = ref('')
const folderPath = ref('')

const onFilePathInput = (value) => {
  filePath.value = normalizePastedFilePath(value)
  isFileExists.value = null
}

const onFolderPathInput = (value) => {
  folderPath.value = normalizePastedFilePath(value)
  isFolderExists.value = null
}

const validateFilePath = async () => {
  const path = normalizePastedFilePath(filePath.value)
  filePath.value = path
  if (!path) {
    isFileExists.value = null
    return
  }
  isFileExists.value = await $operable.checkFileExists(path)
}

const validateFolderPath = async () => {
  const path = normalizePastedFilePath(folderPath.value)
  folderPath.value = path
  if (!path) {
    isFolderExists.value = null
    return
  }
  isFolderExists.value = await $operable.checkFileExists(path)
}

const isFileExists = ref(null)
const isFolderExists = ref(null)

/* ---------- STORE ---------- */

const appStore = useAppStore()
const dialogsStore = useDialogsStore()

const apiUrl = computed(() => appStore.localhost)
const isElectron = computed(() => appStore.isElectron)
const dialogProcess = computed({
  get: () => dialogsStore.process,
  set: v => (dialogsStore.process = v),
})

/* ---------- TABLE ---------- */

const headers = computed(() => [
  {title: t('settings_labels.database.date_time'), key: 'date'},
  {title: t('settings_labels.database.total_size_mb'), key: 'size', sort: (a, b) => a - b},
])

const notSelected = computed(() => selected.value.length === 0)
const isSelectedSingle = computed(() => selected.value.length === 1)

/* ---------- TEXT ---------- */

const restartText = computed(() =>
  isElectron.value
    ? t('settings_labels.database.restore_complete_restart')
    : t('settings_labels.database.restore_complete_manual_restart')
)

/* ---------- METHODS ---------- */

function manageBackups() {
  dialog.value = true
  setTimeout(getBackups, 300)
}

async function getBackups() {
  isLoaded.value = false
  try {
    const {data} = await axios.get(`${apiUrl.value}/api/TasksBackups/getBackups`)
    backups.value = data
  } catch {
    backups.value = []
  }
  isLoaded.value = true
  selected.value = []
}

async function createBackup() {
  dialogsStore.process.show = true
  await axios.get(`${apiUrl.value}/api/TasksBackups/createBackup`)
  await getBackups()
  dialogsStore.process.show = false
}

async function deleteBackups() {
  dialogsStore.process.show = true
  for (const i of selected.value) {
    await axios.post(`${apiUrl.value}/api/TasksBackups/deleteBackup`, {
      name: i.date,
    })
  }
  dialogsStore.process.show = false
  selected.value = []
  await getBackups()
}

async function restoreBackup() {
  dialogsStore.process.show = true
  await axios.post(`${apiUrl.value}/api/TasksBackups/restoreBackup`, {
    name: selected.value[0].date,
  })
  dialogsStore.process.show = false
  dialogRestoreFinished.value = true
}

async function importBackup() {
  const path = normalizePastedFilePath(filePath.value)
  filePath.value = path
  if (!path) return

  isFileExists.value = await $operable.checkFileExists(path)
  if (isFileExists.value === false) return

  $operable.setNotification({
    type: 'info',
    title: t('settings_labels.database.import_backup'),
    text: t('settings_labels.database.import_backup_started'),
  })

  try {
    await axios.post(`${apiUrl.value}/api/TasksBackups/importBackup`, {path})
    await getBackups()
    dialogImport.value = false
    filePath.value = ''
    $operable.setNotification({
      type: 'success',
      title: t('settings_labels.database.import_backup'),
      text: t('settings_labels.database.import_backup_success'),
    })
  } catch (error) {
    console.error('Import backup failed:', error)
    const message = error.response?.data?.message
      || (typeof error.response?.data === 'string' ? error.response.data : null)
      || t('settings_labels.database.failed_import_backup')
    $operable.setNotification({
      type: 'error',
      title: t('settings_labels.database.import_backup'),
      text: message,
    })
  }
}

async function exportBackup() {
  const path = normalizePastedFilePath(folderPath.value)
  folderPath.value = path
  if (!path) return

  isFolderExists.value = await $operable.checkFileExists(path)
  if (isFolderExists.value === false) return

  dialogExport.value = false
  dialogsStore.process.show = true

  try {
    for (const i of selected.value) {
      await axios.post(`${apiUrl.value}/api/TasksBackups/exportBackup`, {
        archive: i.date,
        path,
      })
    }
  } catch (error) {
    console.error('Export backup failed:', error)
    $operable.setNotification({
      text: error.response?.data?.message || t('settings_labels.database.failed_export_backup'),
      type: 'error',
    })
  }

  dialogsStore.process.show = false
  selected.value = []
  folderPath.value = ''
  await getBackups()
}

function relaunchApp() {
  if (isElectron.value) {
    window.electronAPI.invoke('relaunch')
  }
}

async function chooseDir() {
  const res = await window.electronAPI.invoke('showOpenDialog', ['openDirectory'])
  if (res.filePaths?.length) {
    folderPath.value = res.filePaths[0]
    isFolderExists.value = true
  }
}

async function chooseFile() {
  const res = await window.electronAPI.invoke('showOpenDialog', ['openFile'])
  if (res.filePaths?.length) {
    filePath.value = res.filePaths[0]
    isFileExists.value = true
  }
}
</script>
