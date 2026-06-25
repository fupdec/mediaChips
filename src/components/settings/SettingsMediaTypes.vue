<template>
  <div>
    <div v-if="!mediaTypes.length" class="layout-img">
      <v-img src="/images/no-data.svg" max-height="40vh" class="my-4" contain></v-img>
      <div class="text-medium-emphasis">{{ t('media.type.please_add_media_first') }}</div>
    </div>

    <div v-if="inited && mediaTypes.length" class="d-flex justify-start mb-2">
      <v-switch
        v-model="detailed"
        :label="t('common.detailed')"
        class="mt-0"
        inset
        hide-details
        density="compact"
      />
    </div>

    <v-card
      v-for="m in sortedMediaTypesList"
      :key="m.id"
      @click="open(m)"
      :disabled="!isEditableMediaType(m)"
      style="background-color: rgb(120 120 120 / 5%) !important;"
      class="media-type-card pa-4 mb-4 mt-4 rounded-xl"
      variant="flat"
      hover
    >
      <div class="media-type-card__header d-flex align-center">
        <v-icon class="mr-3" color="grey">mdi-{{ m.icon }}</v-icon>
        <span class="text-body-1 text-medium-emphasis">{{ getMediaTypeName(m, t) }}</span>

        <v-chip
          v-if="!detailed && m.hidden !== 1"
          class="ml-4"
          size="small"
          variant="outlined"
          style="pointer-events: none;"
        >
          <v-icon start color="success" size="small">mdi-check</v-icon>
          <span class="text-medium-emphasis">{{ t('media.type.show_in_navbar') }}</span>
        </v-chip>

        <v-spacer/>

        <v-icon
          v-if="isEditableMediaType(m)"
          size="20"
          color="grey"
        >
          mdi-chevron-right
        </v-icon>
      </div>

      <div v-if="detailed" class="media-type-card__body" style="pointer-events: none;">
        <div class="media-type-card__section">
          <div class="text-medium-emphasis text-caption mb-2">{{ t('media.type.extensions') }}</div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="ext in getExtensions(m)"
              :key="`${m.id}_${ext}`"
              variant="outlined"
              size="small"
            >
              <span class="text-medium-emphasis">{{ ext }}</span>
            </v-chip>
          </div>
        </div>

        <div class="media-type-card__section">
          <div class="text-medium-emphasis text-caption mb-2">{{ t('media.type.pinned_meta') }}</div>
          <div v-if="pinnedMeta[m.id]?.length" class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="pm in pinnedMeta[m.id]"
              :key="pm.id"
              variant="outlined"
              size="small"
            >
              <v-icon class="mr-1" color="grey" size="small">mdi-{{ pm.meta?.icon }}</v-icon>
              <span class="text-medium-emphasis">{{ pm.meta?.name }}</span>
            </v-chip>
          </div>
          <v-chip v-else size="small" variant="outlined">
            <span class="text-medium-emphasis">{{ t('media.type.no_pinned_meta') }}</span>
          </v-chip>
        </div>

        <div class="media-type-card__section media-type-card__section--flags">
          <v-chip
            v-if="m.hidden !== 1"
            size="small"
            variant="outlined"
          >
            <v-icon start color="success" size="small">mdi-check</v-icon>
            <span class="text-medium-emphasis">{{ t('media.type.show_in_navbar') }}</span>
          </v-chip>
        </div>
      </div>
    </v-card>

    <DialogMediaTypeAdd
      v-if="dialogAdd"
      v-model="dialogAdd"
      @added="finishAdding"
      @close="dialogAdd = false"
    />

    <DialogMediaTypeEdit
      v-if="dialogEdit"
      :dialog="dialogEdit"
      :media="selected"
      @update="updateMediaTypes"
      @close="dialogEdit = false"
    />
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watch, defineAsyncComponent} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {storeToRefs} from 'pinia'
import {useEventBus} from '@/utils/eventBus'
import axios from 'axios'
import _ from 'lodash'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
import {isEditableMediaType} from '@/utils/mediaType'

const DialogMediaTypeAdd = defineAsyncComponent(() =>
  import('@/components/dialogs/DialogMediaTypeAdd.vue')
)
const DialogMediaTypeEdit = defineAsyncComponent(() =>
  import('@/components/dialogs/DialogMediaTypeEdit.vue')
)

const appStore = useAppStore()
const {localhost} = storeToRefs(appStore)
const eventBus = useEventBus()
const {t} = useI18n()

const selected = ref(null)
const pinnedMeta = ref({})
const dialogAdd = ref(false)
const dialogEdit = ref(false)
const inited = ref(false)
const detailed = ref(true)

const apiUrl = computed(() => localhost.value)
const mediaTypes = computed(() => appStore.mediaTypes)

const sortedMediaTypesList = computed(() => _.orderBy(mediaTypes.value, ['order', 'name']))

function getExtensions(mediaType) {
  return String(mediaType.extensions || '')
    .split(',')
    .map(ext => ext.trim())
    .filter(Boolean)
}

onMounted(async () => {
  await init()
  eventBus.emit('getMediaTypes')
  eventBus.emit('getMeta')
})

watch(mediaTypes, (newTypes) => {
  if (newTypes.length > 0 && !inited.value) {
    init()
  }
})

async function init() {
  if (mediaTypes.value.length === 0) return

  for (const mediaType of mediaTypes.value) {
    const res = await axios.get(`${apiUrl.value}/api/MetaInMediaType?mediaTypeId=${mediaType.id}`)
    pinnedMeta.value[mediaType.id] = res.data
  }
  inited.value = true
}

function finishAdding() {
  dialogAdd.value = false
  eventBus.emit('getMediaTypes')
}

async function getMetaInMediaTypes(mediaTypeId) {
  try {
    const response = await axios.get(`${apiUrl.value}/api/MetaInMediaType?mediaTypeId=${mediaTypeId}`)
    return response.data
  } catch (e) {
    console.error(e)
    return []
  }
}

function open(media) {
  if (!isEditableMediaType(media)) return
  selected.value = media
  dialogEdit.value = true
}

function updateMediaTypes() {
  eventBus.emit('getMediaTypes')
  dialogEdit.value = false

  if (selected.value) {
    getMetaInMediaTypes(selected.value.id).then(data => {
      pinnedMeta.value[selected.value.id] = data
    })
  }
}
</script>

<style scoped>
.layout-img {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.media-type-card__body {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgb(120 120 120 / 15%);
}

.media-type-card__section {
  flex: 1 1 240px;
  min-width: 0;
}

.media-type-card__section--flags {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
}
</style>
