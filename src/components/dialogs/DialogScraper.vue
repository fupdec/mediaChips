<template>
  <v-dialog
    v-show="dialogsStore.scraper.show"
    @update:model-value="dialogsStore.scraper.show = false"
    :model-value="dialogsStore.scraper.show"
    width="800"
    scrollable
  >
    <v-card>
      <DialogHeader @close="dialogsStore.scraper.show = false" :header="t('actions.scrape_info')" closable/>

      <v-card-text class="py-6">
        <form @submit.prevent="searchPerformer()">
          <v-text-field
            v-model="query"
            @click:append="searchPerformer(1)"
            :disabled="searchInProgress"
            :placeholder="t('scraper.performer_name_or_alias')"
            append-icon="mdi-magnify"
            class="mb-4"
            hide-details
            filled
            dense
            autofocus
          ></v-text-field>
        </form>

        <v-pagination
          v-if="performers.length && pagination.last_page > 1"
          v-model="pagination.current_page"
          @update:model-value="searchPerformer"
          :length="pagination.last_page"
          density="compact"
          active-color="primary"
          class="my-4"
          rounded
        ></v-pagination>

        <v-row>
          <v-col cols="4" xs="4" sm="3" md="2" v-for="i in performers" :key="i.id">
            <v-card @click="getInfo(i)" height="100%">
              <v-img :src="i.face || getEmptyImg()"></v-img>
              <v-card-title class="pa-2">
                <div class="text-body-2">{{ i.name }}</div>
              </v-card-title>
            </v-card>
          </v-col>
        </v-row>

        <v-dialog v-model="dialogDataTransfer" max-width="1000px" scrollable>
          <v-card>
            <DialogHeader
              @close="dialogDataTransfer = false"
              :header="t('scraper.data_transfer', {name: selected.name})"
              :buttons="buttons"
              closable
            ></DialogHeader>

            <v-card-text>
              <!-- ScraperDataTransfer компонент заменен на inline-разметку -->
              <ScraperDataTransfer :selected="selected"></ScraperDataTransfer>
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-pagination
          v-if="performers.length && pagination.last_page > 1"
          v-model="pagination.current_page"
          @update:model-value="searchPerformer"
          :length="pagination.last_page"
          density="compact"
          active-color="primary"
          class="my-4"
          rounded
        ></v-pagination>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useScraperStore} from '@/stores/scraper'
import {useDialogsStore} from '@/stores/dialogs'

import DialogHeader from "@/components/elements/DialogHeader.vue"
import ScraperDataTransfer from "@/components/scraper/ScraperDataTransfer.vue";
import {useEventBus} from "@/utils/eventBus";

const scraperStore = useScraperStore()
const dialogsStore = useDialogsStore()
const eventBus = useEventBus()
const {t} = useI18n()

const searchInProgress = ref(false)
const dialogDataTransfer = ref(false)
const performers = ref([])
const pagination = ref({})
const selected = ref({})
const buttons = computed(() => [
  {
    icon: 'check',
    text: t('common.apply'),
    color: 'success',
    outlined: false,
    action: transferScrapedInfo,
  }
])

// query теперь использует store
const query = computed({
  get: () => scraperStore.query,
  set: (value) => {
    scraperStore.query = value
  }
})

async function searchPerformer(page) {
  searchInProgress.value = true
  const result = await scraperStore.searchPerformer({
    page: page,
  })
  performers.value = result?.data || []
  pagination.value = result?.meta || {}
  searchInProgress.value = false
}

function getInfo(performer) {
  selected.value = performer
  dialogDataTransfer.value = true
}

function getEmptyImg() {
  // Замените на актуальный путь
  return '/images/unavailable.png'
}

function transferScrapedInfo() {
  dialogsStore.scraper.show = false
  eventBus.emit('transferScrapedInfo')
}

function closeDataTransferDialog() {
  dialogDataTransfer.value = false
  dialogsStore.scraper.images = []
}

onMounted(() => {
  searchPerformer(1)
})
</script>