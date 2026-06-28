<template>
  <v-snackbar
    v-model="show"
    :timeout="snackbarTimeout"
    vertical
    variant="flat"
    rounded="lg"
    :color="snackbarColor"
  >
    <div class="text-body-2">{{ message }}</div>

    <v-progress-linear
      v-if="status.state === 'downloading'"
      :model-value="Number(status.percent || 0)"
      color="success"
      class="mt-3"
      rounded
      height="6"
    />

    <template v-slot:actions>
      <v-btn
        v-if="status.state === 'available' && !status.manualInstall"
        @click="handleDownload"
        color="success"
        variant="flat"
        class="px-4"
        :loading="isDownloading"
      >
        <v-icon icon="mdi-download" start></v-icon>
        {{ t('auto_update.download') }}
      </v-btn>

      <v-btn
        v-if="status.state === 'available-manual' || showManualInstall"
        @click="handleInstall"
        color="success"
        variant="flat"
        class="px-4"
      >
        <v-icon icon="mdi-download" start></v-icon>
        {{ t('auto_update.download_dmg') }}
      </v-btn>

      <v-btn
        v-if="status.state === 'downloaded' && !status.manualInstall"
        @click="handleInstall"
        color="success"
        variant="flat"
        class="px-4"
      >
        <v-icon icon="mdi-restart" start></v-icon>
        {{ t('auto_update.install_now') }}
      </v-btn>

      <v-btn
        v-if="status.state === 'error'"
        @click="handleRetry"
        color="primary"
        variant="flat"
        class="px-4 mr-2"
      >
        <v-icon icon="mdi-refresh" start></v-icon>
        {{ t('auto_update.retry') }}
      </v-btn>

      <v-btn
        v-if="showFallbackDownload"
        @click="openReleases"
        color="success"
        variant="flat"
        class="px-4 mr-2"
      >
        <v-icon icon="mdi-open-in-new" start></v-icon>
        {{ t('common.download') }}
      </v-btn>

      <v-btn
        v-if="showDismiss"
        @click="handleDismiss"
        variant="text"
        class="px-4"
      >
        <v-icon icon="mdi-close" start></v-icon>
        {{ dismissLabel }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import {computed, onMounted, onBeforeUnmount, ref, watch} from 'vue'
import {useAppStore} from '@/stores/app'
import {useI18n} from 'vue-i18n'
import {useAppUpdater} from '@/composable/useAppUpdater'

const appStore = useAppStore()
const {t} = useI18n()
const {status, lastCheckManual, ensureInitialized, check, download, install, dismiss, destroy} = useAppUpdater()

const show = ref(false)
const isDownloading = ref(false)
const releasesUrl = 'https://github.com/fupdec/MediaChips/releases/latest'

const message = computed(() => {
  switch (status.value.state) {
    case 'checking':
      return t('auto_update.checking')
    case 'available':
      return t('auto_update.available', {
        current: status.value.currentVersion,
        next: status.value.nextVersion,
      })
    case 'available-manual':
      return t('auto_update.available_manual', {
        current: status.value.currentVersion,
        next: status.value.nextVersion,
      })
    case 'downloading':
      return t('auto_update.downloading', {
        percent: Math.round(Number(status.value.percent || 0)),
      })
    case 'downloaded':
      return t('auto_update.ready_to_install', {
        version: status.value.nextVersion,
      })
    case 'downloaded-manual':
      return t('auto_update.ready_to_install_manual', {
        version: status.value.nextVersion,
      })
    case 'up-to-date':
      return t('auto_update.up_to_date', {
        version: status.value.currentVersion,
      })
    case 'error':
      if (isSignatureError.value) {
        return t('auto_update.mac_unsigned_error')
      }
      return t('auto_update.error', {
        message: status.value.message || t('auto_update.error_unknown'),
      })
    default:
      return ''
  }
})

const snackbarColor = computed(() => {
  if (status.value.state === 'error' && !isSignatureError.value) return 'error'
  if (['downloaded', 'downloaded-manual'].includes(status.value.state)) return 'success'
  return undefined
})

const isSignatureError = computed(() => {
  const message = String(status.value.message || '')
  return /code signature/i.test(message) || /не удалось удовлетворить требован/i.test(message)
})

const showManualInstall = computed(() => (
  status.value.state === 'downloaded-manual' ||
  (status.value.state === 'error' && isSignatureError.value)
))

const snackbarTimeout = computed(() => {
  if (['checking', 'downloading', 'available', 'available-manual', 'downloaded', 'downloaded-manual', 'error'].includes(status.value.state)) {
    return -1
  }
  return 4000
})

const showDismiss = computed(() => (
  ['available', 'available-manual', 'downloaded', 'downloaded-manual', 'error', 'up-to-date'].includes(status.value.state)
))

const dismissLabel = computed(() => (
  status.value.state === 'up-to-date' ? t('common.close') : t('auto_update.later')
))

const showFallbackDownload = computed(() => (
  status.value.state === 'disabled' ||
  (status.value.state === 'error' && !isSignatureError.value)
))

watch(status, (value) => {
  if (value.state === 'checking' && lastCheckManual.value) {
    show.value = true
    return
  }

  if (['available', 'available-manual', 'downloading', 'downloaded', 'downloaded-manual', 'error'].includes(value.state)) {
    show.value = true
    return
  }

  if (value.state === 'up-to-date' && lastCheckManual.value) {
    show.value = true
  }
}, {deep: true})

async function handleDownload() {
  isDownloading.value = true
  try {
    await download()
  } finally {
    isDownloading.value = false
  }
}

function handleInstall() {
  install()
}

function handleRetry() {
  check({manual: true})
}

function handleDismiss() {
  show.value = false
  dismiss()
}

function openReleases() {
  window.open(String(status.value.releasesUrl || releasesUrl), '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  if (appStore.isElectron && window.electronAPI?.updater) {
    ensureInitialized()
  }
})

onBeforeUnmount(() => {
  destroy()
})
</script>
