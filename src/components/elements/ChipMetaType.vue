<template>
  <v-chip variant="outlined" size="small">
    <v-icon :icon="icon" size="small" start></v-icon>
    <span>{{ text }}</span>
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  meta: {
    type: Object,
    required: true
  }
})

// Утилитарные функции для получения иконки и текста
const getIconDataType = (type) => {
  const icons = {
    string: 'mdi-format-text',
    number: 'mdi-numeric',
    array: 'mdi-format-list-bulleted',
    boolean: 'mdi-checkbox-marked-outline',
    rating: 'mdi-star',
    date: 'mdi-calendar',
    color: 'mdi-palette',
    country: 'mdi-flag',
    // Добавьте другие типы по необходимости
  }
  return icons[type] || 'mdi-help-circle'
}

const getTextDataType = (type) => {
  const texts = {
    string: 'Text',
    number: 'Number',
    array: 'List',
    boolean: 'Boolean',
    rating: 'Rating',
    date: 'Date',
    color: 'Color',
    country: 'Country',
    // Добавьте другие типы по необходимости
  }
  return texts[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

// Computed properties
const icon = computed(() => {
  return getIconDataType(props.meta.type)
})

const text = computed(() => {
  return getTextDataType(props.meta.type)
})
</script>

<style scoped>
/* Можно добавить дополнительные стили если нужно */
</style>