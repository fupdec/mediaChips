<template>
  <nav class="settings-nav" aria-label="Settings sections">
    <v-list
      v-model:selected="selected"
      color="primary"
      density="comfortable"
      nav
      class="settings-nav__list"
    >
      <v-list-item
        v-for="item in items"
        :key="item.value"
        :id="item.docId"
        :value="item.value"
        :prepend-icon="item.icon"
        :title="t(item.labelKey)"
        :subtitle="compact ? undefined : t(item.descKey)"
        class="settings-nav__item"
      />
    </v-list>
  </nav>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'

export interface SettingsNavItem {
  value: string
  icon: string
  labelKey: string
  descKey: string
  docId?: string
}

const props = defineProps<{
  modelValue: string
  items: SettingsNavItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const {t} = useI18n()
const {smAndDown} = useDisplay()

const compact = computed(() => smAndDown.value)

const selected = computed({
  get: () => [props.modelValue],
  set: (value: string[]) => {
    const next = value[0]
    if (next && next !== props.modelValue) {
      emit('update:modelValue', next)
    }
  },
})
</script>

<style scoped>
.settings-nav__list {
  background: transparent;
  padding: 0;
}

.settings-nav__item {
  margin-bottom: 4px;
  border-radius: 8px;
}

.settings-nav__item :deep(.v-list-item__overlay),
.settings-nav__item :deep(.v-list-item__underlay) {
  border-radius: 8px;
}

.settings-nav__item :deep(.v-list-item-subtitle) {
  white-space: normal;
  line-height: 1.35;
  opacity: 0.72;
}

@media (max-width: 959px) {
  .settings-nav__list {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }

  .settings-nav__item {
    flex: 0 0 auto;
    margin-bottom: 0;
    min-width: max-content;
  }

  .settings-nav__item :deep(.v-list-item__content) {
    white-space: nowrap;
  }
}
</style>
