<template>
  <div class="d-flex align-center mt-4 mb-6">
    <v-icon start>{{ `mdi-${props.icon}` }}</v-icon>
    <span class="text-h5">{{ props.title }}</span>
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  icon: String,
})
</script>