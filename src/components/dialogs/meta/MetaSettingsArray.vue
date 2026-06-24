<template>
  <SettingsSection padded>
    <v-switch
      v-model="settings.hidden"
      hide-details
      inset
    >
      <template v-slot:label>
        <div class="d-flex flex-column ml-2">
          <div>{{ t('meta.settings.hide_in_navigation') }}</div>
        </div>
      </template>
    </v-switch>

    <v-switch inset
      v-if="editMode"
      :disabled="!isPinnedToVideos"
      v-model="settings.marks"
      hide-details
      class="mt-2">
      <template v-slot:label>
        <div class="d-flex flex-column ml-2">
          <div>{{ t('meta.settings.marks_in_player') }}</div>
          <div class="text-caption mt-1">
            {{ t('meta.settings.marks_in_player_hint') }}
          </div>
        </div>
      </template>
    </v-switch>

    <v-switch inset
      v-if="editMode"
      :disabled="!isPinnedForMediaParser"
      v-model="settings.parser"
      hide-details
      class="mt-2">
      <template v-slot:label>
        <div class="d-flex flex-column ml-2">
          <div>
            {{ t('meta.settings.parse_media_for_tags') }}
            <button-documentation id="media.parser"></button-documentation>
          </div>
        </div>
      </template>
    </v-switch>

    <v-alert
      v-if="editMode && !isPinnedForMediaParser"
      type="info"
      class="text-caption mt-4 mb-4"
      variant="tonal"
      density="compact"
      rounded="xl"
      closable
    >
      {{ t('meta.settings.active_after_pinning_media') }}
    </v-alert>
  </SettingsSection>

  <SettingsSection padded>
    <settings-category-divider
      icon="post"
      compact
      :title="t('meta.settings.cards_appearance')"
    />
    <div class="text-high-emphasis">{{ t('meta.settings.image_aspect_ratio') }}</div>

    <v-alert
      color="info"
      icon="mdi-content-save-alert"
      class="text-caption mb-4 mt-2"
      variant="tonal"
      rounded="xl"
      density="compact"
      closable
    >
      {{ t('meta.settings.image_aspect_ratio_hint') }}
    </v-alert>

    <v-radio-group
      v-model="settings.imageAspectRatio"
      inline
      mandatory
      hide-details
      class="mt-2"
    >
      <v-radio :value="1"
        class="mb-4">
        <template v-slot:label>
          1:1
          <span
            class="aspect-ratio-sample"
            :style="`width:${25}px;height:${25}px;`"
          >
            <v-icon size="small">mdi-image-filter-hdr</v-icon>
          </span>
        </template>
      </v-radio>
      <v-radio :value="5 / 8"
        class="mb-4">
        <template v-slot:label>
          5:8
          <span
            class="aspect-ratio-sample"
            :style="`width:${(30 * 5) / 8}px;height:${30}px;`"
          >
            <v-icon size="small">mdi-account</v-icon>
          </span>
        </template>
      </v-radio>
      <v-radio :value="43 / 61"
        class="mb-4">
        <template v-slot:label>
          2:3
          <span
            class="aspect-ratio-sample"
            :style="`width:${(30 * 43) / 61}px;height:${30}px;`"
          >
            <v-icon size="small">mdi-account</v-icon>
          </span>
        </template>
      </v-radio>
      <v-radio :value="16 / 9"
        class="mb-4">
        <template v-slot:label>
          16:9
          <span
            class="aspect-ratio-sample"
            :style="`width:${40}px;height:${(40 / 16) * 9}px;`"
          >
            <v-icon size="small">mdi-image-filter-hdr</v-icon>
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </SettingsSection>

  <SettingsSection padded>
    <settings-category-divider
      icon="tag"
      compact
      :title="t('meta.settings.chips_appearance')"
    />

    <div class="d-flex align-center flex-wrap justify-space-between mt-4 mb-4">
      <div class="text-body-1 text-high-emphasis mr-6">
        <v-icon start>mdi-label</v-icon>
        {{ t('settings_labels.appearance.chip_variant') }}
      </div>

      <v-chip-group column>
        <v-chip
          v-for="variant in chipVariants"
          :key="chipKey"
          @click="settings.chipVariant = variant"
          :label="settings.chipLabel"
          :variant="variant"
          :base-color="settings.color ? randomColor : ''"
        >
          <v-icon v-if="settings.chipVariant == variant"
            start>mdi-check
          </v-icon>
          <span>{{ variant }}</span>
        </v-chip>
      </v-chip-group>

      <v-btn
        v-if="settings.color"
        @click="generateRandomColor"
        color="settings.color"
        icon
      >
        <v-icon>mdi-dice-5</v-icon>
      </v-btn>
    </div>

    <v-row>
      <v-col cols="12"
        sm="5">
        <v-switch v-model="settings.color"
          :label="t('settings_labels.appearance.colors')"
          class="my-0"
          hide-details
          inset/>
      </v-col>

      <v-col cols="12"
        sm="7">
        <v-switch v-model="settings.chipLabel"
          :label="t('meta.settings.label')"
          class="my-0"
          hide-details
          inset/>
      </v-col>
    </v-row>
  </SettingsSection>

  <SettingsSection padded>
    <settings-category-divider
      icon="shape"
      compact
      :title="t('meta.settings.preset_meta_in_tags')"
    />

    <v-row>
      <v-col cols="12"
        sm="5">
        <v-switch inset
          v-model="settings.rating">
          <template v-slot:label>
            <v-icon color="yellow-darken-2">mdi-star</v-icon>
            <div class=" ml-2">{{ t('meta.types.rating') }}</div>
          </template>
        </v-switch>

        <v-switch inset
          v-model="settings.favorite"
          hide-details>
          <template v-slot:label>
            <v-icon color="pink">mdi-heart</v-icon>
            <div class=" ml-2">{{ t('meta.sorting.favorite') }}</div>
          </template>
        </v-switch>
      </v-col>
      <v-col cols="12"
        sm="7">
        <v-switch inset
          v-model="settings.bookmark"
          class="mt-0"
        >
          <template v-slot:label>
            <div class="d-flex flex-column ml-2">
              <div>
                <v-icon color="red">mdi-bookmark</v-icon>
                {{ t('player.controls.bookmark') }}
              </div>
              <div class="text-caption mt-1">{{ t('meta.settings.bookmark_hint') }}</div>
            </div>
          </template>
        </v-switch>

        <v-switch inset
          v-model="settings.country"
          class="mt-0"
          hide-details>
          <template v-slot:label>
            <div class="d-flex flex-column ml-2">
              <div>
                <v-icon color="grey">mdi-flag</v-icon>
                {{ t('meta.types.country') }}
              </div>
              <div class="text-caption mt-1">{{ t('meta.settings.country_hint') }}</div>
            </div>
          </template>
        </v-switch>
      </v-col>
    </v-row>
  </SettingsSection>
