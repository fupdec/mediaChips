<template>
  <div id="video_preview"
    class="mx-4">
    <SettingsCategoryDivider :title="$t('settings_labels.appearance.video_preview')"
      icon="animation-play">
      <template #actions>
        <ButtonDocumentation id="sets.tools.video_preview"></ButtonDocumentation>
      </template>
    </SettingsCategoryDivider>

    <v-alert
      type="warning"
      icon="mdi-alert"
      variant="tonal"
      density="compact"
      rounded="xl"
      class="text-caption my-4"
      closable
    >
      <span>
        {{ $t('settings_labels.appearance.video_preview_cpu_warning') }} <br/>
        {{ $t('settings_labels.appearance.video_preview_slow_warning') }}
      </span>
    </v-alert>

    <!-- Static Preview Options -->
    <div class="d-flex align-center">

      <div class="mr-6">
        <v-icon start>mdi-cursor-default</v-icon>
        <span class="text-body-2 text-high-emphasis">{{ $t('settings_labels.appearance.static_preview') }}</span>
      </div>

      <v-radio-group
        :model-value="SETTINGS.videoPreviewStatic"
        @update:model-value="(val) => setOption(val, 'videoPreviewStatic')"
        color="primary"
        class="mt-0 pt-0"
        hide-details
      >
        <v-radio value="thumb"
          class="mr-4">
          <template #label>
            <div class="ml-1"></div>
            <v-icon start>mdi-image-outline</v-icon>
            <div class="text-body-1 text-high-emphasis">{{ $t('settings_labels.appearance.thumb') }}</div>
          </template>
        </v-radio>

        <v-radio value="grid">
          <template #label>
            <div class="ml-1"></div>
            <v-icon color="warning"
              size="small"
              start>mdi-alert
            </v-icon>
            <v-icon start>mdi-view-grid</v-icon>
            <div class="text-body-1 text-high-emphasis">{{ $t('settings_labels.appearance.grid_3x3') }}</div>
          </template>
        </v-radio>
      </v-radio-group>
    </div>

    <!-- Hover Preview Options -->
    <div class="d-flex align-center mt-4 mb-4">

      <div class="mr-6">
        <v-icon start>mdi-button-cursor</v-icon>
        <span class="text-body-2 text-high-emphasis">{{ $t('settings_labels.appearance.hover_preview') }}</span>
      </div>

      <v-radio-group
        :model-value="SETTINGS.videoPreviewHover"
        @update:model-value="(val) => setOption(val, 'videoPreviewHover')"
        class="mt-0 pt-0"
        color="primary"
        hide-details
      >
        <v-radio value="none"
          class="mr-4">
          <template #label>
            <div class="ml-1"></div>
            <div class="text-body-1 text-high-emphasis">{{ $t('common.none') }}</div>
          </template>
        </v-radio>

        <v-radio value="timeline"
          class="mr-4">
          <template v-slot:label>
            <div class="ml-1"></div>
            <v-icon color="warning"
              size="small"
              start>mdi-alert
            </v-icon>
            <v-icon size="small"
              start>mdi-led-strip-variant
            </v-icon>
            <div class="text-body-1 text-high-emphasis">{{ $t('settings_labels.appearance.timeline') }}</div>
          </template>
        </v-radio>

        <v-radio value="video">
          <template #label>
            <div class="ml-1"></div>
            <v-icon size="small"
              start>mdi-television-play
            </v-icon>
            <div class="text-body-1 text-high-emphasis">{{ $t('settings_labels.appearance.video') }}</div>
          </template>
        </v-radio>
      </v-radio-group>
    </div>

    <!-- Play Sound Switch (only for video hover) -->
    <settings-switch
      v-if="SETTINGS.videoPreviewHover === 'video'"
      option="play_sound_on_video_preview"
      :title="$t('settings_labels.appearance.play_sound')"
    >
      <template #thumb>
        <v-icon v-if="SETTINGS.play_sound_on_video_preview == '1'"
          size="small">
          mdi-volume-high
        </v-icon>
        <v-icon v-else
          size="small">
          mdi-volume-off
        </v-icon>
      </template>
    </settings-switch>

    <!-- Delay for Video Preview -->
    <div v-if="SETTINGS.videoPreviewHover === 'video'">
      <div class="text-subtitle-2 mt-5 mb-2">{{ $t('settings_labels.appearance.preview_delay') }}
        {{ Math.floor(SETTINGS.delayVideoPreview) }} ms
      </div>
      <v-slider
        :model-value="SETTINGS.delayVideoPreview"
        @update:model-value="(val) => setOption(val, 'delayVideoPreview')"
        min="0"
        max="9999"
        step="100"
        track-size="7"
        density="compact"
        width="350"
        color="primary"
      />
    </div>

    <!-- Big Video Preview Switch -->
    <settings-switch
      v-if="SETTINGS.videoPreviewHover === 'video'"
      option="big_video_preview"
      :title="$t('settings_labels.appearance.big_preview')"
    ></settings-switch>

    <!-- Delay for Big Video Preview -->
    <div v-if="SETTINGS.videoPreviewHover === 'video' && SETTINGS.big_video_preview == '1'">
      <div class="text-subtitle-2 mt-5 mb-2">{{ $t('settings_labels.appearance.big_preview_delay') }}
        {{ Math.floor(SETTINGS.big_video_preview_delay) }} ms
      </div>
      <v-slider
        :model-value="SETTINGS.big_video_preview_delay"
        @update:model-value="(val) => setOption(val, 'big_video_preview_delay')"
        min="0"
        max="9999"
        step="100"
        track-size="7"
        density="compact"
        width="350"
        :color="SETTINGS.big_video_preview_delay < 1000 ? 'warning' : 'primary'"
      ></v-slider>

      <v-alert
        v-if="SETTINGS.big_video_preview_delay < 1000"
        type="warning"
        variant="tonal"
        class="text-caption"
        rounded="xl">
        {{ $t('settings_labels.appearance.big_preview_delay_warning') }}
      </v-alert>

      <v-alert
        type="info"
        variant="tonal"
        class="text-caption mt-4"
        rounded="xl"
        density="compact"
      >
        {{ $t('settings_labels.appearance.big_preview_set_thumb_hint') }}
      </v-alert>
    </div>
  </div>
</template>

<script setup>
import {useSettingsStore} from '@/stores/settings'
import SettingsCategoryDivider
  from '@/components/ui/SettingsCategoryDivider.vue'
import {computed} from "vue";
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue";
import SettingsSwitch from "@/components/ui/SettingsSwitch.vue";
import {setOption} from '@/services/settingsService'

// Stores and Composables
const settingsStore = useSettingsStore()

const SETTINGS = computed(() => settingsStore)
</script>