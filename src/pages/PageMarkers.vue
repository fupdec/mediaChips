<template>
  <v-container>
    <div class="text-md-h2 d-flex align-center my-6">
      <v-icon size="42" start>mdi-tooltip-outline</v-icon>
      {{ t('navigation.markers') }}
    </div>

    <div
      v-if="marks.length && pagination.last_page > 1"
      class="d-flex align-center my-4"
    >
      <v-pagination
        v-model="pagination.current_page"
        @update:model-value="getMarksOnPage"
        :length="pagination.last_page"
        :total-visible="xs ? 5 : SETTINGS.numberOfPagesLimit"
        class="my-4"
        active-color="primary"
        density="comfortable"
        rounded
      ></v-pagination>
    </div>

    <v-row>
      <v-col
        v-for="mark in pagination.items_on_page"
        :key="mark.id"
        cols="12"
        sm="4"
        md="3"
        xl="2"
      >
        <item-marker :mark="mark"></item-marker>
      </v-col>
    </v-row>


    <div v-if="pagination.items_on_page.length == 0"
      class="layout-img">
      <v-img src="/images/no-data.svg"
        max-height="40vh"
        class="my-4"
        contain></v-img>
      <div class="text--secondary">{{ t('markers.no_markers_add_first') }}</div>
    </div>

    <div
      v-if="marks.length && pagination.last_page > 1"
      class="d-flex align-center my-4"
    >
      <v-pagination
        v-model="pagination.current_page"
        @update:model-value="getMarksOnPage"
        :length="pagination.last_page"
        :total-visible="xs ? 5 : SETTINGS.numberOfPagesLimit"
        class="my-4"
        active-color="primary"
        density="comfortable"
        rounded
      ></v-pagination>
    </div>
  </v-container>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import axios from "axios"
import ItemMarker from "@/components/items/ItemMarker.vue"

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const {xs} = useDisplay()
const {t} = useI18n()

// Refs
const marks = ref([])
const pagination = ref({
  items_on_page: [],
  total_items: 0,
  current_page: 1,
  last_page: 1,
})

// Computed
const apiUrl = computed(() => appStore.localhost)
const SETTINGS = computed(() => settingsStore)

// Methods
const getMarks = async () => {
  try {
    const res = await axios.get(apiUrl.value + "/api/mark")
    marks.value = res.data || []
    getMarksOnPage()
  } catch (e) {
    console.log(e)
  }
}

const getMarksOnPage = () => {
  let p = pagination.value
  p.total_items = marks.value.length
  const limit = 24
  p.last_page = Math.ceil(p.total_items / limit)

  if (p.current_page > p.last_page) {
    p.current_page = 1
  }

  const start = (p.current_page - 1) * limit
  const end = start + limit
  p.items_on_page = marks.value.slice(start, end)
}

// Lifecycle
onMounted(() => {
  getMarks()
})
</script>