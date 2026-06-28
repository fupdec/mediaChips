<template>
  <WidgetTotalStats v-if="widgetId === 'stats'" class="mt-2 mb-4"/>
  <WidgetExtendedStats v-else-if="widgetId === 'extendedStats'"/>
  <WidgetQuickActions v-else-if="widgetId === 'quickActions'"/>
  <WidgetMediaRow
    v-else-if="widgetId === 'continue'"
    :title="t('home.widgets.continue_watching')"
    icon="mdi-history"
    :items="continueWatching"
    variant="continue"
    @open="onOpenContinue"
    @view-all="onOpenContinueList"
  />
  <WidgetMediaRow
    v-else-if="widgetId === 'favorites'"
    :title="t('home.widgets.favorites')"
    icon="mdi-heart"
    :items="favorites"
    variant="favorite"
    @open="onOpenMedia"
    @view-all="onOpenFavoritesList"
  />
  <WidgetMediaRow
    v-else-if="widgetId === 'topViews'"
    :title="t('home.widgets.top_views')"
    icon="mdi-eye"
    :items="topViews"
    variant="views"
    @open="onOpenMedia"
    @view-all="onOpenTopViewsList"
  />
  <WidgetRandomMarkers
    v-else-if="widgetId === 'markers'"
    :limit="limits?.markers ?? 8"
  />
  <WidgetHealthAlerts v-else-if="widgetId === 'health'"/>
  <WidgetTopTags
    v-else-if="widgetId === 'topTags'"
    :limit="limits?.topTags ?? 10"
  />
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n'
import WidgetTopTags from '@/components/widgets/WidgetTopTags.vue'
import WidgetTotalStats from '@/components/widgets/WidgetTotalStats.vue'
import WidgetExtendedStats from '@/components/widgets/WidgetExtendedStats.vue'
import WidgetQuickActions from '@/components/widgets/WidgetQuickActions.vue'
import WidgetMediaRow from '@/components/widgets/WidgetMediaRow.vue'
import WidgetRandomMarkers from '@/components/widgets/WidgetRandomMarkers.vue'
import WidgetHealthAlerts from '@/components/widgets/WidgetHealthAlerts.vue'
import type { HomeMediaItem, HomeWidgetLimits } from '@/types/widgets'
import type { MediaItem } from '@/types/stores'

defineProps<{
  widgetId: string
  continueWatching?: HomeMediaItem[]
  favorites?: HomeMediaItem[]
  topViews?: HomeMediaItem[]
  limits?: HomeWidgetLimits
  onOpenMedia: (item: MediaItem) => void | Promise<void>
  onOpenContinue: (item: MediaItem) => void | Promise<void>
  onOpenContinueList: () => void
  onOpenFavoritesList: () => void
  onOpenTopViewsList: () => void
}>()

const {t} = useI18n()
</script>
