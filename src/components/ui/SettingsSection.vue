<template>
  <v-card
    class="settings-section"
    :class="sectionClass"
    rounded="xl"
    variant="flat"
  >
    <slot/>
  </v-card>
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
.settings-section {
  background-color: rgb(120 120 120 / 5%) !important;
}

.settings-section:not(.settings-section--padded) {
  padding-block: 16px;
}

.settings-section--padded {
  padding: 16px;
}
</style>
