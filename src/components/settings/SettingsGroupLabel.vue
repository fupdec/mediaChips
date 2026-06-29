<template>
  <div class="settings-group-label text-overline text-medium-emphasis">
    {{ title }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.settings-group-label {
  letter-spacing: 0.08em;
  padding-inline: 4px;
  margin-bottom: 8px;
}
</style>
