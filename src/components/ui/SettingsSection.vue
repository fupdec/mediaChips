<template>
  <section class="settings-section" :class="sectionClass">
    <slot/>
  </section>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  padded: {
    type: Boolean,
    default: false,
  },
})

const sectionClass = computed(() => ({
  'settings-section--padded': props.padded,
}))
</script>

<style scoped>
.settings-section--padded {
  padding-inline: 16px;
}
</style>
