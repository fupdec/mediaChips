<template>
  <v-dialog
    v-model="model"
    width="400"
    scrollable
    persistent
  >
    <v-card>
      <v-card-text class="text-center">
        <v-icon
          icon="mdi-alert-outline"
          size="48"
          color="error"
          class="py-6 mb-4"
        />
        <div class="error-text" v-html="text"></div>
      </v-card-text>

      <v-card-actions class="pb-4 px-4">
        <v-btn
          variant="text"
          class="pr-4"
          @click="close"
        >
          <v-icon icon="mdi-close" class="mr-2"/>
          Cancel
        </v-btn>

        <v-spacer/>

        <v-btn
          color="error"
          variant="flat"
          class="pr-4"
          @click="remove"
        >
          <v-icon icon="mdi-check" class="mr-2"/>
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {computed, onMounted} from 'vue'

const emit = defineEmits([
  'update:dialog',
  'close',
  'confirm',
  'remove',
  'delete',
])

const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
})

const model = computed({
  get: () => props.dialog,
  set: (val) => {
    emit('update:dialog', val)
    if (!val) emit('close')
  },
})

function close() {
  model.value = false
  emit('close')
}

function remove() {
  emit('delete')
  emit('remove')
  emit('confirm')
  model.value = false
}
onMounted(() => {
  model.value = true
})
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.error-text {
  color: rgb(var(--v-theme-error));
}
</style>
