<template>
  <div class="mx-4">
    <SettingsCategoryDivider
      :title="t('settings_labels.tools.sfw_mode')"
      icon="eye-off"
    />

    <settings-switch
      :title="t('settings_labels.tools.sfw_mode')"
      :hint="t('settings_labels.tools.sfw_mode_hint')"
      option="sfwMode"
      icon-text="eye-off"
    />
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n"
import SettingsCategoryDivider from "@/components/ui/SettingsCategoryDivider.vue"
import SettingsSwitch from "@/components/ui/SettingsSwitch.vue"

const {t} = useI18n()
</script>
