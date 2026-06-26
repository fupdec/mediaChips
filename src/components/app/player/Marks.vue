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
      <v-chip-group v-model="marksType" color="primary" column multiple>
        <v-chip value="favorite" size="small" variant="tonal" filter>
          <v-icon icon="mdi-heart" size="small" start/>
          {{ t('meta.default_names.favorite') }}
        </v-chip>
        <v-chip value="bookmark" size="small" variant="tonal" filter>
          <v-icon icon="mdi-bookmark" size="small" start/>
          {{ t('meta.default_names.bookmark') }}
        </v-chip>
        <v-chip
          v-for="i in assigned"
          :key="i.meta.id"
          :value="i.meta.id"
          size="small"
          variant="tonal"
          filter
          :prepend-icon="`mdi-${i.meta.icon}`"
          :text="i.meta.name"
        />
      </v-chip-group>
    </div>

    <div class="player-sidebar__body">
      <template v-if="marks.length > 0">
        <div
          v-for="mark in marks"
          :key="mark.id"
          @click="jumpTo(mark.time)"
          class="mark-item"
        >
          <div class="mark-item__thumb-wrap">
            <v-img
              v-if="is_thumbs_loaded"
              :src="mark.thumb"
              :aspect-ratio="16 / 9"
              class="mark-item__thumb"
              cover
            />
            <v-skeleton-loader v-else type="image" class="mark-item__thumb"/>
          </div>

          <div class="mark-item__info">
            <div class="mark-item__label">
              <v-icon :color="getColor(mark)" size="x-small" class="mr-1">mdi-{{ getIcon(mark) }}</v-icon>
              <span
                v-if="mark.type == 'meta'"
                class="mark-item__name"
                v-html="mark['tag.name'] || mark.tag?.name"
              />
              <span
                v-else-if="mark.text"
                class="mark-item__name"
                v-html="mark.text"
                :title="mark.text"
              />
              <span v-else class="mark-item__name" v-html="mark.name"/>
            </div>
            <span class="mark-item__time">
              {{ getDuration(mark.time) }}<template v-if="mark.end"> – {{ getDuration(mark.end) }}</template>
            </span>
          </div>

          <v-btn
            @click.stop="remove(mark)"
            class="mark-item__delete"
            variant="text"
            color="error"
            size="x-small"
            icon
          >
            <v-icon size="small">mdi-delete-outline</v-icon>
          </v-btn>
        </div>
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
import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useItemsStore} from '@/stores/items'
import {useEventBus} from '@/utils/eventBus'
import {useI18n} from 'vue-i18n'
import path from 'path-browserify'

const emit = defineEmits(['removeMark'])

const appStore = useAppStore()
const playerStore = usePlayerStore()
const itemsStore = useItemsStore()
const eventBus = useEventBus()
const {t} = useI18n()

const marksType = ref(["favorite", "bookmark"])
const is_thumbs_loaded = ref(false)

const player = computed(() => playerStore)
const assigned = computed(() => {
  return itemsStore.assigned.filter((i) => i.meta?.marks)
})

const marks = computed(() => {
  return playerStore.marks.filter((mark) => {
    let type = mark.type
    if (type == "meta") type = mark.meta?.id || mark.metaId
    return marksType.value.some((selected) => selected == type)
  })
})

const getThumbs = async () => {
  is_thumbs_loaded.value = false

  for (let i of playerStore.marks) {
    const imgPath = path.join(
      appStore.mediaPath,
      "videos/marks",
      `${i.id}.jpg`
    )

    i.thumb = await $operable.getLocalImage(imgPath)
  }

  is_thumbs_loaded.value = true
}

const getIcon = (mark) => {
  let icon = "marker"
  if (mark.type == "favorite") icon = "heart"
  else if (mark.type == "bookmark") icon = "bookmark"
  else if (mark.type == "meta") icon = mark.meta?.icon || mark["tag.icon"] || "tag"
  return icon
}

const getColor = (mark) => {
  let color = "primary"
  if (mark.type == "favorite") color = "#e91e63"
  else if (mark.type == "bookmark") color = "#f44336"
  else if (mark.type == "meta") color = mark["tag.color"] || mark.tag?.color || "#2196f3"
  return color
}

const getDuration = (duration) => {
  return $readable.getReadableDuration(duration)
}

const jumpTo = (time) => {
  if (player.value.player) {
    player.value.player.currentTime = time
  }
}

const remove = (mark) => {
  emit("removeMark", mark)
}

const handleUpdateMarkImage = (id) => {
  if (player.value.marks.some((i) => i.id === id)) {
    getThumbs()
  }
}

watch(() => playerStore.marks, (marks) => {
  getThumbs()

  marks.forEach((mark) => {
    if (mark.type !== 'meta') return

    const metaId = mark.meta?.id || mark.metaId
    if (metaId != null && !marksType.value.some((type) => type == metaId)) {
      marksType.value.push(metaId)
    }
  })
})

watch(assigned, (arr) => {
  arr.forEach((i) => {
    const metaId = i.meta?.id
    if (metaId != null && !marksType.value.some((type) => type == metaId)) {
      marksType.value.push(metaId)
    }
  })
}, {immediate: true})

onMounted(() => {
  eventBus.on('updateMarkImage', handleUpdateMarkImage)

  getThumbs()
})

onBeforeUnmount(() => {
  eventBus.off('updateMarkImage', handleUpdateMarkImage)
})

defineExpose({ getThumbs })
</script>
