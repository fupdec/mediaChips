<template>
  <v-container>
    <!-- SALUTATION BLOCK -->
    <div v-if="settingsStore.show_salutation === '1'"
      class="mt-4">
      <p>{{ t('home.welcome') }}</p>
      <p>{{ t('home.documentation_hint') }}</p>

      <v-btn
        color="primary"
        class="mt-2"
        rounded
        @click="emitShowDocs"
      >
        <v-icon start>mdi-book-open-variant-outline</v-icon>
        {{ t('home.show_documentation') }}
      </v-btn>
    </div>

    <v-spacer class="my-8"></v-spacer>

    <!-- IP ALERT -->
    <v-alert
      v-if="settingsStore.show_ip_at_home_screen === '1'"
      type="info"
      class="caption rounded-xl mb-4"
      variant="tonal"
      closable
      @click:close="hideAlert"
    >
      <div>
        {{ t('settings_labels.general.browser_access') }}
      </div>

      <v-btn
        @click="copy"
        color="info"
        :title="t('settings_labels.general.copy_link')"
        rounded="xl"
        size="small"
        variant="outlined"
        class="mt-3"
      >
        <v-icon start
          size="small">mdi-content-copy
        </v-icon>
        <span>{{ t('settings_labels.general.copy_link') }}:</span>
        <b class="ml-1">{{ apiUrl }}</b>
      </v-btn>
    </v-alert>

    <!-- Widgets -->
    <widget-total-stats class="mt-2"/>
    <widget-top-tags/>
  </v-container>
</template>

<script setup>
import {computed, onBeforeUnmount} from "vue"
import {useI18n} from 'vue-i18n'
import {useAppStore} from "@/stores/app"
import {useSettingsStore} from "@/stores/settings"
import {useEventBus} from "@/utils/eventBus"
import WidgetTopTags from "@/components/widgets/WidgetTopTags.vue"
import WidgetTotalStats from "@/components/widgets/WidgetTotalStats.vue"

// Pinia store
const store = useAppStore()
const settingsStore = useSettingsStore()
const eventBus = useEventBus()
const {t} = useI18n()

const apiUrl = computed(() => store.localhost)

/* ----------------- Actions ----------------- */

function emitShowDocs() {
  eventBus.emit("showDocumentation", "app")
}

function copy() {
  navigator.clipboard.writeText(apiUrl.value)
}

async function setOption(option, value) {
  await $operable.setOption(option, value)
}

async function hideAlert() {
  await setOption("show_ip_at_home_screen", 0)
}

onBeforeUnmount(() => {
  // аналог beforeDestroy
  setOption("show_salutation", 0)
})
</script>
