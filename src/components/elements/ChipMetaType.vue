<template>
  <v-chip variant="outlined" size="small">
    <v-icon :icon="icon" size="small" start></v-icon>
    <span>{{ text }}</span>
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'
import {useI18n} from 'vue-i18n'

const props = defineProps({
  meta: {
    type: Object,
    required: true,
  },
})

const {t} = useI18n()

const icons = {
  string: 'mdi-format-text',
  number: 'mdi-numeric',
  array: 'mdi-format-list-bulleted',
  boolean: 'mdi-checkbox-marked-outline',
  rating: 'mdi-star',
  date: 'mdi-calendar',
  color: 'mdi-palette',
  country: 'mdi-flag',
}

const icon = computed(() => icons[props.meta.type] || 'mdi-help-circle')

const text = computed(() => t(`meta.types.${props.meta.type}`, props.meta.type))
</script>
