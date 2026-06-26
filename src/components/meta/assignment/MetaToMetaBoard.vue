<template>
  <div class="meta-to-meta-board">
    <v-card class="meta-to-meta-board__preview rounded-xl pa-3 mb-4" variant="flat">
      <div class="meta-to-meta-board__preview-header d-flex align-center flex-wrap ga-2 mb-2 text-caption text-medium-emphasis">
        <v-icon size="14">mdi-tag-outline</v-icon>
        <span>{{ t('meta.settings.tag_form_preview') }}</span>
        <v-chip
          size="x-small"
          variant="tonal"
          color="primary"
          :prepend-icon="`mdi-${parentMeta.icon}`"
        >
          {{ parentMeta.name }}
        </v-chip>
      </div>

      <draggable
        v-if="pinnedItems.length"
        :model-value="pinnedItems"
        item-key="pinnedMetaId"
        v-bind="dragOptions"
        class="meta-to-meta-board__slots"
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
              @click="$emit('unpin', element)"
            >
              <v-icon size="14">mdi-close</v-icon>
            </v-btn>
          </div>
        </template>
      </draggable>

      <div v-else class="meta-to-meta-board__empty-slot text-center py-3">
        <v-icon size="32" class="mb-1 text-medium-emphasis">mdi-form-select</v-icon>
        <div class="text-caption text-medium-emphasis">{{ t('meta.settings.add_field_slot') }}</div>
      </div>
    </v-card>

    <div v-if="pinnedItems.length" class="text-caption text-medium-emphasis mb-4">
      <v-icon size="14" start>mdi-drag</v-icon>
      {{ t('meta.settings.drag_to_reorder') }}
    </div>

    <div class="text-caption text-medium-emphasis mb-2">
      {{ t('meta.settings.available_fields') }}
    </div>

    <MetaFieldPool
      :items="allMeta"
      :exclude-ids="excludedIds"
      :disabled-ids="disabledMetaIds"
      :empty-icon="'mdi-database-check'"
      :empty-text="t('meta.settings.all_meta_pinned')"
      @select="$emit('pin', $event)"
    />
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {getIconDataType} from '@/services/metaTypeUtils'
import draggable from 'vuedraggable'
import MetaFieldPool from './MetaFieldPool.vue'

const props = defineProps({
  parentMeta: {type: Object, required: true},
  pinnedItems: {type: Array, default: () => []},
  allMeta: {type: Array, default: () => []},
})

const emit = defineEmits(['pin', 'unpin', 'reorder'])

const {t} = useI18n()

const dragOptions = {
  animation: 180,
  handle: '.meta-to-meta-board__drag',
  ghostClass: 'meta-to-meta-board__slot--ghost',
}

const excludedIds = computed(() => props.pinnedItems.map((i) => i.pinnedMetaId))

const disabledMetaIds = computed(() => {
  if (!props.parentMeta?.id) return []
  return [props.parentMeta.id]
})

const onReorder = (items) => {
  emit('reorder', items)
}
</script>
