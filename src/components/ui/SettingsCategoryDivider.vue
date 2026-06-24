<template>
  <div
    class="settings-category-divider d-flex align-center"
    :class="compact ? 'settings-category-divider--compact' : 'mb-6'"
  >
    <v-icon start :size="compact ? 'small' : 'default'">{{ `mdi-${props.icon}` }}</v-icon>
    <span class="text-h6 font-weight-medium">{{ props.title }}</span>
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  icon: String,
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.settings-category-divider--compact {
  margin-top: 0;
  margin-bottom: 16px;
}
</style>
