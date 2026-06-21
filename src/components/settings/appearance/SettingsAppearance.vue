<script setup>
import {computed} from "vue";
import {useSettingsStore} from "@/stores/settings";
import {useTheme} from "vuetify";
import {defineAsyncComponent} from "vue";
import SettingsSwitch from "@/components/ui/SettingsSwitch.vue";
import SettingsCategoryDivider
  from "@/components/ui/SettingsCategoryDivider.vue";

const SettingsThemeColors = defineAsyncComponent(() =>
  import("@/components/settings/appearance/SettingsAppearanceThemeColors.vue")
);

const settingsStore = useSettingsStore();
const theme = useTheme();

const SETTINGS = computed(() => settingsStore)

async function syncDarkModeWithSystem(value) {
  const match = window.matchMedia('(prefers-color-scheme: dark)');

  if (value == "1") {
    theme.change(match.matches ? "dark" : "light")
    match.addEventListener("change", e => {
      theme.change(e.matches ? "dark" : "light")
    });
  } else {
    theme.change(SETTINGS.value.darkMode == "1" ? "dark" : "light");
  }
}

async function toggleDarkMode(value) {
  theme.global.name.value = value == "1" ? "dark" : "light";
}

const chipVariants = [
  'flat',
  'tonal',
  'outlined',
  'text',
]

const chips_default_data = [
  {
    icon: 'harddisk',
    text: 'Filesize',
    value: 'show_default_meta_filesize',
  },
  {
    icon: 'clock-outline',
    text: 'Duration',
    value: 'show_default_meta_duration',
  },
  {
    icon: 'monitor-screenshot',
    text: 'Resolution',
    value: 'show_default_meta_resolution',
  },
  {
    icon: 'file-outline',
    text: 'Extension',
    value: 'show_default_meta_ext',
  },
  {
    icon: 'filmstrip',
    text: 'Codec',
    value: 'show_default_meta_codec',
  },
  {
    icon: 'filmstrip',
    text: 'Bitrate',
    value: 'show_default_meta_bitrate',
  },
  {
    icon: 'filmstrip',
    text: 'Framerate',
    value: 'show_default_meta_fps',
  },
  {
    icon: 'folder-multiple-outline',
    text: 'Number of media',
    value: 'show_default_meta_number_media',
  },
  {
    icon: 'eye-outline',
    text: 'Number of views',
    value: 'show_default_meta_number_views',
  },
]
</script>

