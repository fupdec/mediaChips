<template>
  <div class="mx-4">
    <!-- INFO ALERT -->
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="text-body-2 mb-8"
      rounded="xl"
    >
      <div>{{ t('settings_labels.general.browser_access') }}</div>

      <v-btn
        @click="copy"
        color="info"
        :title="t('settings_labels.general.copy_link')"
        rounded="xl"
        size="small"
        variant="outlined"
        class="mt-2"
      >
        <v-icon start size="small">mdi-content-copy</v-icon>
        <span>{{ t('settings_labels.general.copy_link') }}:</span>
        <b>{{ frontendUrl }}</b>
      </v-btn>
    </v-alert>

    <settings-locale></settings-locale>

    <!-- EXACT TYPING SWITCH -->
    <settings-switch
      option="typingFiltersDefault"
      :hide-details="false"
    >
      <template #label>
        <div class="d-flex flex-column ml-4">
          <div class="text-body-1 text-high-emphasis">{{ t('settings_labels.general.exact_filtering') }}</div>
          <div class="text-caption text-medium-emphasis filtering-sample mt-1">
            <span v-if="SETTINGS.typingFiltersDefault == '1'">
              {{ t('settings_labels.general.typing') }}: <b>favo</b> / {{ t('settings_labels.general.result') }}: <b>favo</b>rite video
            </span>
            <span v-else>
              {{ t('settings_labels.general.typing') }}: <b>fade</b> / {{ t('settings_labels.general.result') }}: <b>fa</b>vorite vi<b>de</b>o
            </span>
          </div>
        </div>
      </template>
    </settings-switch>

    <!-- COUNT VIEWS SWITCH -->
    <settings-switch
      option="count_number_of_views"
      :title="t('settings_labels.general.count_views')"
      :hint="t('settings_labels.general.count_views_hint')"
    ></settings-switch>

    <!-- EXPERIMENTAL FEATURES CHECKBOX (закомментирован) -->
    <!--
    <v-checkbox
      v-model="SETTINGS.experimentalFeaturesModel"
      @update:modelValue="val => setOption(val, 'experimentalFeaturesModel')"
      color="primary"
      false-value="0"
      true-value="1"
      class="mt-0"
      hide-details
      inset
    >
      <template v-slot:label>
        <div class="d-flex flex-column ml-2">
          <div class="text-primary">Experimental features</div>
          <div class="text-caption mt-1">
            Features that do not work or are in the early stages of development
          </div>
        </div>
      </template>
    </v-checkbox>
    -->
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'

import SettingsSwitch from "@/components/ui/SettingsSwitch.vue";
import SettingsLocale from "@/components/settings/general/SettingsLocale.vue";

const {t} = useI18n({useScope: 'global'})

const appStore = useAppStore()
const settingsStore = useSettingsStore()

const SETTINGS = computed(() => settingsStore)
const frontendUrl = computed(() => appStore.localhost)

const copy = async () => {
  try {
    await navigator.clipboard.writeText(frontendUrl.value)
    console.log('Link copied to clipboard')
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}
</script>

<style lang="scss" scoped>
.filtering-sample {
  b {
    color: rgb(var(--v-theme-primary));
  }
}
</style>