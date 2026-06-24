<template>
  <div class="settings-page">
    <div class="settings-page-layout">
      <aside class="settings-page-layout__sidebar">
        <v-tabs
          v-model="tab"
          color="primary"
          direction="vertical"
          class="settings-page-layout__tabs"
        >
        <v-tab value="general">
          <v-icon start>mdi-application-cog-outline</v-icon>
          {{ t("settings.tabs.general") }}
        </v-tab>

        <v-tab value="appearance">
          <v-icon start>mdi-brush-variant</v-icon>
          {{ t("settings.tabs.appearance") }}
        </v-tab>

        <v-tab value="tools">
          <v-icon start>mdi-tools</v-icon>
          {{ t("settings.tabs.tools") }}
        </v-tab>

        <v-tab value="meta">
          <v-icon start>mdi-shape-outline</v-icon>
          {{ t("settings.tabs.meta") }}
        </v-tab>

        <v-tab value="media">
          <v-icon start>mdi-file-outline</v-icon>
          {{ t("settings.tabs.media") }}
        </v-tab>

        <v-tab value="database">
          <v-icon start>mdi-database-outline</v-icon>
          {{ t("settings.tabs.database") }}
        </v-tab>

        <v-tab value="about">
          <v-icon start>mdi-information-variant</v-icon>
          {{ t("settings.tabs.about") }}
        </v-tab>
        </v-tabs>
      </aside>

      <div class="settings-page-layout__content">
        <div v-show="tab === 'general'">
          <SettingsList>
            <SettingsSection>
              <SettingsGeneral/>
            </SettingsSection>

            <SettingsSection>
              <SettingsVideoPlayer/>
            </SettingsSection>

            <SettingsSection>
              <SettingsLogin/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-show="tab === 'appearance'">
          <SettingsList>
            <SettingsSection padded>
              <SettingsAppearanceDarkMode/>
              <SettingsAppearanceZoom/>
            </SettingsSection>

            <SettingsSection padded>
              <SettingsAppearanceThemeColors/>
            </SettingsSection>

            <SettingsSection padded>
              <SettingsAppearanceCards/>
            </SettingsSection>

            <SettingsSection padded>
              <SettingsAppearancePage/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-show="tab === 'tools'">
          <SettingsList>
            <SettingsSection>
              <SettingsTools/>
            </SettingsSection>

            <SettingsSection>
              <SettingsVideoPreview/>
            </SettingsSection>

            <SettingsSection>
              <SettingsWatchedFolders/>
            </SettingsSection>

            <SettingsSection>
              <SettingsAdultFeatures/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-show="tab === 'meta'">
          <SettingsMeta/>
        </div>

        <div v-show="tab === 'media'">
          <SettingsMediaTypes/>
        </div>

        <div v-show="tab === 'database'">
          <SettingsList>
            <SettingsSection>
              <SettingsDatabases/>
            </SettingsSection>

            <SettingsSection>
              <SettingsClearGeneratedImages/>
            </SettingsSection>

            <SettingsSection>
              <SettingsContentHashBackfill/>
            </SettingsSection>

            <SettingsSection>
              <SettingsFindMissingMedia/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-show="tab === 'about'">
          <SettingsList>
            <SettingsSection>
              <SettingsRegistration/>
            </SettingsSection>

            <SettingsSection>
              <About/>
            </SettingsSection>
          </SettingsList>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, defineAsyncComponent} from "vue"
import {useRoute} from "vue-router"
import {useI18n} from "vue-i18n"
import SettingsList from "@/components/ui/SettingsList.vue"
import SettingsSection from "@/components/ui/SettingsSection.vue"
import SettingsAppearanceThemeColors
  from "@/components/settings/appearance/SettingsAppearanceThemeColors.vue"
import SettingsAppearanceCards
  from "@/components/settings/appearance/SettingsAppearanceCards.vue"
import SettingsAppearanceDarkMode
  from "@/components/settings/appearance/SettingsAppearanceDarkMode.vue"
import SettingsAppearanceZoom
  from "@/components/settings/appearance/SettingsAppearanceZoom.vue"
import SettingsAppearancePage
  from "@/components/settings/appearance/SettingsAppearancePage.vue"

const SettingsWatchedFolders = defineAsyncComponent(() =>
  import("@/components/settings/tools/SettingsWatchedFolders.vue")
)
const SettingsMeta = defineAsyncComponent(() =>
  import("@/components/settings/SettingsMeta.vue")
)
const SettingsMediaTypes = defineAsyncComponent(() =>
  import("@/components/settings/SettingsMediaTypes.vue")
)
const SettingsVideoPreview = defineAsyncComponent(() =>
  import("@/components/settings/tools/SettingsVideoPreview.vue")
)
const SettingsVideoPlayer = defineAsyncComponent(() =>
  import("@/components/settings/general/SettingsVideoPlayer.vue")
)
const SettingsLogin = defineAsyncComponent(() =>
  import("@/components/settings/general/SettingsLogin.vue")
)
const SettingsDatabases = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsDatabases.vue")
)
const SettingsClearGeneratedImages = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsClearGeneratedImages.vue")
)
const SettingsContentHashBackfill = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsContentHashBackfill.vue")
)
const SettingsFindMissingMedia = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsFindMissingMedia.vue")
)
const SettingsGeneral = defineAsyncComponent(() =>
  import("@/components/settings/general/SettingsGeneral.vue")
)
const SettingsTools = defineAsyncComponent(() =>
  import("@/components/settings/tools/SettingsTools.vue")
)
const SettingsRegistration = defineAsyncComponent(() =>
  import("@/components/settings/about/SettingsRegistration.vue")
)
const SettingsAdultFeatures = defineAsyncComponent(() =>
  import("@/components/settings/tools/SettingsAdultFeatures.vue")
)
const About = defineAsyncComponent(() =>
  import("@/components/app/About.vue")
)

const tab = ref("general")
const route = useRoute()
const {t} = useI18n()

onMounted(() => {
  if (route.query.tab === "about") tab.value = "about"
})
</script>

<style scoped>
.settings-page {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-page-layout {
  display: flex;
  align-items: stretch;
  gap: 24px;
  height: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding: 8px 16px 0;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-page-layout__sidebar {
  flex: 0 0 220px;
  min-height: 0;
  overflow-y: auto;
  padding-top: 4px;
}

.settings-page-layout__tabs {
  width: 100%;
}

.settings-page-layout__tabs :deep(.v-tab) {
  justify-content: flex-start;
  text-transform: none;
  letter-spacing: normal;
}

.settings-page-layout__tabs :deep(.v-tab__slider) {
  transition: none !important;
}

.settings-page-layout__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.settings-page :deep(.settings-list-container) {
  padding-bottom: 16px;
}

@media (max-width: 959px) {
  .settings-page {
    flex: none;
    min-height: auto;
    overflow: visible;
  }

  .settings-page-layout {
    flex-direction: column;
    gap: 16px;
    height: auto;
    overflow: visible;
    padding-top: 0;
  }

  .settings-page-layout__sidebar {
    flex: none;
    width: 100%;
    overflow: visible;
    padding-top: 0;
  }

  .settings-page-layout__content {
    overflow: visible;
  }
}
</style>
