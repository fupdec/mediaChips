<template>
  <div class="meta-to-media-board">
  <template v-if="mode === 'from-meta'">
    <div class="text-caption text-medium-emphasis mb-3">
      {{ t('meta.settings.assignment_media_hint') }}
    </div>

    <div v-if="allMediaTypes.length" class="meta-to-media-board__grid">
      <MediaTypePreviewCard
        v-for="mediaType in allMediaTypes"
        :key="mediaType.id"
        :media-type="mediaType"
        :is-pinned="isMediaTypePinned(mediaType.id)"
        :highlight-meta="anchorMeta"
        :show-unpin="false"
        @pin="requestPin(mediaType)"
        @unpin="requestUnpin(mediaType)"
      />
    </div>

    <div v-else class="text-center py-4 text-medium-emphasis">
      {{ t('meta.settings.no_media_types_available') }}
    </div>
  </template>

  <template v-else>
    <MediaTypePreviewCard
      :media-type="anchorMediaType"
      :is-pinned="true"
      :pinned-fields="pinnedMetaFields"
      hero
      :clickable="false"
      :show-unpin="false"
      class="mb-4"
    />

    <div class="text-caption text-medium-emphasis mb-2">
      {{ t('meta.settings.pinned_fields') }}
    </div>

    <draggable
      v-if="pinnedItems.length"
      :model-value="pinnedItems"
      item-key="metaId"
      v-bind="dragOptions"
      class="meta-to-meta-board__slots mb-2"
      @update:model-value="onReorder"
    >
      <template #item="{element}">
        <div class="meta-to-meta-board__slot">
          <v-icon size="14" class="meta-to-meta-board__drag text-medium-emphasis">mdi-drag</v-icon>
          <v-icon size="16" color="primary" class="meta-to-meta-board__icon">mdi-{{ element.meta?.icon }}</v-icon>
          <span class="meta-to-meta-board__name text-body-2">{{ element.meta?.name }}</span>
          <v-icon size="12" class="meta-to-meta-board__type text-medium-emphasis">{{ getIconDataType(element.meta?.type) }}</v-icon>
          <v-btn
            class="meta-to-meta-board__unpin"
            icon
            size="x-small"
            variant="text"
            color="error"
            @click="$emit('unpin-meta', element)"
          >
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </div>
      </template>
    </draggable>

    <div v-else class="meta-to-media-board__empty mb-4">
      <v-img src="/images/no-pinned.svg" max-height="80" contain class="mb-2"/>
      <div class="text-medium-emphasis text-body-2">{{ t('meta.fields.no_pinned_meta') }}</div>
    </div>

    <div v-if="pinnedItems.length" class="text-caption text-medium-emphasis mb-4">
      <v-icon size="14" start>mdi-drag</v-icon>
      {{ t('meta.settings.drag_to_reorder') }}
    </div>

    <div class="text-caption text-medium-emphasis mb-2">
      {{ t('meta.settings.available_fields') }}
    </div>

        <MetaFieldPool
          :items="allMeta"
          :exclude-ids="pinnedMetaIds"
          :compact="true"
          :empty-icon="'mdi-database-check'"
          :empty-text="t('meta.settings.all_meta_pinned')"
          @select="requestPinMeta"
        />
  </template>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {getIconDataType} from '@/services/metaTypeUtils'
import draggable from 'vuedraggable'
import {useAppStore} from '@/stores/app'
import MediaTypePreviewCard from './MediaTypePreviewCard.vue'
import MetaFieldPool from './MetaFieldPool.vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'from-meta',
    validator: (v) => ['from-meta', 'from-media-type'].includes(v),
  },
  anchorMeta: {type: Object, default: null},
  anchorMediaType: {type: Object, default: null},
  pinnedMedia: {type: Array, default: () => []},
  pinnedItems: {type: Array, default: () => []},
  allMeta: {type: Array, default: () => []},
})

const emit = defineEmits(['pin-media', 'unpin-media', 'pin-meta', 'unpin-meta', 'reorder'])

const {t} = useI18n()
const allMediaTypes = computed(() => useAppStore().mediaTypes || [])

const dragOptions = {
  animation: 180,
  handle: '.meta-to-meta-board__drag',
  ghostClass: 'meta-to-meta-board__slot--ghost',
}

const pinnedMediaTypeIds = computed(() => new Set(props.pinnedMedia.map((i) => i.mediaTypeId)))

const pinnedMetaIds = computed(() => props.pinnedItems.map((i) => i.metaId))

const pinnedMetaFields = computed(() => props.pinnedItems.map((i) => i.meta).filter(Boolean))

const isMediaTypePinned = (mediaTypeId) => pinnedMediaTypeIds.value.has(mediaTypeId)

const requestPin = (mediaType) => emit('pin-media', mediaType)
const requestUnpin = (mediaType) => emit('unpin-media', mediaType)
const requestPinMeta = (meta) => emit('pin-meta', meta)
const onReorder = (items) => emit('reorder', items)
</script>
