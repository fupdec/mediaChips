<template>
  <div class="meta-field-pool">
    <div v-if="groupedItems.length" class="meta-field-pool__groups">
      <div v-for="group in groupedItems" :key="group.type" class="meta-field-pool__group">
        <div class="meta-field-pool__group-label text-caption text-medium-emphasis mb-1">
          <v-icon size="14" start>{{ getIconDataType(group.type) }}</v-icon>
          {{ formatDataType(group.type) }}
        </div>
        <div class="meta-field-pool__items">
          <v-chip
            v-for="item in group.items"
            :key="item.id"
            variant="outlined"
            :size="compact ? 'x-small' : 'small'"
            class="meta-field-pool__chip"
            :disabled="item.disabled"
            :title="item.hint || item.name"
            @click="!item.disabled && $emit('select', item)"
          >
            <v-icon size="16" start>mdi-{{ item.icon }}</v-icon>
            {{ item.name }}
          </v-chip>
        </div>
      </div>
    </div>

    <div v-else class="meta-field-pool__empty text-center py-4">
      <v-icon size="40" class="mb-2 text-medium-emphasis">{{ emptyIcon }}</v-icon>
      <div class="text-body-2 text-medium-emphasis">{{ emptyText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {getIconDataType, getTextDataType} from '@/services/metaTypeUtils'
import {groupMetaByType} from '@/utils/metaSort'
import type {MetaFieldPoolItem} from '@/types/metaAssignment'

const props = withDefaults(defineProps<{
  items?: MetaFieldPoolItem[]
  excludeIds?: Array<number | string>
  disabledIds?: Array<number | string>
  compact?: boolean
  emptyIcon?: string
  emptyText?: string
}>(), {
  items: () => [],
  excludeIds: () => [],
  disabledIds: () => [],
  compact: false,
  emptyIcon: 'mdi-database-check',
  emptyText: '',
})

defineEmits<{
  select: [item: MetaFieldPoolItem]
}>()

const {te, t} = useI18n()
const formatDataType = (type: string) => getTextDataType(type, {te, t})

const availableItems = computed((): MetaFieldPoolItem[] => {
  const exclude = new Set(props.excludeIds)
  const disabled = new Set(props.disabledIds)
  return props.items
    .filter((item) => !exclude.has(item.id))
    .map((item) => ({
      ...item,
      disabled: disabled.has(item.id),
    }))
})

const groupedItems = computed(() =>
  Object.entries(groupMetaByType(availableItems.value)).map(([type, groupItems]) => ({
    type,
    items: groupItems,
  }))
)
</script>
