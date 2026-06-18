<template>
  <v-alert
    color="info"
    icon="mdi-content-save-alert"
    class="text-caption mb-4"
    variant="tonal"
    rounded="xl"
    density="compact"
  >
    {{ t('settings_labels.media_type_added_meta.irreversible_changes') }}

    <div v-if="!isMetaTypeArray" class="mt-1">
      {{ t('meta.settings.only_array_child_meta') }}
    </div>
  </v-alert>

  <v-card class="rounded-xl" variant="outlined">

    <!-- Tabs for switching between pinned meta and media types -->
    <v-tabs v-model="activeTab" grow color="primary">
      <v-tab value="media">{{ t('meta.settings.pinned_to_media_count', {count: pinnedMedia.length}) }}</v-tab>
      <v-tab
        value="meta"
        :disabled="!isMetaTypeArray"
        :class="{ 'opacity-50': !isMetaTypeArray }"
      >
        {{ t('meta.settings.pinned_child_meta_count', {count: pinnedMeta.length}) }}
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Tab 1: Pinned Media Types -->
      <v-window-item value="media">
        <div class="d-flex flex-wrap align-center ma-4">
          <v-btn
            @click="openDialogAdd('media')"
            color="success"
            rounded="pill"
            class="mr-4"
            prepend-icon="mdi-plus"
            :text="t('common.add')"
          ></v-btn>

          <v-btn
            @click="dialogRemove = true"
            :disabled="selectedForRemove.length === 0"
            color="error"
            rounded="pill"
            prepend-icon="mdi-close"
            :text="t('common.remove_count', {count: selectedForRemove.length})"
          ></v-btn>
        </div>

        <v-chip-group
          v-if="pinnedMedia.length"
          v-model="selectedForRemove"
          selected-class="text-primary"
          class="ma-4"
          multiple
          column
        >
          <v-chip
            v-for="m in pinnedMedia"
            :key="m.id"
            :prepend-icon="`mdi-${m.mediaType?.icon}`"
            :text="getMediaTypeName(m.mediaType, t)"
          ></v-chip>
        </v-chip-group>

        <div v-else class="text-center my-4">
          <v-img
            src="/images/no-pinned.svg"
            max-height="100"
            class="mb-2"
            contain
          ></v-img>
          <div class="text-medium-emphasis">{{ t('meta.settings.no_pinned_media') }}</div>
        </div>
      </v-window-item>

      <!-- Tab 2: Pinned Meta -->
      <v-window-item value="meta">
        <div v-if="isMetaTypeArray" class="d-flex flex-wrap align-center ma-4">
          <v-btn
            @click="openDialogAdd('meta')"
            color="success"
            rounded="pill"
            class="mr-4"
            prepend-icon="mdi-plus"
            :text="t('common.add')"
          ></v-btn>

          <v-btn
            @click="dialogRemove = true"
            :disabled="selectedForRemove.length === 0"
            color="error"
            rounded="pill"
            prepend-icon="mdi-close"
            :text="t('common.remove_count', {count: selectedForRemove.length})"
          ></v-btn>
        </div>

        <v-chip-group
          v-if="isMetaTypeArray && pinnedMeta.length"
          v-model="selectedForRemove"
          selected-class="text-primary"
          multiple
          column
          class="ma-4"
        >
          <v-chip
            v-for="m in pinnedMeta"
            :key="m.id"
          >
            <v-icon size="20" start>mdi-{{ m.meta?.icon }}</v-icon>
            {{ m.meta?.name }}
            <v-icon end size="small">{{ $readable.getIconDataType(m.meta?.type) }}</v-icon>
          </v-chip>
        </v-chip-group>

        <div v-if="isMetaTypeArray && !pinnedMeta.length" class="text-center my-4">
          <v-img
            src="/images/no-pinned.svg"
            max-height="100"
            class="mb-2"
            contain
          ></v-img>
          <div class="text-medium-emphasis">{{ t('meta.fields.no_pinned_meta') }}</div>
        </div>
      </v-window-item>
    </v-window>

    <!-- Dialog for Adding Items -->
    <v-dialog v-model="dialogAdd" scrollable width="580">
      <v-card>
        <DialogHeader
          @close="dialogAdd = false"
          :header="dialogHeader"
          :buttons="buttons"
          closable
        />

        <v-card-text class="mt-4">
          <v-data-iterator
            v-if="itemsForAdd.length"
            :items="itemsForAdd"
            :search="search"
            :items-per-page="-1"
            hide-default-footer
          >
            <template #header>
              <v-text-field
                v-model="search"
                class="mb-4"
                append-inner-icon="mdi-magnify"
                :label="searchLabel"
                :hint="activeTab === 'meta' ? t('meta.fields.search_meta_hint') : ''"
                clearable
                variant="filled"
                autofocus
              ></v-text-field>
            </template>

            <template #default="{ items }">
              <v-chip-group
                v-model="selectedForAdd"
                selected-class="text-primary"
                multiple
                column
              >
                <v-chip
                  v-for="item in items"
                  :key="item.raw.id"
                  class="ma-1"
                  variant="outlined"
                  :title="item.raw.hint"
                >
                  <template v-if="activeTab === 'meta'">
                    <v-icon size="20" start>mdi-{{ item.raw.icon }}</v-icon>
                    {{ item.raw.name }}
                    <v-icon end size="small">{{ $readable.getIconDataType(item.raw.type) }}</v-icon>
                  </template>
                  <template v-else>
                    <v-icon size="20" start>mdi-{{ item.raw.icon }}</v-icon>
                    {{ getMediaTypeName(item.raw, t) }}
                  </template>
                </v-chip>
              </v-chip-group>
            </template>

            <template #no-data>
              <div v-if="search" class="text-center py-4">
                <v-icon size="48" class="mb-2">mdi-magnify-close</v-icon>
                <div class="text-body-1">{{ t('common.no_items_found') }}</div>
              </div>
              <div v-else class="text-center py-4">
                <v-icon size="48" class="mb-2">{{ noDataIcon }}</v-icon>
                <div class="text-body-1">{{ noDataText }}</div>
              </div>
            </template>
          </v-data-iterator>

          <div v-else class="text-center py-4">
            <v-icon size="48" class="mb-2">{{ allPinnedIcon }}</v-icon>
            <div class="text-body-1">{{ allPinnedText }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog for Remove Confirmation -->
    <DialogDeleteConfirm
      v-if="dialogRemove"
      v-model="dialogRemove"
      @close="dialogRemove = false"
      @confirm="removeItems"
      :text="textForRemove"
      :title="dialogRemoveTitle"
    />
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import axios from 'axios'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import DialogDeleteConfirm from '@/components/dialogs/DialogDeleteConfirm.vue'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'

// Props
const props = defineProps({
  meta: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['pinned-meta-updated', 'pinned-media-updated'])

// Stores
const settingsStore = useSettingsStore()
const metaStore = useAppStore().meta
const mediaTypesStore = useAppStore().mediaTypes
const {t} = useI18n()

// State
const activeTab = ref('meta')
const pinnedMeta = ref([])
const pinnedMedia = ref([])
const metaForAdd = ref([])
const selectedForAdd = ref([])
const selectedForRemove = ref([])
const dialogAdd = ref(false)
const dialogRemove = ref(false)
const search = ref('')

// Computed
const apiUrl = computed(() => useAppStore().localhost)

const isMetaTypeArray = computed(() => props.meta?.type === 'array')

const dialogHeader = computed(() =>
  activeTab.value === 'meta'
    ? t('meta.settings.adding_pinned_meta')
    : t('meta.settings.pin_to_media_type')
)

const searchLabel = computed(() =>
  activeTab.value === 'meta' ? t('meta.fields.search_meta') : t('meta.settings.search_media_types')
)

const noDataIcon = computed(() =>
  activeTab.value === 'meta' ? 'mdi-database-remove' : 'mdi-folder-remove'
)

const noDataText = computed(() =>
  activeTab.value === 'meta' ? t('meta.settings.no_meta_available') : t('meta.settings.no_media_types_available')
)

const allPinnedIcon = computed(() =>
  activeTab.value === 'meta' ? 'mdi-database-check' : 'mdi-folder-check'
)

const allPinnedText = computed(() =>
  activeTab.value === 'meta'
    ? t('meta.settings.all_meta_pinned')
    : t('meta.settings.all_media_types_pinned')
)

const textForRemove = computed(() =>
  activeTab.value === 'meta'
    ? `${t('meta.settings.remove_from_all_tags')}\n${t('common.are_you_sure')}`
    : `${t('meta.settings.media_type_will_be_removed')}\n${t('common.are_you_sure')}`
)

const dialogRemoveTitle = computed(() =>
  activeTab.value === 'meta'
    ? t('meta.settings.remove_pinned_meta')
    : t('meta.settings.remove_pinned_media_types')
)

const itemsForAdd = computed(() => {
  if (activeTab.value === 'meta') {
    return metaForAdd.value
  } else {
    const allMediaTypes = mediaTypesStore || []
    const pinnedMediaTypeIds = pinnedMedia.value.map(i => i.mediaTypeId)
    return allMediaTypes.filter(i => !pinnedMediaTypeIds.includes(i.id))
  }
})

const buttons = computed(() => [
  {
    icon: 'check',
    text: t('common.apply'),
    color: 'success',
    variant: 'flat',
    action: activeTab.value === 'meta' ? addMeta : pinMediaTypes
  }
])

// Methods
const getPinnedMeta = async () => {
  try {
    if (!props.meta?.id || !isMetaTypeArray.value) return

    const response = await axios.get(`${apiUrl.value}/api/PinnedMeta?metaId=${props.meta.id}`)
    pinnedMeta.value = response.data || []
  } catch (e) {
    console.error('Error fetching pinned meta:', e)
  }
}

const getPinnedMedia = async () => {
  try {
    if (!props.meta?.id) return

    const response = await axios.get(
      `${apiUrl.value}/api/MetaInMediaType?metaId=${props.meta.id}`
    )
    pinnedMedia.value = response.data || []
  } catch (error) {
    console.error('Error fetching pinned media:', error)
  }
}

const fetchData = async () => {
  await getPinnedMedia()
  if (isMetaTypeArray.value) {
    await getPinnedMeta()
  }
}

const openDialogAdd = async (type) => {
  if (type) {
    activeTab.value = type
  }

  dialogAdd.value = true

  if (activeTab.value === 'meta' && isMetaTypeArray.value) {
    try {
      const response = await axios.get(`${apiUrl.value}/api/Meta`)
      const metaAll = response.data || []

      const pinnedMetaIds = pinnedMeta.value.map(i => i.pinnedMetaId)
      const metaFree = metaAll.filter(i => !pinnedMetaIds.includes(i.id))

      metaForAdd.value = metaFree.filter(i => i.id !== props.meta.id)
    } catch (error) {
      console.error('Error fetching available meta:', error)
      metaForAdd.value = []
    }
  }
}

const addMeta = async () => {
  try {
    const selectedIndices = Array.isArray(selectedForAdd.value)
      ? selectedForAdd.value
      : [selectedForAdd.value]

    for (const index of selectedIndices) {
      const meta = metaForAdd.value[index]
      if (meta) {
        await axios.post(`${apiUrl.value}/api/PinnedMeta`, {
          metaId: props.meta.id,
          pinnedMetaId: meta.id
        })
      }
    }

    dialogAdd.value = false
    search.value = ''
    selectedForAdd.value = []
    await getPinnedMeta()
    emit('pinned-meta-updated')
  } catch (error) {
    console.error('Error adding pinned meta:', error)
  }
}

const pinMediaTypes = async () => {
  try {
    const selectedIndices = Array.isArray(selectedForAdd.value)
      ? selectedForAdd.value
      : [selectedForAdd.value]

    for (const index of selectedIndices) {
      const mediaType = itemsForAdd.value[index]
      if (mediaType) {
        await axios.post(`${apiUrl.value}/api/MetaInMediaType`, {
          metaId: props.meta.id,
          mediaTypeId: mediaType.id
        })
      }
    }

    dialogAdd.value = false
    search.value = ''
    selectedForAdd.value = []
    await getPinnedMedia()
    emit('pinned-media-updated')
  } catch (error) {
    console.error('Error pinning media types:', error)
  }
}

const removeItems = async () => {
  try {
    if (activeTab.value === 'meta' && isMetaTypeArray.value) {
      const selectedIndices = Array.isArray(selectedForRemove.value)
        ? selectedForRemove.value
        : [selectedForRemove.value]

      for (const index of selectedIndices) {
        const pinnedItem = pinnedMeta.value[index]
        if (pinnedItem) {
          await axios.delete(
            `${apiUrl.value}/api/PinnedMeta/${pinnedItem.pinnedMetaId}?metaId=${props.meta.id}`
          )
        }
      }

      await getPinnedMeta()
      emit('pinned-meta-updated')
    } else {
      const selectedIndices = Array.isArray(selectedForRemove.value)
        ? selectedForRemove.value
        : [selectedForRemove.value]

      for (const index of selectedIndices) {
        const pinnedItem = pinnedMedia.value[index]
        if (pinnedItem) {
          await axios.delete(
            `${apiUrl.value}/api/MetaInMediaType?mediaTypeId=${pinnedItem.mediaTypeId}&metaId=${props.meta.id}`
          )
        }
      }

      await getPinnedMedia()
      emit('pinned-media-updated')
    }

    selectedForRemove.value = []
    dialogRemove.value = false
  } catch (error) {
    console.error('Error removing items:', error)
  }
}

// Lifecycle
onMounted(() => {
  if (props.meta?.id) {
    fetchData()
  }
  // Устанавливаем активную вкладку в зависимости от типа meta
  if (!isMetaTypeArray.value) {
    activeTab.value = 'media'
  }
})

// Watchers
watch(() => props.meta, (newMeta) => {
  if (newMeta?.id) {
    fetchData()
    // При изменении meta, если это array тип, переключаем на media вкладку
    if (newMeta.type === 'array') {
      activeTab.value = 'media'
    }
  }
}, { immediate: true })

watch(dialogAdd, (newVal) => {
  if (!newVal) {
    search.value = ''
    selectedForAdd.value = []
  }
})

watch(activeTab, () => {
  selectedForRemove.value = []
  search.value = ''
  selectedForAdd.value = []
})
</script>