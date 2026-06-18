<template>
  <v-snackbar
    v-model="show"
    :timeout="-1"
    vertical
    variant="flat"
    rounded="lg"
  >
    {{ text }}

    <template v-slot:actions>
      <v-btn
        @click="show = false"
        variant="text"
        class="px-4 mr-4"
      >
        <v-icon icon="mdi-close"
          start></v-icon>
        {{ t('common.close') }}
      </v-btn>

      <v-btn
        @click="openLink('https://mediachips.app/downloads')"
        color="success"
        variant="flat"
        class="px-4"
      >
        <v-icon icon="mdi-download"
          start></v-icon>
        {{ t('common.download') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {useAppStore} from '@/stores/app'
import {useI18n} from 'vue-i18n'

const appStore = useAppStore()
const {t} = useI18n()

const show = ref(false)
const text = ref(t('auto_update.new_version_available'))
const status = ref('info')

const openLink = (link) => {
  window.open(link, "_blank")
}

onMounted(() => {
  if (appStore.isElectron && window.electronAPI) {
    window.electronAPI.on("autoUpdater", (event, data) => {
      console.log('AutoUpdater event:', data)
      if (data && data.includes('Update available')) {
        status.value = 'success'
        show.value = true
        text.value = data
      }
    })
  }
})
</script>