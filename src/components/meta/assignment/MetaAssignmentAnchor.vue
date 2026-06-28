<template>
  <div class="meta-assignment-anchor">
    <div class="meta-assignment-anchor__icon">
      <v-icon size="28" color="primary">mdi-{{ icon }}</v-icon>
    </div>
    <div class="meta-assignment-anchor__body">
      <div class="meta-assignment-anchor__name text-body-1 font-weight-medium">{{ name }}</div>
      <div v-if="subtitle" class="meta-assignment-anchor__subtitle text-caption text-medium-emphasis">
        {{ subtitle }}
      </div>
    </div>
    <v-chip v-if="typeLabel" size="x-small" variant="tonal" color="primary" class="meta-assignment-anchor__type">
      {{ typeLabel }}
    </v-chip>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon: string
  name: string
  subtitle?: string
  typeLabel?: string
}>(), {
  subtitle: '',
  typeLabel: '',
})
</script>
