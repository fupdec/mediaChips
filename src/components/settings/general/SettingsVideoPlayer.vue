<script setup lang="ts">
import SettingsCategoryDivider from '@/components/ui/SettingsCategoryDivider.vue'
import SettingsSwitch from '@/components/ui/SettingsSwitch.vue'
import ButtonDocumentation from '@/components/ui/ButtonDocumentation.vue'
import {useSettingsStore} from '@/stores/settings'
import {useAppStore} from '@/stores/app'
import {useI18n} from 'vue-i18n'
import {fetchTranscodeCacheStats} from '@/services/transcodeService'
import {typedApi} from '@/services/typedApi'
import {getReadableFileSize} from '@/services/formatUtils'
import {setNotification} from '@/services/notificationService'
import {computed, onMounted, ref} from 'vue'

const SETTINGS = useSettingsStore()
const appStore = useAppStore()
const {t} = useI18n()
const clearingCache = ref(false)
const cacheBytes = ref(0)

const cacheUsageLabel = computed(() =>
  t('settings_labels.video_player.transcode_cache_usage', {
    size: getReadableFileSize(cacheBytes.value),
  }),
)

const loadCacheStats = async () => {
  try {
    const stats = await fetchTranscodeCacheStats()
    cacheBytes.value = stats?.bytes || 0
  } catch {
    cacheBytes.value = 0
  }
}

const clearTranscodeCache = async () => {
  clearingCache.value = true

  try {
    const response = await typedApi.clearTranscodeCache()
    cacheBytes.value = 0
    setNotification({
      type: 'success',
      title: t('settings_labels.video_player.title'),
      text: t('settings_labels.video_player.clear_transcode_cache_done', {
        count: response.data?.removed || 0,
        size: getReadableFileSize(response.data?.bytes || 0),
      }),
    })
  } catch (error) {
    setNotification({
      type: 'error',
      title: t('common.error'),
      text: error instanceof Error ? error.message : String(error),
    })
  } finally {
    clearingCache.value = false
    await loadCacheStats()
  }
}

onMounted(loadCacheStats)
</script>

<template>
  <div class="mx-4">
    <SettingsCategoryDivider :title="$t('settings_labels.video_player.title')" icon="play-circle">
      <template #actions>
        <button-documentation id="player.formats"></button-documentation>
      </template>
    </SettingsCategoryDivider>

    <settings-switch
      option="isPlayVideoInSystemPlayer"
      :title="$t('settings_labels.video_player.open_system_player')"
      :hint="$t('settings_labels.video_player.open_system_player_hint')"
    />

    <settings-switch
      v-if="appStore.isElectron"
      option="open_player_in_separate_window"
      :title="$t('settings_labels.video_player.open_separate_window')"
      :hint="$t('settings_labels.video_player.open_separate_window_hint')"
      :disabled="SETTINGS.isPlayVideoInSystemPlayer === '1'"
    />

    <settings-switch
      option="restorePlaybackTime"
      :title="$t('settings_labels.video_player.restore_playback_time')"
      :hint="$t('settings_labels.video_player.restore_playback_time_hint')"
      :disabled="SETTINGS.isPlayVideoInSystemPlayer === '1'"
    />

    <settings-switch
      option="transcodeUnsupportedFormats"
      :title="$t('settings_labels.video_player.transcode_unsupported')"
      :hint="$t('settings_labels.video_player.transcode_unsupported_hint')"
      :disabled="SETTINGS.isPlayVideoInSystemPlayer === '1'"
    />

    <div class="transcode-cache-actions mt-2 mb-4">
      <v-btn
        color="primary"
        variant="tonal"
        :loading="clearingCache"
        :disabled="SETTINGS.isPlayVideoInSystemPlayer === '1'"
        @click="clearTranscodeCache"
      >
        {{ $t('settings_labels.video_player.clear_transcode_cache') }}
      </v-btn>
      <div class="text-caption text-medium-emphasis mt-2">
        {{ cacheUsageLabel }}
      </div>
      <div class="text-caption text-medium-emphasis">
        {{ $t('settings_labels.video_player.clear_transcode_cache_hint') }}
      </div>
    </div>
  </div>
</template>
