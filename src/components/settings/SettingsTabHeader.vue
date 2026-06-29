<template>
  <header class="settings-tab-header">
    <div class="d-flex align-center ga-3">
      <v-avatar
        v-if="icon"
        :icon="icon"
        color="primary"
        variant="tonal"
        size="40"
        rounded="lg"
      />
      <div class="settings-tab-header__text">
        <h2 class="text-h5 font-weight-medium">{{ title }}</h2>
        <p v-if="description" class="text-body-2 text-medium-emphasis mb-0">
          {{ description }}
        </p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<style scoped>
.settings-tab-header {
  margin-bottom: 20px;
}

.settings-tab-header__text {
  min-width: 0;
}
</style>
