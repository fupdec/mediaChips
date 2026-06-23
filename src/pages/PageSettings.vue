<template>
  <div>
    <!-- Заголовок -->
    <div class="headline text-h4 d-flex align-center justify-center pt-4 pb-2">
      <v-icon class="mr-2">mdi-cog-outline</v-icon>
      {{ t("headings.settings") }}
    </div>

    <!-- Tabs -->
    <v-tabs
      v-model="tab"
      color="primary"
      show-arrows
      :align-tabs="xs ? 'start' : 'center'"
      :direction="xs ? 'vertical' : 'horizontal'"
      :grow="xs"
      :stacked="!xs"
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

    <v-divider/>

    <!-- Tabs content -->
    <v-window v-model="tab" class="mt-4 fullwidth-tabs transparent-tabs">
      <!-- GENERAL -->
      <v-window-item value="general">
        <SettingsMasonry>
          <v-card class="pt-4" elevation="4" rounded="xl">
            <SettingsGeneral></SettingsGeneral>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsVideoPlayer></SettingsVideoPlayer>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsLogin></SettingsLogin>
          </v-card>
        </SettingsMasonry>
      </v-window-item>

      <!-- APPEARANCE -->
      <v-window-item value="appearance">
        <SettingsMasonry>
          <v-card elevation="4" rounded="xl">
            <v-card-text>
              <SettingsAppearanceDarkMode></SettingsAppearanceDarkMode>
              <SettingsAppearanceZoom></SettingsAppearanceZoom>
            </v-card-text>
          </v-card>

          <v-card class="px-4 pb-4" elevation="4" rounded="xl">
            <SettingsAppearanceThemeColors></SettingsAppearanceThemeColors>
          </v-card>

          <v-card class="px-4" elevation="4" rounded="xl">
            <SettingsAppearanceCards></SettingsAppearanceCards>
          </v-card>

          <v-card class="px-4" elevation="4" rounded="xl">
            <SettingsAppearancePage></SettingsAppearancePage>
          </v-card>
        </SettingsMasonry>
      </v-window-item>

      <!-- TOOLS -->
      <v-window-item value="tools">
        <SettingsMasonry>
          <v-card class="py-4" elevation="4" rounded="xl">
            <SettingsTools></SettingsTools>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsVideoPreview></SettingsVideoPreview>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsWatchedFolders></SettingsWatchedFolders>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsAdultFeatures></SettingsAdultFeatures>
          </v-card>
        </SettingsMasonry>
      </v-window-item>

      <!-- META -->
      <v-window-item value="meta">
        <SettingsMeta></SettingsMeta>
      </v-window-item>

      <!-- MEDIA -->
      <v-window-item value="media">
        <SettingsMediaTypes></SettingsMediaTypes>
      </v-window-item>

      <!-- DATABASE -->
      <v-window-item value="database">
        <SettingsMasonry>
          <v-card class="py-4" elevation="4" rounded="xl">
            <SettingsDatabases></SettingsDatabases>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsClearGeneratedImages></SettingsClearGeneratedImages>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsContentHashBackfill/>
          </v-card>

          <v-card elevation="4" rounded="xl">
            <SettingsFindMissingMedia/>
          </v-card>
        </SettingsMasonry>
      </v-window-item>

      <!-- ABOUT -->
      <v-window-item value="about">
        <SettingsMasonry>
          <v-card class="py-4" elevation="4" rounded="xl">
            <SettingsRegistration></SettingsRegistration>
          </v-card>

          <v-card class="py-4" elevation="4" rounded="xl">
            <About></About>
          </v-card>
        </SettingsMasonry>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import {ref, onMounted, defineAsyncComponent} from "vue"
import {useRoute} from "vue-router"
import {useI18n} from "vue-i18n"
import {useDisplay} from "vuetify"
import SettingsMasonry from "@/components/ui/SettingsMasonry.vue"
import SettingsAppearanceThemeColors
  from "@/components/settings/appearance/SettingsAppearanceThemeColors.vue";
import SettingsAppearanceCards
  from "@/components/settings/appearance/SettingsAppearanceCards.vue";
import SettingsAppearanceDarkMode
  from "@/components/settings/appearance/SettingsAppearanceDarkMode.vue";
import SettingsAppearanceZoom
  from "@/components/settings/appearance/SettingsAppearanceZoom.vue";
import SettingsAppearancePage
  from "@/components/settings/appearance/SettingsAppearancePage.vue";

const {xs} = useDisplay()

// dynamic imports (ленивая загрузка)
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
