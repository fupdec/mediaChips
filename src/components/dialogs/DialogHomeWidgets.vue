<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    width="560"
    scrollable
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center px-6 py-4">
        <v-icon class="mr-2" size="24">mdi-view-dashboard-outline</v-icon>
        {{ t('settings_labels.general.home_widgets') }}
        <v-spacer/>
        <v-btn
          icon
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider/>

      <v-card-text class="pa-6">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          rounded="xl"
          class="mb-4"
        >
          <span class="text-caption">{{ t('settings_labels.general.home_widgets_hint') }}</span>
        </v-alert>

        <HomeWidgetsEditor/>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {useI18n} from 'vue-i18n'
import HomeWidgetsEditor from '@/components/widgets/HomeWidgetsEditor.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const {t} = useI18n()
</script>
