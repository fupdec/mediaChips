<template>
  <v-container max-width="960">
    <div class="d-flex align-center">
      <v-btn
        color="success"
        rounded="xl"
        variant="flat"
        prepend-icon="mdi-plus"
        :text="t('meta.dialogs.add_new_meta')"
        @click="openCreateDialog"
      ></v-btn>

      <button-documentation id="meta_types"></button-documentation>
    </div>

    <v-spacer class="my-6"></v-spacer>

    <div v-if="!meta.length" class="layout-img">
      <v-img src="/images/no-data.svg" max-height="40vh" class="my-4" contain></v-img>
      <div class="text-medium-emphasis">{{ t('meta.dialogs.meta_missing_add_first') }}</div>
    </div>

    <div v-if="initiated && meta.length" class="d-flex align-center">
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        :placeholder="t('common.quick_search_placeholder')"
        hide-details
        autofocus
        clearable
        variant="filled"
        density="compact"
        max-width="300"
      ></v-text-field>

      <v-switch
        v-model="detailed"
        :label="t('common.detailed')"
        class="mt-0 ml-6"
        inset
        hide-details
        density="compact"
      />
    </div>

    <v-card
      v-for="(group, param) in filteredMeta"
      :key="`key_${metaKey}_param_${param}`"
      style="background-color: rgb(120 120 120 / 5%) !important;"
      class="pa-4 mb-4 mt-4 rounded-xl"
      variant="flat"
    >
      <div class="d-flex align-center text-subtitle-2 text-medium-emphasis mb-4">
        <v-icon color="grey" start>{{ $readable.getIconDataType(param) }}</v-icon>
        <span>{{ $readable.getTextDataType(param) }}</span>
      </div>

      <!-- Detailed view -->
      <div v-if="detailed">
        <v-row>
          <v-col
            v-for="m in group"
            :key="`key_${metaKey}_id_${m.id}`"
            cols="12"
            md="6"
          >
            <v-card
              @click="openEditDialog(m)"
              class="rounded-xl"
              style="height: 100%; background-color: rgb(120 120 120 / 5%) !important;"
              variant="flat"
              hover
            >
              <v-card-title class="text-medium-emphasis text-body-1">
                <v-icon start>mdi-{{ m.icon }}</v-icon>
                <span v-html="$readable.highlightChars(m.name)"/>
              </v-card-title>

              <v-card-text v-if="m.type === 'array'" class="d-flex flex-wrap" style="pointer-events: none;">
                <v-card
                  v-if="m.pinned.length !== 0"
                  style="height: 100%; width: 100%; background-color: rgb(120 120 120 / 5%) !important;"
                  class="rounded-xl"
                  variant="flat"
                >
                  <div class="text-medium-emphasis px-4 pt-2">{{ t('meta.fields.pinned_meta') }}:</div>
                  <v-chip-group column density="compact" class="px-2">
                    <v-chip v-for="pm in m.pinned" :key="`key_${metaKey}_pinned_id_${pm.meta.id}`" variant="outlined" size="small" class="px-2">
                      <v-icon class="mr-1" color="grey" size="small">mdi-{{ pm.meta.icon }}</v-icon>
                      <span class="text-medium-emphasis">{{ pm.meta.name }}</span>
                    </v-chip>
                  </v-chip-group>
                </v-card>

                <v-chip v-else class="ma-1" size="small" variant="outlined">
                  <v-icon start size="small" color="grey">mdi-pin-off-outline</v-icon>
                  <span class="text-medium-emphasis">{{ t('meta.fields.no_pinned_meta') }}</span>
                </v-chip>

                <v-chip v-if="!m.hidden" class="ma-1" size="small" variant="outlined">
                  <v-icon start color="success">mdi-check</v-icon>
                  <span class="text-medium-emphasis">{{ t('media.type.show_in_navbar') }}</span>
                </v-chip>

                <v-chip v-if="m.rating" class="ma-1" size="small" variant="outlined">
                  <v-icon color="yellow-darken-2" start size="small">mdi-star</v-icon>
                  <span class="text-medium-emphasis">{{ t('meta.types.rating') }}</span>
                </v-chip>

                <v-chip v-if="m.favorite" class="ma-1" size="small" variant="outlined">
                  <v-icon color="pink" start size="small">mdi-heart</v-icon>
                  <span class="text-medium-emphasis">{{ t('meta.sorting.favorite') }}</span>
                </v-chip>

                <v-chip v-if="m.bookmark" class="ma-1" size="small" variant="outlined">
                  <v-icon color="red" start size="small">mdi-bookmark</v-icon>
                  <span class="text-medium-emphasis">{{ t('player.controls.bookmark') }}</span>
                </v-chip>

                <v-chip v-if="m.country" class="ma-1" size="small" variant="outlined">
                  <v-icon color="grey" start size="small">mdi-flag</v-icon>
                  <span class="text-medium-emphasis">{{ t('meta.types.country') }}</span>
                </v-chip>

                <v-chip v-if="m.parser" class="ma-1" size="small" variant="outlined">
                  <v-icon color="grey" start size="small">mdi-text-box-search</v-icon>
                  <span class="text-medium-emphasis">{{ t('meta.fields.parser') }}</span>
                </v-chip>
              </v-card-text>

              <v-rating
                v-if="m.type === 'rating'"
                :model-value="1.5"
                :length="m.ratingMax"
                :full-icon="`mdi-${m.ratingIcon}`"
                :empty-icon="`mdi-${
                    m.ratingIconEmpty || m.ratingIcon
                  }`"
                :color="m.ratingColor"
                :half-increments="m.ratingHalf"
                :half-icon="`mdi-${m.ratingIconHalf || m.ratingIcon}`"
                background-color="grey"
                class="mx-4 mb-2"
                density="compact"
                readonly
              />
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Compact view -->
      <v-chip-group v-else column>
        <v-chip
          v-for="m in group"
          :key="`key_${metaKey}__id_${m.id}`"
          @click="openEditDialog(m)"
          class="ma-1"
        >
          <v-icon size="20" start>mdi-{{ m.icon }}</v-icon>
          <span v-html="$readable.highlightChars(m.name)"/>
        </v-chip>
      </v-chip-group>
    </v-card>

    <div v-if="meta.length && isSearchEmpty" class="layout-img">
      <v-img src="/images/filters/filters-no-results-meta.svg" max-height="40vh" class="my-4" contain></v-img>
      <div class="text-medium-emphasis">{{ t('meta.dialogs.no_meta_found') }}</div>
    </div>

    <!-- Менеджер для редактирования меты -->
    <MetaManager
      :edit-mode="editMode"
      :meta="selectedMeta"
      :dialog="editDialog"
      @updated="getMeta"
      @close="closeEditDialog"
    />
  </v-container>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useEventBus} from '@/utils/eventBus'
import axios from 'axios'
import _ from 'lodash'
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue";
import MetaManager from '@/components/dialogs/DialogMetaManager.vue'

// Stores
const appStore = useAppStore()
const eventBus = useEventBus()
const {t} = useI18n()

// Реактивные переменные
const meta = ref([])
const search = ref('')
const detailed = ref(false)
const initiated = ref(false)
const selectedMeta = ref(null)
const editDialog = ref(false)
const editMode = ref(false)
const metaKey = ref(0)

// Computed свойства
const apiUrl = computed(() => appStore.localhost)

const filteredMeta = computed(() => {
  const searchTerm = search.value?.toLowerCase() || ''

  let filtered = meta.value.filter(item => {
    const matchesSearch = searchTerm
      ? item.name.toLowerCase().includes(searchTerm)
      : true

    return matchesSearch
  })

  const customOrder = ['array', 'number', 'date', 'string', 'rating'];

  // Сортировка и группировка
  filtered = _.orderBy(filtered, [
    (item) => customOrder.indexOf(item.type), // приоритет по типу
    'value' // затем по значению
  ])
  return _.groupBy(filtered, 'type')
})

const isSearchEmpty = computed(() => {
  return _.isEmpty(filteredMeta.value)
})

const getMeta = async (type) => {
  try {
    initiated.value = false

    const response = await axios.get(`${apiUrl.value}/api/Meta`)

    // Загружаем метаданные
    const metaList = response.data
    console.log(' updated meta', metaList)

    // Загружаем закрепленные мета для каждого элемента
    for (const item of metaList) {
      item.pinned = await getPinnedMeta(item.id)
    }

    meta.value = metaList

    if (type === 'array') {
      eventBus.emit('getMeta')
    }
    metaKey.value++
    metaKey.value = Date.now()
  } catch (error) {
    console.error('Error fetching meta:', error)
  } finally {
    initiated.value = true
  }
}

const getPinnedMeta = async (metaId) => {
  try {
    const response = await axios.get(`${apiUrl.value}/api/PinnedMeta?metaId=${metaId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching pinned meta:', error)
    return []
  }
}

const openCreateDialog = () => {
  editMode.value = false
  editDialog.value = true
}

const openEditDialog = (metaItem) => {
  selectedMeta.value = metaItem
  editMode.value = true
  editDialog.value = true
}

const closeEditDialog = () => {
  editDialog.value = false
  selectedMeta.value = null
}

// Lifecycle hooks
onMounted(async () => {
  await getMeta()
})

// Watch для отслеживания изменений
watch(search, () => {
  // Логика при изменении поиска
})

watch(detailed, () => {
  // Логика при изменении режима отображения
})
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

.meta-rating {
  --v-rating-color: inherit;
}
</style>