<template>
  <v-theme-provider theme="dark">
    <aside
      v-if="player.marksVisible"
      class="player-sidebar player-sidebar--marks"
    >
      <div class="player-sidebar__header">
        <v-icon size="small" class="player-sidebar__header-icon">mdi-tooltip</v-icon>
        <div class="player-sidebar__header-text">
          <span class="player-sidebar__title">{{ t('player.marks_list') }}</span>
          <span class="player-sidebar__subtitle">{{ t('player.marks_count', {count: marks.length}) }}</span>
        </div>
        <v-spacer/>
        <v-btn
          @click="player.marksVisible = false"
          variant="text"
          icon
          size="small"
          density="comfortable"
        >
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="player-sidebar__filters">
        <PlayerMarksFilters
          v-model="marksType"
          :assigned="assigned"
        />
      </div>

      <div class="player-sidebar__body">
        <template v-if="marks.length > 0">
          <PlayerMarkListItem
            v-for="mark in marks"
            :key="mark.id"
            :mark="mark"
            :is-thumbs-loaded="is_thumbs_loaded"
            :get-icon="getIcon"
            :get-color="getColor"
            :get-duration="getDuration"
            :jump-to="jumpTo"
            :remove="remove"
          />
        </template>

        <div v-else-if="player.marks.length == 0" class="player-sidebar__empty">
          <img
            src="/images/no-marks.svg"
            alt=""
            class="player-sidebar__empty-img"
          />
          <span>{{ t('player.no_marks') }}</span>
        </div>

        <div v-else class="player-sidebar__empty">
          <img
            src="/images/filters/filters-no-results-marks.svg"
            alt=""
            class="player-sidebar__empty-img"
          />
          <span>{{ t('player.no_marks_selected_types') }}</span>
        </div>
      </div>
    </aside>
  </v-theme-provider>
</template>

<script setup>
import {useI18n} from 'vue-i18n'
import {usePlayerMarks} from '@/composable/usePlayerMarks'
import PlayerMarksFilters from '@/components/app/player/PlayerMarksFilters.vue'
import PlayerMarkListItem from '@/components/app/player/PlayerMarkListItem.vue'

const emit = defineEmits(['removeMark'])
const {t} = useI18n()

const {
  player,
  marksType,
  is_thumbs_loaded,
  assigned,
  marks,
  getThumbs,
  getIcon,
  getColor,
  getDuration,
  jumpTo,
  remove,
} = usePlayerMarks({emit})

defineExpose({getThumbs})
</script>
