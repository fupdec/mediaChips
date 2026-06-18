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
  </v-alert>

  <v-card class="rounded-xl" variant="outlined">
    <div class="d-flex flex-wrap align-center ma-4">
      <v-btn
        @click="openDialogAdd"
        color="success"
        rounded="pill"
        class="mr-2"
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
      v-if="addedMeta.length"
      v-model="selectedForRemove"
      selected-class="text-primary"
      class="ma-4"
      multiple
      column
    >
      <v-chip
        v-for="m in addedMeta"
        :key="m.id"
        :prepend-icon="`mdi-${m.meta?.icon}`"
        :append-icon="$readable.getIconDataType(m.meta?.type)"
        :text="m.meta?.name"
      ></v-chip>
    </v-chip-group>

    <div v-else class="text-center my-4">
      <v-img
        src="/images/no-pinned.svg"
        max-height="100"
        class="mb-2"
        contain
      ></v-img>
      <div class="text-medium-emphasis">{{ t('meta.fields.no_pinned_meta') }}</div>
    </div>

    <!-- Dialog for Adding Meta -->
    <v-dialog v-model="dialogAdd" scrollable width="580">
      <v-card>
        <DialogHeader
          @close="dialogAdd = false"
          :header="t('meta.dialogs.adding_meta')"
          :buttons="buttons"
          closable
        />

        <v-card-text class="mt-4">
          <v-data-iterator
            v-if="metaForAdd.length"
            :items="metaForAdd"
            :search="search"
            :items-per-page="-1"
            hide-default-footer
          >
            <template #header>
              <v-text-field
                v-model="search"
                class="mb-4"
                append-inner-icon="mdi-magnify"
                :label="t('meta.fields.search_meta')"
                :hint="t('meta.fields.search_meta_hint')"
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
                  v-for="tag in items"
                  :key="tag.raw.id"
                  class="ma-1"
                  variant="outlined"
                  :title="tag.raw.hint"
                >
                  <v-icon size="20" start>mdi-{{ tag.raw.icon }}</v-icon>
                  {{ tag.raw.name }}
                  <v-icon end size="small">{{ $readable.getIconDataType(tag.raw.type) }}</v-icon>
                </v-chip>
              </v-chip-group>
            </template>

            <template #no-data>
              <div class="text-center py-4">
                <v-icon size="48" class="mb-2">mdi-magnify-close</v-icon>
                <div class="text-body-1">{{ t('meta.dialogs.no_meta_found') }}</div>
              </div>
            </template>
          </v-data-iterator>

          <div v-else class="text-center py-4">
            <v-icon size="48" class="mb-2">mdi-database-remove</v-icon>
            <div class="text-body-1">{{ t('meta.dialogs.no_meta_available_to_add') }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog for Remove Confirmation -->
    <DialogDeleteConfirm
      v-if="dialogRemove"
      v-model="dialogRemove"
      @close="dialogRemove = false"
      @confirm="removePinnedMeta"
      :text="textForRemove"
      :title="t('meta.dialogs.remove_meta')"
    />
  </v-card>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import axios from 'axios'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import DialogDeleteConfirm from '@/components/dialogs/DialogDeleteConfirm.vue'

// Props
const props = defineProps({
  mediaType: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['meta-updated'])
const {t} = useI18n()

// State
const addedMeta = ref([])
const metaForAdd = ref([])
const selectedForAdd = ref([])
const selectedForRemove = ref([])
const dialogAdd = ref(false)
const dialogRemove = ref(false)
const search = ref('')

// Computed
const apiUrl = computed(() => useAppStore().localhost)
const textForRemove = computed(() => `${t('meta.dialogs.remove_from_all_media')}\n${t('common.are_you_sure')}`)

const buttons = computed(() => [
  {
    icon: 'check',
    text: t('common.apply'),
    color: 'success',
    variant: 'flat',
    function: pinMeta
  }
])

// Methods
const getPinnedMeta = async () => {
  try {
    const response = await axios.get(
      `${apiUrl.value}/api/MetaInMediaType?mediaTypeId=${props.mediaType.id}`
    )
    addedMeta.value = response.data || []
    emit('meta-updated', addedMeta.value)
  } catch (error) {
    console.error('Error fetching pinned meta:', error)
    addedMeta.value = []
  }
}

const openDialogAdd = async () => {
  dialogAdd.value = true
  try {
    // Получаем все метаданные
    const response = await axios.get(`${apiUrl.value}/api/Meta`)
    const metaAll = response.data || []

    // Фильтруем уже добавленные
    const addedMetaIds = addedMeta.value.map(i => i.metaId)
    metaForAdd.value = metaAll.filter(i => !addedMetaIds.includes(i.id))
  } catch (error) {
    console.error('Error fetching available meta:', error)
    metaForAdd.value = []
  }
}

const pinMeta = async () => {
  try {
    const selectedIndices = Array.isArray(selectedForAdd.value)
      ? selectedForAdd.value
      : [selectedForAdd.value]

    for (const index of selectedIndices) {
      const meta = metaForAdd.value[index]
      if (meta) {
        await axios.post(`${apiUrl.value}/api/MetaInMediaType`, {
          mediaTypeId: props.mediaType.id,
          metaId: meta.id
        })
      }
    }

    // Сброс и обновление
    dialogAdd.value = false
    search.value = ''
    selectedForAdd.value = []
    await getPinnedMeta()
  } catch (error) {
    console.error('Error pinning meta:', error)
  }
}

const removePinnedMeta = async () => {
  try {
    const selectedIndices = Array.isArray(selectedForRemove.value)
      ? selectedForRemove.value
      : [selectedForRemove.value]

    for (const index of selectedIndices) {
      const meta = addedMeta.value[index]
      if (meta && meta.meta) {
        await axios.delete(
          `${apiUrl.value}/api/MetaInMediaType?mediaTypeId=${props.mediaType.id}&metaId=${meta.meta.id}`
        )
      }
    }

    // Сброс и обновление
    await getPinnedMeta()
    selectedForRemove.value = []
    dialogRemove.value = false
  } catch (error) {
    console.error('Error removing pinned meta:', error)
  }
}

// Lifecycle
onMounted(() => {
  if (props.mediaType?.id) {
    getPinnedMeta()
  }
})

// Watchers
watch(() => props.mediaType, (newMediaType) => {
  if (newMediaType?.id) {
    getPinnedMeta()
  }
}, {immediate: true})

// Watch for dialog close to reset
watch(dialogAdd, (newVal) => {
  if (!newVal) {
    search.value = ''
    selectedForAdd.value = []
  }
})
</script>