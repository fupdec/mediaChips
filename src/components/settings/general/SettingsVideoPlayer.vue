<script setup>
import SettingsCategoryDivider from '@/components/ui/SettingsCategoryDivider.vue'
import SettingsSwitch from '@/components/ui/SettingsSwitch.vue'
import ButtonDocumentation from '@/components/ui/ButtonDocumentation.vue'
import {useSettingsStore} from '@/stores/settings'
import {useAppStore} from '@/stores/app'

const SETTINGS = useSettingsStore()
const appStore = useAppStore()
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
  </div>
</template>
