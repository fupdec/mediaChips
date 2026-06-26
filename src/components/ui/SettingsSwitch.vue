<script setup>
import {useAttrs} from 'vue'

const emit = defineEmits([
  'update',     // Кастомное событие
])
import {useSettingsStore} from "@/stores/settings";
import {setOption as persistSetting} from '@/services/settingsService'

const attrs = useAttrs()

const settingsStore = useSettingsStore();

const props = defineProps({
  option: String,
  title: String,
  hint: String,
  iconText: String,
  iconColor: String,
  disabled: {
    type: Boolean,
    default: false,
  },
})

const setOption = (value) => {
  persistSetting(value, props.option)
  emit('update', value)
}
</script>

<template>
  <v-switch
    v-bind="attrs"
    :model-value="settingsStore[props.option]"
    @update:modelValue="value => setOption(value)"
    color="primary"
    false-value="0"
    true-value="1"
    class="mt-0 settings-switch"
    :disabled="disabled"
    :hide-details="!hint"
    inset
  >
    <template #label>
      <div
        v-if="title || hint"
        class="d-flex flex-column ml-4"
      >
        <div v-if="title" class="text-body-1 text-high-emphasis">
          <v-icon v-if="iconText" :color="iconColor"
            size="small"
            start>mdi-{{iconText}}
          </v-icon>
          {{ title }}
        </div>
        <div v-if="hint" class="text-caption text-medium-emphasis mt-1">{{ hint }}</div>
      </div>
      <slot name="label"></slot>
    </template>
    <template #thumb>
      <slot name="thumb"></slot>
    </template>
  </v-switch>
</template>

<style scoped>
.settings-switch :deep(.v-label) {
  background-color: transparent !important;
  opacity: 1;
}
</style>