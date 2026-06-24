<template>
  <div class="mx-4">
    <settings-category-divider
      :title="t('settings.tabs.database')"
      icon="database-outline"
    />

    <!-- Actions -->
    <v-card-actions>
      <v-btn
        id="database_add"
        color="success"
        rounded
        variant="flat"
        class="pr-4 mb-2"
        @click="openAdd"
      >
        <v-icon icon="mdi-plus" class="mr-2"/>
        {{ t('settings_labels.database.add_new_database') }}
      </v-btn>

      <v-spacer/>

      <SettingsBackups/>
    </v-card-actions>

    <!-- List -->
    <v-list density="compact" rounded class="px-0 settings-outlined-list" bg-color="transparent">
      <v-list-item
        v-for="db in databases"
        :key="db.id"
        :class="{ active: db.active }"
        :color="db.active ? 'success' : undefined"
        @click="openActivate(db)"
        rounded="pill"
        variant="outlined"
        class="py-4"
      >
        <template v-if="db.active" #prepend>
          <v-avatar color="success">
            <v-icon icon="mdi-check"/>
          </v-avatar>
        </template>

        <v-list-item-title class="d-flex align-center">
          <span>{{ db.name }}</span>
          <v-chip v-if="db.active" color="success" size="x-small" label class="ml-2">
            {{ t('common.active') }}
          </v-chip>
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ t('settings_labels.database.created') }} {{ $readable.getDateFromMs(db.createdAt) }}
          <span class="ml-4">ID: {{ db.id }}</span>
          <span class="ml-4 text-medium-emphasis">{{ formatDbSize(db.id) }}</span>
        </v-list-item-subtitle>

        <template #append>
          <v-btn-group rounded="xl">
            <v-btn @click.stop="openEdit(db)" icon>
              <v-icon icon="mdi-pencil"/>
            </v-btn>

            <v-btn
              v-if="!db.active"
              icon
              @click.stop="confirmRemoving(db)"
            >
              <v-icon icon="mdi-close" color="error"/>
            </v-btn>
          </v-btn-group>
        </template>
      </v-list-item>
    </v-list>

    <!-- Add / Edit dialog -->
    <v-dialog v-model="dialogDb" max-width="600">
      <v-card>
        <DialogHeader
          :header="headerText"
          :buttons="buttons"
          closable
          @close="dialogDb = false"
        />

        <v-card-text>
          <v-form ref="formRef" v-model="valid">
            <v-text-field
              v-model="dbName"
              :label="t('common.name')"
              autofocus
              :rules="[v => $readable.validateName(v)]"
            />
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Activate confirm -->
    <DialogConfirm
      v-if="dialogActivateConfirm"
      :dialog="dialogActivateConfirm"
      :text="t('actions.activate_database')"
      @close="dialogActivateConfirm = false"
      @confirm="activateDb"
    />

    <!-- Restart dialog -->
    <v-dialog v-model="dialogSelected" max-width="400" persistent>
      <v-card>
        <v-card-text class="text-center pa-6">
          {{ t('settings_labels.database.database_activated') }}<br/>
          {{ t('settings_labels.database.restart_application') }}
        </v-card-text>

        <v-card-actions>
          <v-spacer/>
          <v-btn color="success" variant="flat" @click="relaunchApp">
            {{ t('common.ok') }}
          </v-btn>
          <v-spacer/>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useDialogsStore} from '@/stores/dialogs'

import SettingsBackups from '@/components/settings/database/SettingsBackups.vue'
import SettingsCategoryDivider from '@/components/ui/SettingsCategoryDivider.vue'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import DialogConfirm from '@/components/dialogs/DialogConfirm.vue'

/* stores */
const store = useAppStore()
const dialogsStore = useDialogsStore()
const {t} = useI18n()

/* state */
const dbName = ref('')
const db = ref(null)
const valid = ref(false)

const dialogDb = ref(false)
const dialogActivateConfirm = ref(false)
const dialogSelected = ref(false)

const headerText = ref('')
const buttons = ref([])

const formRef = ref(null)
const dbSizes = ref({})

/* computed */
const databases = computed({
  get: () => store.databases.sort((a, b) => {
    return b.active - a.active;
  }),
  set: v => (store.databases = v),
})

const apiUrl = computed(() => store.localhost)

async function loadDatabaseSizes() {
  const ids = databases.value.map(item => item.id)
  if (!ids.length) {
    dbSizes.value = {}
    return
  }

  try {
    const {data} = await axios.post(`${apiUrl.value}/api/task/getDatabaseSizes`, {ids})
    dbSizes.value = data.sizes || {}
  } catch (error) {
    console.error('Error loading database sizes:', error)
  }
}

function formatDbSize(id) {
  const size = dbSizes.value[id]
  if (size == null) return '…'
  return $readable.getReadableFileSize(size)
}

/* actions */
function openAdd() {
  dbName.value = ''
  headerText.value = t('settings_labels.database.adding_database')
  buttons.value = [
    {
      icon: 'plus',
      text: t('common.add'),
      color: 'success',
      action: addDb,
    },
  ]
  dialogDb.value = true
}

function openEdit(item) {
  db.value = item
  dbName.value = item.name
  headerText.value = t('settings_labels.database.editing_database')
  buttons.value = [
    {
      icon: 'content-save',
      text: t('common.save'),
      color: 'success',
      action: updateDb,
    },
  ]
  dialogDb.value = true
}

function openActivate(item) {
  if (item.active) return
  db.value = item
  dialogActivateConfirm.value = true
}

async function addDb() {
  await formRef.value.validate()
  if (!valid.value) return

  const config = store.config

  config.databases.push({
    id: Date.now().toString(16),
    name: dbName.value,
    active: false,
    createdAt: Date.now(),
  })

  await $operable.updateConfig({databases: config.databases})
  databases.value = config.databases

  db.value = [...databases.value].sort(
    (a, b) => b.createdAt - a.createdAt,
  )[0]

  dialogDb.value = false
  dialogActivateConfirm.value = true
}

async function updateDb() {
  await formRef.value.validate()
  if (!valid.value) return

  const config = store.config
  const target = config.databases.find(i => i.id === db.value.id)
  target.name = dbName.value

  await $operable.updateConfig({databases: config.databases})
  databases.value = config.databases

  dialogDb.value = false
}

async function activateDb() {
  const config = store.config

  config.databases = config.databases.map(i => ({
    ...i,
    active: i.id === db.value.id,
  }))

  await $operable.updateConfig({databases: config.databases})
  databases.value = config.databases

  dialogActivateConfirm.value = false
  dialogSelected.value = true
}

async function confirmRemoving(item) {
  db.value = item

  dialogsStore.confirm.text = 'The database will be permanently deleted. \n Are you sure?'
  dialogsStore.confirm.show = true
  dialogsStore.confirm.action = async () => {
    await axios.post(apiUrl.value + '/api/task/deleteDb', {
      id: item.id,
    })

    const config = store.config
    config.databases = config.databases.filter(i => i.id !== item.id)

    await $operable.updateConfig({databases: config.databases})
    databases.value = config.databases
  }
}

function relaunchApp() {
  window?.electronAPI?.invoke('relaunch')
}

onMounted(loadDatabaseSizes)
watch(databases, loadDatabaseSizes)
</script>

<style scoped>
.v-list-item.active {
  pointer-events: none;
}

.v-list-item.active .v-btn {
  pointer-events: all;
}
</style>
