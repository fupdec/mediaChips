<template>
  <v-dialog
    :model-value="dialog"
    :fullscreen="xs"
    :width="600"
    scrollable
    persistent
  >
    <v-card>
      <v-card-text class="pa-4">
        <v-alert
          type="info"
          density="compact"
          variant="tonal"
          rounded="xl"
          class="text-body-2"
        >
          {{ text }}
        </v-alert>
        <Loading/>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {defineAsyncComponent} from 'vue'
import {useDisplay} from 'vuetify'

const props = defineProps({
  dialog: {
    type: Boolean,
    required: true
  },
  text: {
    type: String,
    default: 'Please wait until the end of the process. This may take several minutes.'
  }
})

const {xs} = useDisplay()

const Loading = defineAsyncComponent(() =>
  import('@/components/elements/Loading.vue')
)
</script>