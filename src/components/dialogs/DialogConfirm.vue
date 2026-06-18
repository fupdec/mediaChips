<template>
  <v-dialog
    v-model="model"
    :persistent="persistent"
    width="400"
    scrollable
  >
    <v-card>
      <v-card-text class="text-center pt-8">
        <div v-html="text" />
      </v-card-text>

      <v-card-actions class="pb-4 px-4">
        <v-btn
          v-if="closable"
          variant="text"
          class="px-4"
          @click="close"
        >
          <v-icon icon="mdi-close" start />
          No
        </v-btn>

        <v-spacer />

        <v-btn
          color="success"
          variant="flat"
          class="px-4"
          @click="confirm"
        >
          <v-icon icon="mdi-check" start />
          Yes
        </v-btn>

        <v-spacer v-if="!closable" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const emit = defineEmits(['update:dialog', 'close', 'confirm'])

const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  persistent: {
    type: Boolean,
    default: false,
  },
  closable: {
    type: Boolean,
    default: true,
  },
})

/**
 * v-model wrapper
 */
const model = computed({
  get: () => props.dialog,
  set: (val) => {
    emit('update:dialog', val)
    if (!val) emit('close')
  },
})

function close() {
  model.value = false
}

function confirm() {
  emit('confirm')
  model.value = false
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
</style>
