<template>
  <div class="settings-meta-assignment">
    <div class="settings-meta-assignment__intro mb-4">
      <div class="d-flex align-center flex-wrap ga-2 mb-1">
        <h2 class="text-h6">{{ t('settings_labels.field_pinning.title') }}</h2>
        <button-documentation id="meta.assign"/>
      </div>
      <p class="text-body-2 text-medium-emphasis mb-3">
        {{ t('settings_labels.field_pinning.subtitle') }}
      </p>
      <v-alert
        color="info"
        icon="mdi-content-save-alert"
        class="text-caption"
        variant="tonal"
        rounded="xl"
        density="compact"
      >
        {{ t('settings_labels.media_type_added_meta.irreversible_changes') }}
      </v-alert>
    </div>

    <v-btn-toggle
      v-model="viewMode"
      mandatory
      rounded="xl"
      color="primary"
      density="comfortable"
      class="settings-meta-assignment__toggle mb-4"
    >
      <v-btn value="media" size="small" variant="outlined">
        <v-icon start size="18">mdi-file-outline</v-icon>
        {{ t('settings_labels.field_pinning.view_by_media') }}
      </v-btn>
      <v-btn value="tags" size="small" variant="outlined">
        <v-icon start size="18">mdi-tag-multiple-outline</v-icon>
        {{ t('settings_labels.field_pinning.view_by_tags') }}
      </v-btn>
    </v-btn-toggle>

    <div v-if="!hasItems" class="layout-img">
      <v-img src="/images/no-data.svg" max-height="30vh" class="my-4" contain/>
      <div class="text-medium-emphasis">
        {{ viewMode === 'media'
          ? t('meta.settings.no_media_types_available')
          : t('settings_labels.field_pinning.no_tag_categories') }}
      </div>
    </div>

    <div v-else class="settings-meta-assignment__layout">
      <aside class="settings-meta-assignment__sidebar">
        <v-list
          v-model:selected="selectedIds"
          select-strategy="single-independent"
          class="settings-meta-assignment__list"
          color="primary"
          nav
        >
          <v-list-item
            v-for="item in listItems"
            :key="item.id"
            :value="item.id"
            rounded="lg"
            class="settings-meta-assignment__list-item"
          >
            <template #prepend>
              <v-icon size="20">mdi-{{ item.icon }}</v-icon>
            </template>

            <v-list-item-title class="text-body-2">{{ item.title }}</v-list-item-title>

            <template #append>
              <v-chip
                size="x-small"
                variant="tonal"
                :color="item.pinnedCount ? 'primary' : undefined"
                :title="item.pinnedCountHint"
              >
                {{ item.pinnedCount }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </aside>

      <main class="settings-meta-assignment__panel">
        <div v-if="!selectedItem" class="settings-meta-assignment__placeholder">
          <v-icon size="56" color="grey-lighten-1" class="mb-3">mdi-pin-outline</v-icon>
          <div class="text-body-1 text-medium-emphasis">
            {{ viewMode === 'media'
              ? t('settings_labels.field_pinning.select_media_type')
              : t('settings_labels.field_pinning.select_tag_category') }}
          </div>
        </div>

        <MetaAssignmentPanel
          v-else-if="viewMode === 'media'"
          :key="`media_${selectedItem.id}`"
          mode="from-media-type"
          :media-type="selectedItem.raw"
          :show-warning="false"
          :show-anchor="false"
          @meta-updated="onAssignmentUpdated"
        />

        <MetaAssignmentPanel
          v-else
          :key="`meta_${selectedItem.id}`"
          mode="from-meta"
          :meta="selectedItem.raw"
          :show-warning="false"
          :show-anchor="false"
          @pinned-meta-updated="onAssignmentUpdated"
          @pinned-media-updated="onAssignmentUpdated"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import axios from 'axios'
import orderBy from 'lodash-es/orderBy'
import {useAppStore} from '@/stores/app'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
import MetaAssignmentPanel from '@/components/meta/assignment/MetaAssignmentPanel.vue'
import ButtonDocumentation from '@/components/ui/ButtonDocumentation.vue'

const {t} = useI18n()
const route = useRoute()
const apiUrl = computed(() => useAppStore().localhost)

const viewMode = ref('media')
const selectedIds = ref([])
const pinnedFieldsByMediaType = ref({})
const pinnedMediaByMeta = ref({})
const childPinnedByMeta = ref({})

const mediaTypes = computed(() => useAppStore().mediaTypes || [])

const tagCategories = computed(() =>
  orderBy(
    (useAppStore().meta || []).filter((m) => m.type === 'array'),
    ['hidden', 'order'],
    ['asc', 'asc']
  )
)

const listItems = computed(() => {
  if (viewMode.value === 'media') {
    return mediaTypes.value.map((mt) => {
      const pinnedCount = pinnedFieldsByMediaType.value[Number(mt.id)] || 0
      return {
        id: mt.id,
        icon: mt.icon,
        title: getMediaTypeName(mt, t),
        pinnedCount,
        pinnedCountHint: t('settings_labels.field_pinning.pinned_fields_count', {count: pinnedCount}),
        raw: mt,
      }
    })
  }

  return tagCategories.value.map((meta) => {
    const mediaCount = pinnedMediaByMeta.value[Number(meta.id)] || 0
    const childCount = childPinnedByMeta.value[Number(meta.id)] || 0
    const pinnedCount = mediaCount + childCount
    return {
      id: meta.id,
      icon: meta.icon,
      title: meta.name,
      pinnedCount,
      pinnedCountHint: t('settings_labels.field_pinning.pinned_assignments_hint', {
        media: mediaCount,
        children: childCount,
      }),
      raw: meta,
    }
  })
})

const hasItems = computed(() => listItems.value.length > 0)

const selectedItem = computed(() => {
  const id = selectedIds.value[0]
  if (!id) return null
  return listItems.value.find((item) => item.id === id) || null
})

const loadAssignmentCounts = async () => {
  try {
    const [mediaTypeRows, pinnedMetaRows] = await Promise.all([
      axios.get(`${apiUrl.value}/api/MetaInMediaType`),
      axios.get(`${apiUrl.value}/api/PinnedMeta`),
    ])

    const fieldsByMedia = {}
    const mediaByMeta = {}

    for (const row of mediaTypeRows.data || []) {
      const mediaTypeId = Number(row.mediaTypeId)
      const metaId = Number(row.metaId)
      fieldsByMedia[mediaTypeId] = (fieldsByMedia[mediaTypeId] || 0) + 1
      mediaByMeta[metaId] = (mediaByMeta[metaId] || 0) + 1
    }

    const childByMeta = {}
    for (const row of pinnedMetaRows.data || []) {
      const metaId = Number(row.metaId)
      childByMeta[metaId] = (childByMeta[metaId] || 0) + 1
    }

    pinnedFieldsByMediaType.value = fieldsByMedia
    pinnedMediaByMeta.value = mediaByMeta
    childPinnedByMeta.value = childByMeta
  } catch (e) {
    console.error('Error loading assignment counts:', e)
  }
}

const selectFromRoute = () => {
  const routeView = route.query.view
  if (routeView === 'media' || routeView === 'tags') {
    viewMode.value = routeView
  }

  const mediaTypeId = Number(route.query.mediaTypeId)
  const metaId = Number(route.query.metaId)

  if (viewMode.value === 'media' && mediaTypeId) {
    selectedIds.value = [mediaTypeId]
    return
  }

  if (viewMode.value === 'tags' && metaId) {
    selectedIds.value = [metaId]
  }
}

const ensureSelection = () => {
  if (selectedIds.value.length && listItems.value.some((i) => i.id === selectedIds.value[0])) {
    return
  }
  if (listItems.value.length) {
    selectedIds.value = [listItems.value[0].id]
  } else {
    selectedIds.value = []
  }
}

const onAssignmentUpdated = () => {
  loadAssignmentCounts()
}

watch(viewMode, () => {
  ensureSelection()
})

watch(listItems, () => {
  ensureSelection()
})

watch(() => route.fullPath, () => {
  selectFromRoute()
  ensureSelection()
})

onMounted(async () => {
  await loadAssignmentCounts()
  selectFromRoute()
  ensureSelection()
})
</script>
