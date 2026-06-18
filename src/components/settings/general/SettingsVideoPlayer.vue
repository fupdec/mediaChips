<script setup>
import SettingsCategoryDivider from "@/components/ui/SettingsCategoryDivider.vue";
import SettingsSwitch from "@/components/ui/SettingsSwitch.vue";

import { useSettingsStore } from "@/stores/settings";
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue";
const SETTINGS = useSettingsStore();
</script>

<template>
  <div class="mx-4">
    <SettingsCategoryDivider :title="$t('settings_labels.video_player.title')" icon="play-circle">
      <template #actions>
        <button-documentation id="player.formats"></button-documentation>
      </template>
    </SettingsCategoryDivider>

    <!-- ► Open in system player -->
    <settings-switch
      option="isPlayVideoInSystemPlayer"
      :title="$t('settings_labels.video_player.open_system_player')"
      :hint="$t('settings_labels.video_player.open_system_player_hint')"
    ></settings-switch>

    <!-- ► Open player in separate window -->
    <settings-switch
      option="open_player_in_separate_window"
      :title="$t('settings_labels.video_player.open_separate_window')"
      :hint="$t('settings_labels.video_player.open_separate_window_hint')"
      :disabled="SETTINGS.isPlayVideoInSystemPlayer === '1'"
    ></settings-switch>

    <!-- ► Restore playback time -->
    <settings-switch
      option="restorePlaybackTime"
      :title="$t('settings_labels.video_player.restore_playback_time')"
      :hint="$t('settings_labels.video_player.restore_playback_time_hint')"
      :disabled="SETTINGS.isPlayVideoInSystemPlayer === '1'"
    ></settings-switch>
  </div>
</template>
