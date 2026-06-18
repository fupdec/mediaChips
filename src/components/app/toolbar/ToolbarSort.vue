<template>
  <v-autocomplete
    :model-value="items.sortBy"
    @update:model-value="sort"
    :items="sortParams"
    item-value="param"
    rounded="xl"
    variant="outlined"
    density="compact"
    min-width="200"
    :label="t('filters.sort_by')"
    :placeholder="t('filters.select_parameter')"
    class="mx-4"
    hide-details
    :disabled="!items.isFiltersLoaded"
  >
    <template v-slot:prepend="{ item }">
      <v-btn
        v-tooltip:top="t('filters.change_direction')"
        color="primary"
        variant="tonal"
        size="small"
        icon
        @click="toggleDir"
      >
        <v-icon>
          {{
            items.sortDir === 'asc'
              ? 'mdi-sort-ascending'
              : 'mdi-sort-descending'
          }}
        </v-icon>

      </v-btn>
    </template>
    <template v-slot:selection="{ item }">
      <v-icon :icon="`mdi-${item.raw.icon}`"
        size="small"></v-icon>
      <span class="pl-2">{{ t(item.raw.textKey) }}</span>
    </template>
    <template v-slot:item="{ item, props: menuProps }">
      <v-list-item v-bind="menuProps"
        density="compact">
        <template v-slot:title>
          <div class="text-body-2 py-1">
            <v-icon :icon="`mdi-${item.raw.icon}`"
              size="small"></v-icon>
            <span class="pl-4">{{ t(item.raw.textKey) }}</span>
          </div>
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>

<!--  <v-card v-show="false"-->
<!--    rounded="xl"-->
<!--    variant="tonal"-->
<!--    color="primary"-->
<!--  >-->
<!--    <v-overlay-->
<!--      :model-value="!items.isFiltersLoaded"-->
<!--      :opacity="0.1"-->
<!--      contained-->
<!--      persistent-->
<!--      class="d-flex justify-center align-center"-->
<!--    >-->
<!--      <v-progress-circular indeterminate-->
<!--        size="100"-->
<!--        width="10"-->
<!--        color="primary"/>-->
<!--    </v-overlay>-->

<!--    &lt;!&ndash; HEADER &ndash;&gt;-->
<!--    <v-card-title class="d-flex align-center">-->
<!--      <span class="text-h5">-->
<!--        Sort by-->
<!--      </span>-->

<!--      <v-btn-->
<!--        class="ml-4"-->
<!--        color="primary"-->
<!--        variant="tonal"-->
<!--        rounded-->
<!--        @click="toggleDir"-->
<!--      >-->
<!--        <v-icon start>-->
<!--          {{-->
<!--            items.sortDir === 'asc'-->
<!--              ? 'mdi-sort-ascending'-->
<!--              : 'mdi-sort-descending'-->
<!--          }}-->
<!--        </v-icon>-->
<!--        Change direction-->
<!--      </v-btn>-->

<!--      <v-spacer/>-->

<!--      <v-btn-->
<!--        icon-->
<!--        variant="text"-->
<!--        @click="toolbarStore.sort.show = false"-->
<!--      >-->
<!--        <v-icon>mdi-close</v-icon>-->
<!--      </v-btn>-->
<!--    </v-card-title>-->

<!--    &lt;!&ndash; CONTENT &ndash;&gt;-->
<!--    <v-card-text>-->
<!--      <v-chip-group column-->
<!--        class="pb-0">-->
<!--        <v-chip-->
<!--          v-for="param in sortParams"-->
<!--          :key="param.param"-->
<!--          class="ma-1"-->
<!--          base-color="primary"-->
<!--          :variant="param.param === items.sortBy ? 'flat' : 'outlined'"-->
<!--          @click="sort(param.param)"-->
<!--        >-->
<!--          <v-icon start>-->
<!--            {{ `mdi-${param.icon}` }}-->
<!--          </v-icon>-->