</template>

<script setup>
import {ref, computed, onMounted, watch, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {isVideoMediaType, isImageMediaType, isAudioMediaType, isTextMediaType} from '@/utils/mediaType'
import axios from 'axios'
import SettingsCategoryDivider from '@/components/ui/SettingsCategoryDivider.vue'
import SettingsSection from '@/components/ui/SettingsSection.vue'
import ButtonDocumentation from '@/components/ui/ButtonDocumentation.vue'

// Props
const props = defineProps({
  meta: {
    type: Object,
    required: true
  },
  // Режим работы: создание (false) или редактирование (true)
  editMode: {
    type: Boolean,
    default: false
  },
})

// Emits
const emit = defineEmits(['update'])

// Stores
const appStore = useAppStore()
const {t} = useI18n()

// Refs
const settings = ref({
  hidden: false,
  parser: false,
  imageAspectRatio: 1,
  chipLabel: false,
  chipVariant: 'flat',
  color: false,
  favorite: false,
  rating: false,
  synonyms: false,
  bookmark: false,
  country: false,
  career: false,
  scraper: false,
  nested: false,
  marks: false
})

const chipVariants = ref([
  'flat',
  'tonal',
  'outlined',
  'text',
])

const isPinnedToVideos = ref(false)
const isPinnedForMediaParser = ref(false)
const chipKey = ref(0)
const randomColor = ref('#000000')

// Computed
const apiUrl = computed(() => appStore.localhost)

// Methods
const initSettings = () => {
  if (!props.meta) return

  // Копируем настройки из meta, сохраняя значения по умолчанию
  Object.keys(settings.value).forEach(key => {
    if (key in props.meta) {
      settings.value[key] = props.meta[key]
    }
  })
}

const generateRandomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  randomColor.value = color
  return color
}

const checkPinnedMediaTypes = async () => {
  try {
    const response = await axios.get(
      `${apiUrl.value}/api/MetaInMediaType?metaId=${props.meta.id}`
    )
    const pinnedMedia = response.data || []

    isPinnedToVideos.value = pinnedMedia.some((item) => isVideoMediaType(item.mediaType))
    isPinnedForMediaParser.value = pinnedMedia.some((item) =>
      isVideoMediaType(item.mediaType) ||
      isImageMediaType(item.mediaType) ||
      isAudioMediaType(item.mediaType) ||
      isTextMediaType(item.mediaType)
    )
  } catch (error) {
    console.error('Error checking pinned media:', error)
    isPinnedToVideos.value = false
    isPinnedForMediaParser.value = false
  }
}

const showDocumentation = (id) => {
  window.dispatchEvent(new CustomEvent('show-doc', {
    detail: {id}
  }))
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initSettings()
    checkPinnedMediaTypes()
    generateRandomColor()
  })
})

// Watchers
watch(settings, (мф) => {
  emit('update', settings.value)
}, {deep: true})

watch(() => props.meta, () => {
  initSettings()
  checkPinnedMediaTypes()
}, {immediate: true})
</script>

<style scoped>
.aspect-ratio-sample {
  border: 1px solid;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 3px;
  margin-right: 20px;
  margin-left: 10px;
  background-color: rgba(121, 121, 121, 0.164);
}
</style>