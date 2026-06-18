<template>
  <v-dialog
    v-model="watcherStore.dialogFolder"
    :fullscreen="xs"
    width="900"
    scrollable
  >
    <v-card>
      <DialogHeader
        @close="closeDialog"
        header="Watched folder"
        closable
      />

      <v-card-text class="pa-2 pa-sm-4">
        <div class="px-4 pb-4 d-flex justify-space-between flex-wrap">
          <div>
            <v-icon start>mdi-folder</v-icon>
            <span v-text="watcherStore.folder?.folder?.name"/>
          </div>
          <div v-text="watcherStore.folder?.folder?.path"
            class="text-medium-emphasis mt-1"/>
        </div>

        <v-expansion-panels v-model="panel">
          <v-expansion-panel
            v-for="(item, index) in watcherStore.folder.files"
            :key="item.type.id"
            rounded="xl"
          >
            <v-expansion-panel-title>
              <v-icon start>mdi-{{ item.type.icon }}</v-icon>
              <span>{{ getMediaTypeName(item.type, t) }}</span>
              <div v-if="panel !== index">
                <v-chip
                  v-if="item.new.length"
                  v-text="item.new.length"
                  color="success"
                  class="px-2 ml-2"
                  size="small"
                  variant="flat"
                />
                <v-chip
                  v-if="item.lost.length"
                  v-text="item.lost.length"
                  color="error"
                  class="px-2 ml-2"
                  size="small"
                  variant="flat"
                />
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div v-if="item.new.length > 0"
                class="mb-4">
                <v-card-actions>
                  <v-chip
                    v-text="`New (${item.new.length})`"
                    color="success"
                    class="mb-2"
                    size="small"
                    variant="flat"
                  />
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="copyPaths(item.new)"
                    color="primary"
                    class="px-4"
                    variant="flat"
                    rounded="xl"
                  >
                    <v-icon start>mdi-content-copy</v-icon>
                    Copy paths
                  </v-btn>
                  <v-btn
                    @click="addFiles(item.new, item.type.id)"
                    color="success"
                    class="px-4"
                    variant="flat"
                    rounded="xl"
                  >
                    <v-icon start>mdi-plus</v-icon>
                    Add files
                  </v-btn>
                </v-card-actions>
                <v-card variant="outlined"
                  class="pa-2">
                  <v-virtual-scroll
                    :height="item.new.length > 10 ? 150 : item.new.length * 15"
                    :items="item.new"
                    class="virtual-scroller"
                    :item-height="15"
                  >
                    <template v-slot:default="{ item }">
                      <div class="text-caption">{{ item }}</div>
                    </template>
                  </v-virtual-scroll>
                </v-card>
              </div>

              <div v-if="item.lost.length > 0">
                <v-card-actions>
                  <v-chip
                    v-text="`Lost (${item.lost.length})`"
                    color="error"
                    class="mb-2"
                    variant="flat"
                    rounded="xl"
                    size="small"
                  />
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="removeFiles(item.lost, item.type)"
                    color="error"
                    class="px-4"
                    variant="flat"
                    rounded="xl"
                  >
                    <v-icon start>mdi-delete</v-icon>
                    Delete files from app
                  </v-btn>
                </v-card-actions>
                <v-card variant="outlined"
                  class="pa-2">
                  <v-virtual-scroll
                    :height="item.lost.length > 10 ? 150 : item.lost.length * 15"
                    :items="item.lost"
                    class="virtual-scroller"
                    :item-height="15"
                  >
                    <template v-slot:default="{ item }">
                      <div class="text-caption">{{ item.path }}</div>
                    </template>
                  </v-virtual-scroll>
                </v-card>
              </div>

              <div
                v-if="item.lost.length == 0 && item.new.length == 0"
                class="text-center pa-8"
              >
                <v-icon size="80"
                  color="green">mdi-folder-sync
                </v-icon>
                <div class="text-green">
                  Media in the folder and in the database are synchronized!
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import DialogHeader from "@/components/elements/DialogHeader.vue"
import {useWatcherStore} from '@/stores/watcher'
import {useTasksStore} from '@/stores/tasks'
import {useDialogsStore} from '@/stores/dialogs'
import {useNotificationsStore} from '@/stores/notifications'
import {useEventBus} from '@/utils/eventBus'
import axios from "axios"
import useAppStore from "@/stores/app"
import {getMediaTypeName} from '@/utils/mediaTypeI18n'

// Stores
const watcherStore = useWatcherStore()
const tasksStore = useTasksStore()
const dialogsStore = useDialogsStore()
const notificationStore = useNotificationsStore()
const eventBus = useEventBus()
const {t} = useI18n()

// Props (если компонент получает данные через props)
// const props = defineProps({})

// Reactive data
const panel = ref(0)

// Methods
const closeDialog = () => {
  watcherStore.dialogFolder = false
}

const copyPaths = (files) => {
  let paths = ''

  for (let filePath of files) {
    paths = paths + '\n' + filePath
  }

  navigator.clipboard.writeText(paths)

  notificationStore.setNotification({
    type: "success",
    text: `Paths copied to clipboard`,
  })
}

const addFiles = (files, mediaTypeId) => {
  watcherStore.dialogFolder = false

  let paths = ''

  for (let filePath of files) {
    paths = paths + '\n' + filePath
  }

  tasksStore.mediaAdding.paths = paths
  tasksStore.mediaAdding.dialogProcess = true
  tasksStore.mediaAdding.active = true
  tasksStore.mediaAdding.media_type_id = mediaTypeId

  // Используем event bus или emit событие
  eventBus.emit("addMedia", () => {
    eventBus.emit("update:watcher")
  })
}

const removeFiles = async (lost, fileType) => {
  dialogsStore.confirm.text = `.Delete files from app?`
  dialogsStore.confirm.show = true
  dialogsStore.confirm.action = async () => {
    if (fileType.type !== 'video') return false

    watcherStore.dialogFolder = false

    let data = {
      metaId: null, // для тега
      with_file: false, // для медиа, удалить вместе с файлом
      type: fileType.type, // для медиа/видео,
    }

    const deletePromises = lost.map(async (item) => {
      const deleteData = {...data, ...{id: item.id, path: item.path}}

      return axios({
        method: "post",
        url: useAppStore().localhost + `/api/media/deleteOne`,
        data: deleteData,
      })
    })

    await Promise.all(deletePromises)

    // Используем event bus или emit событие
    if (eventBus) {
      eventBus.emit("removeEntitiesFromState", {
        ids: lost.map((i) => i.id),
        type: 'media',
      })

      eventBus.emit("update:watcher")
    }
  }
}
</script>