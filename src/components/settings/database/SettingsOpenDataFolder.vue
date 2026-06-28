<template>
  <div class="mx-4 pb-2">
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      rounded="xl"
      class="mb-4"
    >
      <span class="text-caption">
        {{ t("settings_labels.tools.open_app_data_folder") }}
      </span>
    </v-alert>

    <v-btn
      @click="openFolder"
      color="primary"
      rounded
      variant="flat"
    >
      <v-icon icon="mdi-folder-open" start/>
      {{ t("settings_labels.tools.open_data_folder_btn") }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import path from "path-browserify"
import {useI18n} from "vue-i18n"
import {useAppStore} from "@/stores/app"
import {openPath} from '@/services/shellService'

const store = useAppStore()
const {t} = useI18n()

const openFolder = () => {
  if (!store.dbPath) return
  const folder = path.dirname(store.dbPath)
  openPath(folder, false)
}
</script>