<!--          <span v-html="param.text"></span>-->

<!--          <v-icon v-if="param.param === items.sortBy"-->
<!--            end>-->
<!--            {{-->
<!--              items.sortDir === 'asc'-->
<!--                ? 'mdi-sort-ascending'-->
<!--                : 'mdi-sort-descending'-->
<!--            }}-->
<!--          </v-icon>-->
<!--        </v-chip>-->
<!--      </v-chip-group>-->
<!--    </v-card-text>-->
<!--  </v-card>-->
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useItemsStore} from '@/stores/items'
import {useToolbarStore} from '@/stores/toolbar'
import {useEventBus} from "@/utils/eventBus";

/* ================= STORES ================= */

const itemsStore = useItemsStore()
const toolbarStore = useToolbarStore()
const eventBus = useEventBus()
const {t} = useI18n()

/* ================= DATA ================= */

const params = [
  {param: 'path', icon: 'folder', textKey: 'filters.sort.path', types: ['media']},
  {
    param: 'name',
    icon: 'alphabetical-variant',
    textKey: 'filters.sort.name',
    types: ['media', 'tag']
  },
  {param: 'rating', icon: 'star', textKey: 'filters.sort.rating', types: ['media', 'tag']},
  {
    param: 'createdAt',
    icon: 'calendar-plus',
    textKey: 'filters.sort.date_added',
    types: ['media', 'tag']
  },
  {
    param: 'updatedAt',
    icon: 'calendar-edit',
    textKey: 'filters.sort.date_updated',
    types: ['media', 'tag']
  },
  {
    param: 'viewedAt',
    icon: 'calendar-cursor',
    textKey: 'filters.sort.viewed_date',
    types: ['media', 'tag']
  },
  {
    param: 'views',
    icon: 'eye',
    textKey: 'filters.sort.views',
    types: ['media', 'tag']
  },
  {param: 'filesize', icon: 'harddisk', textKey: 'filters.sort.filesize', types: ['media']},

  {
    param: 'duration',
    icon: 'clock-outline',
    textKey: 'filters.sort.duration',
    types: ['media'],
    media_type_id: [1]
  },
  {
    param: 'bitrate',
    icon: 'filmstrip',
    textKey: 'filters.sort.bitrate',
    types: ['media'],
    media_type_id: [1]
  },
  {
    param: 'fps',
    icon: 'filmstrip',
    textKey: 'filters.sort.framerate',
    types: ['media'],
    media_type_id: [1]
  },
  {
    param: 'codec',
    icon: 'filmstrip',
    textKey: 'filters.sort.codec',
    types: ['media'],
    media_type_id: [1]
  },
  {
    param: 'width',
    icon: 'monitor-screenshot',
    textKey: 'filters.sort.width',
    types: ['media'],
    media_type_id: [1]
  },
  {
    param: 'height',
    icon: 'monitor-screenshot',
    textKey: 'filters.sort.height',
    types: ['media'],
    media_type_id: [1]
  },

  {
    param: 'shuffle',
    icon: 'shuffle-variant',
    textKey: 'filters.sort.shuffle',
    types: ['media', 'tag']
  },
]

/* ================= COMPUTED ================= */

const items = computed(() => itemsStore)
const env = computed(() => itemsStore.environment)

const sortParams = computed(() =>
  params.filter(p =>
    p.types.includes(items.value.type) &&
    (!p.media_type_id || p.media_type_id.includes(env.value.media_type_id))
  )
)

/* ================= METHODS ================= */

function toggleDir() {
  const dir = items.value.sortDir === 'asc' ? 'desc' : 'asc'
  itemsStore.setSortDir(dir)
  eventBus.emit("setItemsSortDir", dir);
}

function sort(param) {
  if (items.value.sortBy === param) {
    toggleDir()
  } else {
    itemsStore.setSortBy(param)
  }
  eventBus.emit("setItemsSortBy", param);
}
</script>
