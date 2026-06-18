<template>
  <div class="mx-4">
    <settings-category-divider
      :title="$t('settings_labels.database.clear_generated_images')"
      icon="image-multiple-outline"
    ></settings-category-divider>

    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      rounded="xl"
      class="mb-6"
    >
      <span class="text-caption">
        {{ $t('settings_labels.database.clear_generated_images_hint') }}
      </span>
    </v-alert>

    <SettingsClearGeneratedImagesButton
      :button="$t('settings_labels.database.timelines')"
      image-type="timelines"
    />

    <SettingsClearGeneratedImagesButton
      :button="$t('settings_labels.database.grids')"
      image-type="grids"
    />

    <SettingsClearGeneratedImagesButton
      :button="$t('settings_labels.database.marks')"
      image-type="marks"
    />
  </div>
</template>

<script setup>
import SettingsClearGeneratedImagesButton from
    '@/components/settings/database/SettingsClearGeneratedImagesButton.vue'
import SettingsCategoryDivider from "@/components/ui/SettingsCategoryDivider.vue";
</script>
