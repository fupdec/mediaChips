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
        <v-tab value="general" id="settings-doc-tab-general">
          <v-icon start>mdi-application-cog-outline</v-icon>
          {{ t("settings.tabs.general") }}
        </v-tab>

        <v-tab value="appearance" id="settings-doc-tab-appearance">
          <v-icon start>mdi-brush-variant</v-icon>
          {{ t("settings.tabs.appearance") }}
        </v-tab>

        <v-tab value="library" id="settings-doc-tab-library">
          <v-icon start>mdi-bookshelf</v-icon>
          {{ t("settings.tabs.library") }}
        </v-tab>

        <v-tab value="files" id="settings-doc-tab-files">
          <v-icon start>mdi-file-cog-outline</v-icon>
          {{ t("settings.tabs.files") }}
        </v-tab>

        <v-tab value="video" id="settings-doc-tab-video">
          <v-icon start>mdi-video-outline</v-icon>
          {{ t("settings.tabs.video") }}
        </v-tab>

        <v-tab value="database" id="settings-doc-tab-database">
          <v-icon start>mdi-database-outline</v-icon>
          {{ t("settings.tabs.database") }}
        </v-tab>

        <v-tab value="about" id="settings-doc-tab-about">
          <v-icon start>mdi-information-variant</v-icon>
          {{ t("settings.tabs.about") }}
        </v-tab>
        </v-tabs>
      </aside>

      <div ref="contentRef" class="settings-page-layout__content">
        <v-container max-width="960" class="settings-page-layout__container">
        <div v-if="tab === 'general'">
          <SettingsList>
            <SettingsSection>
              <SettingsGeneral/>
            </SettingsSection>

            <SettingsSection>
              <SettingsLogin/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-else-if="tab === 'appearance'">
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

            <SettingsSection>
              <SettingsSfwMode/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-else-if="tab === 'files'">
          <SettingsList>
            <SettingsSection>
              <SettingsWatchedFolders/>
            </SettingsSection>

            <SettingsSection>
              <SettingsBulkPathEditing/>
            </SettingsSection>

            <SettingsSection>
              <SettingsContentHashBackfill/>
            </SettingsSection>

            <SettingsSection>
              <SettingsFindMissingMedia/>
            </SettingsSection>

            <SettingsSection>
              <SettingsGenerateVideoImages/>
            </SettingsSection>

            <SettingsSection>
              <SettingsGenerateImageThumbs/>
            </SettingsSection>

            <SettingsSection>
              <SettingsClearGeneratedImages/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-else-if="tab === 'library'">
          <SettingsList>
            <SettingsMeta/>

            <SettingsMediaTypes/>

            <SettingsMetaAssignment/>

            <SettingsSection>
              <SettingsDataScraper/>
            </SettingsSection>

            <SettingsSection>
              <SettingsQuickTags/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-else-if="tab === 'video'">
          <SettingsList>
            <SettingsSection>
              <SettingsVideoPlayer/>
            </SettingsSection>

            <SettingsSection>
              <SettingsVideoPreview/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-else-if="tab === 'database'">
          <SettingsList>
            <SettingsSection>
              <SettingsOpenDataFolder/>
            </SettingsSection>

            <SettingsSection>
              <SettingsDatabases/>
            </SettingsSection>
          </SettingsList>
        </div>

        <div v-else-if="tab === 'about'">
          <SettingsList>
            <SettingsSection>
              <SettingsRegistration/>
            </SettingsSection>

            <SettingsSection>
              <About/>
            </SettingsSection>
          </SettingsList>
        </div>
        </v-container>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, watch, nextTick, defineAsyncComponent} from "vue"
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
import SettingsSfwMode
  from "@/components/settings/appearance/SettingsSfwMode.vue"

const SettingsWatchedFolders = defineAsyncComponent(() =>
  import("@/components/settings/tools/SettingsWatchedFolders.vue")
)
const SettingsBulkPathEditing = defineAsyncComponent(() =>
  import("@/components/settings/files/SettingsBulkPathEditing.vue")
)
const SettingsMeta = defineAsyncComponent(() =>
  import("@/components/settings/SettingsMeta.vue")
)
const SettingsMetaAssignment = defineAsyncComponent(() =>
  import("@/components/settings/SettingsMetaAssignment.vue")
)
const SettingsMediaTypes = defineAsyncComponent(() =>
  import("@/components/settings/SettingsMediaTypes.vue")
)
const SettingsDataScraper = defineAsyncComponent(() =>
  import("@/components/settings/library/SettingsDataScraper.vue")
)
const SettingsQuickTags = defineAsyncComponent(() =>
  import("@/components/settings/library/SettingsQuickTags.vue")
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
const SettingsOpenDataFolder = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsOpenDataFolder.vue")
)
const SettingsDatabases = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsDatabases.vue")
)
const SettingsClearGeneratedImages = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsClearGeneratedImages.vue")
)
const SettingsGenerateVideoImages = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsGenerateVideoImages.vue")
)
const SettingsGenerateImageThumbs = defineAsyncComponent(() =>
  import("@/components/settings/database/SettingsGenerateImageThumbs.vue")
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
const SettingsRegistration = defineAsyncComponent(() =>
  import("@/components/settings/about/SettingsRegistration.vue")
)
const About = defineAsyncComponent(() =>
  import("@/components/app/About.vue")
)

const TAB_ALIASES = {
  tools: "general",
  meta: "library",
  media: "library",
  assignment: "library",
}

const tab = ref("general")
const contentRef = ref(null)
const route = useRoute()
const {t} = useI18n()

const SETTINGS_SECTION_IDS = {
  generate_video_images: "settings-generate-video-images",
  generate_image_thumbs: "settings-generate-image-thumbs",
  field_pinning: "settings-meta-assignment",
  video_preview: "video_preview",
}

function resolveTab(routeTab) {
  return TAB_ALIASES[routeTab] || routeTab
}

function scrollToSettingsSection(sectionId, attempts = 12) {
  const scrollContainer = contentRef.value
  const element = document.getElementById(sectionId)
  if (scrollContainer && element) {
    const top = element.getBoundingClientRect().top
      - scrollContainer.getBoundingClientRect().top
      + scrollContainer.scrollTop

    scrollContainer.scrollTo({
      top: Math.max(0, top - 8),
      behavior: "smooth",
    })
    return
  }

  if (attempts <= 0) return

  requestAnimationFrame(() => {
    scrollToSettingsSection(sectionId, attempts - 1)
  })
}

function applyRouteSettings() {
  const section = String(route.query.section || "")

  if (section === "generate_video_images" || section === "generate_image_thumbs") {
    tab.value = "files"
  } else if (section === "field_pinning") {
    tab.value = "library"
  } else if (section === "video_preview") {
    tab.value = "video"
  } else if (route.query.tab) {
    tab.value = resolveTab(String(route.query.tab))
  }

  const sectionId = SETTINGS_SECTION_IDS[route.query.section]
  if (!sectionId) return

  nextTick(() => {
    scrollToSettingsSection(sectionId)
  })
}

onMounted(applyRouteSettings)

watch(tab, () => {
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
})

watch(() => route.fullPath, applyRouteSettings)
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-page-layout {
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  gap: 24px;
  width: 100%;
  min-height: 0;
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

.settings-page-layout__container {
  width: 100%;
  padding-inline: 0;
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
