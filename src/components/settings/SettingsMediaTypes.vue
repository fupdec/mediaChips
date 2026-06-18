<template>
  <v-card flat max-width="800" style="margin: auto" class="my-6 px-4">
    <!--    <v-btn @click="dialogAdd = true" color="success" rounded variant="flat">-->
    <!--      <v-icon start>mdi-plus</v-icon>-->
    <!--      Add new media type-->
    <!--    </v-btn>-->

    <!--    <v-btn @click="$root.$emit('showDoc', 'media_types')" class="ml-4 mr-2" color="primary" icon>-->
    <!--      <v-icon>mdi-help-circle</v-icon>-->
    <!--    </v-btn>-->

    <v-data-iterator
      v-if="inited"
      :items="mediaTypes"
      :search="search"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      :items-per-page="-1"
      :no-data-text="t('media.type.please_add_media_first')"
      :no-results-text="t('media.type.no_media_found')"
      class="mt-6"
      hide-default-footer
    >
      <!--      <template v-slot:header>-->
      <!--        <div v-if="mediaTypes.length" class="d-flex flex-wrap align-start justify-space-between">-->
      <!--          <v-text-field-->
      <!--            v-model="search"-->
      <!--            append-icon="mdi-magnify"-->
      <!--            placeholder="Enter text for quick search"-->
      <!--            hint="by name, type, hint, icon, date"-->
      <!--            style="max-width: 350px"-->
      <!--            autofocus-->
      <!--            clearable-->
      <!--            rounded-->
      <!--            filled-->
      <!--            density="compact"-->
      <!--          ></v-text-field>-->

      <!--          <div class="mx-2"/>-->

      <!--          <v-switch-->
      <!--            v-model="detailed"-->
      <!--            label="Detailed"-->
      <!--            class="mt-1"-->
      <!--            inset-->
      <!--          />-->
      <!--        </div>-->
      <!--      </template>-->

      <template v-slot:default="{ items }">
        <v-row v-if="detailed" class="mb-4">
          <v-col
            v-for="m in items"
            :key="m.raw.id"
            cols="12"
            sm="6"
          >
            <v-card
              @click="open(m.raw)"
              :disabled="m.raw.type!=='video'"
              style="height: 100%;"
              rounded="xl"
              variant="tonal"
              hover
            >
              <v-card-title>
                <v-icon start>mdi-{{ m.raw.icon }}</v-icon>
                <span>{{ getMediaTypeName(m.raw, t) }}</span>
              </v-card-title>
              <v-card-text>
                <v-card variant="tonal" rounded="xl" class="pa-2 mb-2">
                  <span class="pl-2">{{ t('media.type.extensions') }}</span>
                  <v-chip-group column class="px-2" style="pointer-events: none;">
                    <v-chip v-for="ext in m.raw.extensions.split(',')" :key="ext" variant="tonal" size="small"
                            class="px-2">
                      <span>{{ ext }}</span>
                    </v-chip>
                  </v-chip-group>
                </v-card>

                <v-card variant="tonal" rounded="xl" class="pa-2">
                  <span class="pl-2">{{ t('media.type.pinned_meta') }}</span>
                  <span v-if="pinnedMeta[m.raw.id]?.length === 0">
                    {{ t('common.not_added') }}
                  </span>
                  <v-chip-group v-else column class="px-2" style="pointer-events: none;">
                    <v-chip
                      v-for="pm in pinnedMeta[m.raw.id] || []"
                      :key="pm.id"
                      variant="tonal"
                      size="small"
                      class="px-2"
                    >
                      <v-icon size="small" start>mdi-{{ pm.meta?.icon }}</v-icon>
                      <span>{{ pm.meta?.name }}</span>
                    </v-chip>
                  </v-chip-group>
                </v-card>

                <v-chip
                  v-if="m.raw.hidden !== 1"
                  class="mt-2"
                  style="pointer-events: none;"
                  size="small"
                  variant="tonal"
                >
                  <v-icon start color="success">mdi-check</v-icon>
                  <span>{{ t('media.type.show_in_navbar') }}</span>
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-chip-group v-else column>
          <v-chip
            v-for="m in items"
            :key="m.raw.id"
            @click="open(m.raw)"
          >
            <v-icon size="20" start>mdi-{{ m.raw.icon }}</v-icon>
            {{ getMediaTypeName(m.raw, t) }}
          </v-chip>
        </v-chip-group>
      </template>

      <template v-slot:no-results>
        <div class="layout-img">
          <v-img src="/images/filters/filters-no-results-file.svg" max-height="40vh" class="my-4" contain></v-img>
          <div>{{ t('media.type.no_media_found') }}</div>
        </div>
      </template>
    </v-data-iterator>

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
  </v-card>
</template>

<script setup>
import {ref, computed, onMounted, watch, defineAsyncComponent} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {storeToRefs} from 'pinia'
import {useEventBus} from '@/utils/eventBus'
import axios from 'axios'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
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

const search = ref('')
const sortBy = ref('name')
const sortDesc = ref(false)
const selected = ref(null)
const pinnedMeta = ref({})
const dialogAdd = ref(false)
const dialogEdit = ref(false)
const inited = ref(false)
const detailed = ref(true)

const apiUrl = computed(() => localhost.value)

const mediaTypes = computed(() => appStore.mediaTypes)
const meta = computed(() => appStore.meta)

onMounted(async () => {
  await init()
  // Загружаем данные из store
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

  for (let mediaType of mediaTypes.value) {
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

function checkAssignment(metaId, mediaTypeId) {
  const pinnedMetaList = pinnedMeta.value[mediaTypeId]?.map((i) => i.metaId) || []
  return pinnedMetaList.includes(metaId)
}

function open(media) {
  selected.value = media
  dialogEdit.value = true
}

function updateMediaTypes() {
  // Обновляем данные
  eventBus.emit('getMediaTypes')
  dialogEdit.value = false

  // Также обновляем прикрепленные метаданные для редактированного типа
  if (selected.value) {
    getMetaInMediaTypes(selected.value.id).then(data => {
      pinnedMeta.value[selected.value.id] = data
    })
  }
}
</script>