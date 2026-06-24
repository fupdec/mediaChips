<script setup>
import {ref, computed} from "vue";
import {useI18n} from "vue-i18n";
import {useSettingsStore} from "@/stores/settings";
import SettingsHeaderGradient from "@/components/settings/appearance/SettingsHeaderGradient.vue";
import SettingsCategoryDivider from "@/components/ui/SettingsCategoryDivider.vue";
import SettingsSwitch from "@/components/ui/SettingsSwitch.vue";
import {useAppTheme} from "@/composable/useAppTheme";

const {t} = useI18n();
const {applyTheme} = useAppTheme();

const dialogPalette = ref(false);
const dialogHeaderGradient = ref(false);
const colorType = ref(null);
const palette = ref("#777777");
const gradientThemeDark = ref(false);

const SETTINGS = useSettingsStore()

function normalizeColor(value) {
  if (!value) return value
  if (typeof value === 'object') return value.hex ?? value.rgba ?? value
  return value
}

function openDialogPalette(type) {
  colorType.value = type;
  palette.value = SETTINGS[type];
  dialogPalette.value = true;
}

function applyColor() {
  dialogPalette.value = false;
  const value = normalizeColor(palette.value);
  const option = colorType.value;
  SETTINGS[option] = value;
  applyTheme();
  $operable.setOption(value, option);
}

function openDialogHeaderGradientLight() {
  gradientThemeDark.value = false;
  dialogHeaderGradient.value = true;
}

function openDialogHeaderGradientDark() {
  gradientThemeDark.value = true;
  dialogHeaderGradient.value = true;
}

function saveHeaderGradient(values) {
  const key = "headerGradient" + (values.themeDark ? "Dark" : "Light");
  SETTINGS[key] = values.gradient;
  applyTheme();
  $operable.setOption(values.gradient, key);
}
</script>

<template>
  <div>
    <SettingsCategoryDivider :title="t('settings_labels.appearance.colors')" icon="brush-variant"></SettingsCategoryDivider>

    <settings-switch
      :title="t('settings_labels.appearance.gradient')"
      :hint="t('settings_labels.appearance.gradient_hint')"
      option="headerGradient"
    ></settings-switch>

    <!-- Light Theme -->
    <div class="d-flex flex-wrap align-center mb-4">
      <div class="mr-6 mb-2">
        <v-icon start>mdi-weather-sunny</v-icon>
        <span class="text-body-2 text-high-emphasis">{{ t('settings_labels.appearance.light_theme') }}</span>
      </div>

      <v-btn
        v-if="SETTINGS.headerGradient === '1'"
        @click="openDialogHeaderGradientLight"
        :style="{ background: SETTINGS.headerGradientLight }"
        class="mr-2 mb-2"
        rounded
        variant="flat"
        theme="light"
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.toolbar') }}
      </v-btn>

      <v-btn
        v-else
        @click="openDialogPalette('appColorLightHeader')"
        :color="SETTINGS.appColorLightHeader"
        class="mr-2 mb-2"
        rounded
        variant="tonal"
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.toolbar') }}
      </v-btn>

      <v-btn
        @click="openDialogPalette('appColorLightPrimary')"
        :color="SETTINGS.appColorLightPrimary"
        class="mr-2 mb-2"
        rounded
        variant="tonal"
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.primary') }}
      </v-btn>

      <v-btn
        @click="openDialogPalette('appColorLightSecondary')"
        :color="SETTINGS.appColorLightSecondary"
        class="mr-2 mb-2"
        rounded
        variant="tonal"
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.secondary') }}
      </v-btn>
    </div>

    <!-- Dark Theme -->
    <div class="d-flex flex-wrap align-center">
      <div class="mr-6 mb-2">
        <v-icon start>mdi-weather-night</v-icon>
        <span class="text-body-2 text-high-emphasis">{{ t('settings_labels.appearance.dark_theme') }}</span>
      </div>

      <v-btn
        v-if="SETTINGS.headerGradient === '1'"
        @click="openDialogHeaderGradientDark"
        :style="{ background: SETTINGS.headerGradientDark }"
        class="mr-2 mb-2"
        variant="tonal"
        theme="dark"
        rounded
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.toolbar') }}
      </v-btn>

      <v-btn
        v-else
        @click="openDialogPalette('appColorDarkHeader')"
        :color="SETTINGS.appColorDarkHeader"
        class="mr-2 mb-2"
        rounded
        variant="tonal"
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.toolbar') }}
      </v-btn>

      <v-btn
        @click="openDialogPalette('appColorDarkPrimary')"
        :color="SETTINGS.appColorDarkPrimary"
        class="mr-2 mb-2"
        rounded
        variant="tonal"
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.primary') }}
      </v-btn>

      <v-btn
        @click="openDialogPalette('appColorDarkSecondary')"
        :color="SETTINGS.appColorDarkSecondary"
        class="mr-2 mb-2"
        rounded
        variant="tonal"
      >
        <v-icon start>mdi-brush-variant</v-icon>
        {{ t('settings_labels.appearance.secondary') }}
      </v-btn>
    </div>

    <!-- Palette Dialog -->
    <v-dialog v-model="dialogPalette" width="300">
      <v-card rounded="xl">
        <div class="pa-2">
          <v-btn @click="applyColor" rounded="xl" color="success" variant="flat" block>
            <v-icon start>mdi-check</v-icon>
            {{ t('common.apply') }}
          </v-btn>
        </div>

        <v-color-picker
          v-model="palette"
          mode="hexa"
          elevation="0"
        />
      </v-card>
    </v-dialog>

    <!-- Gradient Editor -->
    <SettingsHeaderGradient
      v-if="dialogHeaderGradient"
      :themeDark="gradientThemeDark"
      @close="dialogHeaderGradient = false"
      @save="saveHeaderGradient"
    />
  </div>
</template>
