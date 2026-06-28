<template>
  <v-card class="rounded-lg widget-extended-stats mb-8" color="primary" variant="tonal">
    <v-card-text class="pa-3 pb-2">
      <div class="d-flex align-center justify-space-between mb-1">
        <div class="d-flex align-center text-body-1 font-weight-medium">
          <v-icon class="mr-2" size="20">mdi-chart-box-outline</v-icon>
          {{ t('home.widgets.extended_stats_title') }}
        </div>

        <v-btn
          @click="toggleCollapsed"
          :title="collapsed
            ? t('home.widgets.extended_stats_expand')
            : t('home.widgets.extended_stats_collapse')"
          icon
          size="small"
          variant="text"
        >
          <v-icon>{{ collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
        </v-btn>
      </div>
    </v-card-text>

    <v-expand-transition>
      <v-card-text v-show="!collapsed" class="pa-3 pt-0">
        <v-row dense class="mb-2">
          <v-col
            v-for="item in summaryCards"
            :key="item.id"
            cols="6"
            sm="4"
            md="3"
          >
            <div class="widget-extended-stats__chip">
              <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
              <div class="text-body-2 font-weight-medium">{{ item.value }}</div>
            </div>
          </v-col>
        </v-row>

        <div v-if="stats.byType.length" class="mb-3">
          <div class="text-caption text-medium-emphasis mb-2">
            {{ t('home.widgets.extended_stats_by_type') }}
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="typeRow in stats.byType"
              :key="typeRow.mediaTypeId"
              size="small"
              variant="tonal"
            >
              <v-icon start size="14">mdi-{{ typeRow.icon || 'file' }}</v-icon>
              {{ formatTypeName(typeRow) }}: {{ typeRow.count }}
            </v-chip>
          </div>
        </div>

        <div v-if="stats.largestFiles.length">
          <div class="text-caption text-medium-emphasis mb-2">
            {{ t('home.widgets.extended_stats_largest') }}
          </div>
          <div
            v-for="file in stats.largestFiles"
            :key="file.id"
            class="widget-extended-stats__file text-caption d-flex justify-space-between ga-2"
          >
            <span class="text-truncate">{{ file.name || file.basename }}</span>
            <span class="text-medium-emphasis text-no-wrap">
              {{ formatFilesize(file.filesize ?? 0) }}
            </span>
          </div>
        </div>
      </v-card-text>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {apiClient} from '@/services/apiClient'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
import {
  parseHomeWidgetsConfig,
  setHomeWidgetCollapsed,
} from '@/utils/homeWidgets'
import {getReadableFileSize} from '@/services/formatUtils'
import {setOption} from '@/services/settingsService'
import type { ExtendedStats, ExtendedStatsByType } from '@/types/widgets'

const {t} = useI18n()
const appStore = useAppStore()
const settingsStore = useSettingsStore()

const emptyStats = (): ExtendedStats => ({
  total: 0,
  byType: [],
  averageRating: 0,
  withTags: 0,
  rated: 0,
  favorites: 0,
  addedLast7Days: 0,
  addedLast30Days: 0,
  largestFiles: [],
})

const stats = ref<ExtendedStats>(emptyStats())

const collapsed = ref(false)

const summaryCards = computed(() => {
  const total = stats.value.total || 0
  const percent = (count: number) => total ? `${Math.round((count / total) * 100)}%` : '0%'

  return [
    {
      id: 'rating',
      label: t('home.widgets.extended_stats_avg_rating'),
      value: stats.value.averageRating > 0
        ? stats.value.averageRating.toFixed(1)
        : '—',
    },
    {
      id: 'tags',
      label: t('home.widgets.extended_stats_with_tags'),
      value: percent(stats.value.withTags),
    },
    {
      id: 'rated',
      label: t('home.widgets.extended_stats_rated'),
      value: percent(stats.value.rated),
    },
    {
      id: 'favorites',
      label: t('home.widgets.extended_stats_favorites'),
      value: percent(stats.value.favorites),
    },
    {
      id: 'week',
      label: t('home.widgets.extended_stats_added_week'),
      value: String(stats.value.addedLast7Days),
    },
    {
      id: 'month',
      label: t('home.widgets.extended_stats_added_month'),
      value: String(stats.value.addedLast30Days),
    },
  ]
})

function syncCollapsedState() {
  const config = parseHomeWidgetsConfig(settingsStore.home_widgets_config)
  collapsed.value = config.collapsed.extendedStats === true
}

function formatTypeName(typeRow: ExtendedStatsByType) {
  const mediaType = appStore.mediaTypes.find((item) => item.id === Number(typeRow.mediaTypeId))
  return getMediaTypeName(mediaType, t) || typeRow.name || ''
}

function formatFilesize(bytes: number) {
  return getReadableFileSize(bytes)
}

async function toggleCollapsed() {
  const nextCollapsed = !collapsed.value
  collapsed.value = nextCollapsed

  const serialized = setHomeWidgetCollapsed(
    settingsStore.home_widgets_config,
    'extendedStats',
    nextCollapsed,
  )
  settingsStore.home_widgets_config = serialized
  await setOption(serialized, 'home_widgets_config')
}

async function loadStats() {
  try {
    const response = await apiClient.get<Partial<ExtendedStats>>('/api/home/extended-stats')
    stats.value = {
      ...emptyStats(),
      ...(response.data || {}),
    }
  } catch (error) {
    console.error(error)
  }
}

watch(
  () => settingsStore.home_widgets_config,
  () => syncCollapsedState(),
)

onMounted(() => {
  syncCollapsedState()
  loadStats()
})
</script>

<style lang="scss" scoped>
.widget-extended-stats {
  &__chip {
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(var(--v-theme-on-surface), 0.04);
    min-height: 52px;
  }

  &__file {
    padding: 4px 0;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