<template>
  <div class="mx-4">
    <settings-switch
      @update="syncDarkModeWithSystem"
      option="system_dark_mode"
      title="Sync dark mode with system"
    >
      <template #thumb>
        <v-icon v-if="SETTINGS.system_dark_mode == '1' && theme.global.current.value.dark"
          size="small">
          mdi-weather-night
        </v-icon>
        <v-icon
          v-else-if="SETTINGS.system_dark_mode == '1' || SETTINGS.system_dark_mode != '1' && !theme.global.current.value.dark"
          size="small">mdi-weather-sunny
        </v-icon>
      </template>
    </settings-switch>

    <settings-switch
      @update="toggleDarkMode"
      option="darkMode"
      title="Dark Mode"
      :disabled="SETTINGS.system_dark_mode == '1'"
    >
      <template #thumb>
        <v-icon v-if="SETTINGS.system_dark_mode != '1' && theme.global.current.value.dark"
          size="small">
          mdi-weather-night
        </v-icon>
      </template>
    </settings-switch>

    <settings-switch
      option="bottomBar"
      title="Navigation bar at the bottom"
    ></settings-switch>

    <SettingsThemeColors/>

    <settings-category-divider title="Page"
      icon="page-layout-body"></settings-category-divider>

    <settings-switch
      title="Saved filters"
      hint="On the tag and media page, under the heading"
      option="showSavedFilters"
    ></settings-switch>

    <settings-switch
      title="Quick action button"
      hint="Floating button with actions from appbar"
      option="show_quick_action_button"
    ></settings-switch>

    <settings-switch
      option="showIconsOfMetaInEditingDialog"
      :hide-details="false"
    >
      <template #label>
        <div class="d-flex flex-column ml-4">
          <div class="text-body-1 text-high-emphasis">Icon of meta in editing
            dialog
          </div>
          <div class="d-flex align-center text-medium-emphasis  text-caption">
            <span class="mr-4">Sample</span>
            <v-text-field
              model-value="John"
              :prepend-icon="SETTINGS.showIconsOfMetaInEditingDialog == '1' ? `mdi-account` : ''"
              density="compact"
              class="pa-0 ma-0"
              hide-details
              variant="filled"
              readonly
            />
          </div>
        </div>
      </template>
    </settings-switch>

    <settings-switch
      option="showIconsInsteadTextOnFiltersChips"
      :hide-details="false"
    >
      <template #label>
        <div class="d-flex flex-column ml-4">
          <div class="text-body-1 text-high-emphasis">Icons in filter chips
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            <span class="mr-4">Sample</span>
            <v-chip
              v-if="SETTINGS.showIconsInsteadTextOnFiltersChips == '0'"
              color="primary"
              size="small"
            >
              "Actor" not equal "John"
            </v-chip>
            <v-chip v-else
              color="primary"
              size="small">
              <v-icon start>mdi-account</v-icon>
              <v-icon start>mdi-not-equal-variant</v-icon>
              "John"
            </v-chip>
          </div>
        </div>
      </template>
    </settings-switch>

    <div class="d-flex align-center flex-wrap mt-4 mb-8">
      <div class="text-body-1 text-high-emphasis mb-2 mr-4">
        <v-icon start>mdi-view-agenda</v-icon>
        Gap size between items
      </div>

      <v-btn-toggle
        v-model="SETTINGS.gapSize"
        @update:model-value="$operable.setOption($event, 'gapSize')"
        color="primary"
        class="mb-2"
        rounded="xl"
        mandatory
      >
        <v-btn variant="outlined"
          value="xs">XS
        </v-btn>
        <v-btn variant="outlined"
          value="s">S
        </v-btn>
        <v-btn variant="outlined"
          value="m">M
        </v-btn>
        <v-btn variant="outlined"
          value="l">L
        </v-btn>
        <v-btn variant="outlined"
          value="xl">XL
        </v-btn>
      </v-btn-toggle>
    </div>

    <div class="d-flex align-center flex-wrap">
      <div class="text-body-1 text-high-emphasis mb-2 mr-4">
        <v-icon start>mdi-page-next</v-icon>
        Number of visible pages in pagination
      </div>

      <v-btn-toggle
        v-model="SETTINGS.numberOfPagesLimit"
        @update:model-value="$operable.setOption($event, 'numberOfPagesLimit')"
        color="primary"
        class="mb-2"
        rounded="xl"
        mandatory
      >
        <v-btn variant="outlined"
          value="5">5
        </v-btn>
        <v-btn variant="outlined"
          value="7">7
        </v-btn>
        <v-btn variant="outlined"
          value="9">9
        </v-btn>
        <v-btn variant="outlined"
          value="11">11
        </v-btn>
        <v-btn variant="outlined"
          value="13">13
        </v-btn>
        <v-btn variant="outlined"
          value="15">15
        </v-btn>
      </v-btn-toggle>
    </div>

    <v-card variant="tonal" class="text-caption mt-3 pa-4" color="primary" rounded="xl">
      Example pagination
      <v-pagination
        :total-visible="SETTINGS.numberOfPagesLimit"
        :length="99"
        active-color="primary"
        density="comfortable"
        rounded
      />
    </v-card>

    <div class="pt-6"></div>

    <settings-category-divider title="Cards"
      icon="post"/>

    <settings-switch
      title="Rating and favorite in description"
      option="ratingAndFavoriteInCard"
    ></settings-switch>

    <settings-switch
      title="Group chips in card description"
      option="group_chips_in_card_description"
    ></settings-switch>

    <settings-switch
      title="Show default metadata"
      option="show_preset_metadata_in_card"
    ></settings-switch>

    <div v-if="SETTINGS.show_preset_metadata_in_card === '1'">
      <v-chip-group column>
        <v-chip
          v-for="chip in chips_default_data"
          :key="chip.value"
          @click="$operable.setOption(SETTINGS[chip.value] == '1' ? '0' : '1', chip.value)"
          :variant="SETTINGS.default_meta_chip_variant"
          :base-color="SETTINGS[chip.value] == '1' ? 'primary' : ''"
          :label="SETTINGS.show_default_meta_label == '1'"
        >
          <v-icon start
            size="small">
            mdi-{{ chip.icon }}
          </v-icon>
          <span>{{ chip.text }}</span>
        </v-chip>
      </v-chip-group>


      <div class="d-flex align-center flex-wrap mt-4 mb-4">
        <div class="text-body-1 text-high-emphasis mr-6">
          <v-icon start>mdi-label</v-icon>
          Chip variant
        </div>

        <v-chip-group column>
          <v-chip
            v-for="variant in chipVariants"
            :key="variant"
            @click="$operable.setOption(variant, 'default_meta_chip_variant')"
            :variant="variant"
            base-color="primary"
            :label="SETTINGS.show_default_meta_label == '1'"
          >
            <v-icon v-if="SETTINGS.default_meta_chip_variant == variant"
              start>mdi-check
            </v-icon>
            <span>{{ variant }}</span>
          </v-chip>
        </v-chip-group>
      </div>

      <settings-switch
        title="Label chips use for default metadata"
        option="show_default_meta_label"
      ></settings-switch>
    </div>
  </div>
</template>
