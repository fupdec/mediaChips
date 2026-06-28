<template>
  <v-dialog v-if="dialog" @input="close" :model-value="dialog" width="800" scrollable>
    <v-card>
      <DialogHeader @close="close" :header="t('actions.scrape_info')" closable />

      <v-progress-linear
        v-if="progress < 99"
        :model-value="progress"
      ></v-progress-linear>
      <v-card-text>
        <div v-for="i in performers" :key="i.performer.id">
          {{ i.performer.name }}
          <ScraperDataTransfer :selected="i.result"></ScraperDataTransfer>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, defineAsyncComponent} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDialogsStore} from '@/stores/dialogs'
import DialogHeader from "@/components/elements/DialogHeader.vue"
import type { ScraperMultiplePerformer } from '@/types/scraper'

const ScraperDataTransfer = defineAsyncComponent(() =>
  import("@/components/scraper/ScraperDataTransfer.vue"),
)

const {t} = useI18n()
const dialogsStore = useDialogsStore()
const dialog = ref(false)

const performers = computed(() =>
  dialogsStore.scraperMultiple.performers as ScraperMultiplePerformer[]
)
const progress = computed(() => dialogsStore.scraperMultiple.progress)

function close() {
  dialogsStore.scraperMultiple.show = false
}

onMounted(() => {
  dialog.value = true
})
</script>
