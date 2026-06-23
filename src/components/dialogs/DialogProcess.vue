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
          {{ displayText }}
        </v-alert>
        <Loading/>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {computed, defineAsyncComponent} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'

const props = defineProps({
  dialog: {
    type: Boolean,
    required: true
  },
  text: {
    type: String,
    default: undefined
  }
})

const {t} = useI18n()
const {xs} = useDisplay()

const displayText = computed(() => props.text ?? t('process.wait_until_end'))

const Loading = defineAsyncComponent(() =>
  import('@/components/elements/Loading.vue')
)
</script>