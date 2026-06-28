<template>
  <v-chip variant="outlined" size="small">
    <v-icon :icon="icon" size="small" start></v-icon>
    <span>{{ text }}</span>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {useI18n} from 'vue-i18n'
import type { Meta } from '@/types/stores'

const props = defineProps<{
  meta: Meta
}>()

const {t} = useI18n()

const icons: Record<string, string> = {
  string: 'mdi-format-text',
  number: 'mdi-numeric',
  array: 'mdi-format-list-bulleted',
  boolean: 'mdi-checkbox-marked-outline',
  rating: 'mdi-star',
  date: 'mdi-calendar',
  color: 'mdi-palette',
  country: 'mdi-flag',
}

const icon = computed(() => icons[props.meta.type ?? ''] || 'mdi-help-circle')

const text = computed(() => t(`meta.types.${props.meta.type}`, props.meta.type ?? ''))
</script>
