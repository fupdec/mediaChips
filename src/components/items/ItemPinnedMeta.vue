<template>
  <div class="nested-tags">

    <!-- TAG PAGE -->
    <div v-if="tagPage" class="tag-page-params">

      <!-- Rating -->
      <div class="tag-page-param">
        <div class="tag-page-param__value">
          <v-rating
            :model-value="item.rating"
            density="compact"
            half-increments
            readonly
          />
        </div>
        <div class="tag-page-param__title">
          Rating
        </div>
      </div>

      <!-- Favorite -->
      <div class="tag-page-param">
        <div class="tag-page-param__value">
          <v-icon size="24">
            mdi-heart{{ item.favorite ? '' : '-outline' }}
          </v-icon>
        </div>
        <div class="tag-page-param__title">
          Favorite
        </div>
      </div>

      <!-- PRESET META -->
      <div
        v-for="meta in preset_meta"
        :key="meta.name"
        class="tag-page-param"
      >
        <div class="tag-page-param__value">
          <v-chip>
            {{ meta.value || item[meta.name] || 0 }}
          </v-chip>
        </div>
        <div class="tag-page-param__title">
          <span>{{ meta.text }}</span>
          <v-icon size="18">mdi-{{ meta.icon }}</v-icon>
        </div>
      </div>

      <!-- TAGS -->
      <div
        v-for="category in tagsComputed"
        :key="`${category[0].metaId}_${item.id}`"
        class="tag-page-param"
      >
        <div class="tag-page-param__value">
          <v-chip-group column>
            <v-chip
              v-for="tag in category"
              :key="`${tag.id}_${item.id}`"
              @click.stop.prevent="showMenu($event, tag)"
              @mouseenter="$readable.showHoverImage($event, tag.metaId, tag.id)"
              @mouseleave="$readable.hideHoverImage"
            >
              {{ tag.name }}
            </v-chip>
          </v-chip-group>
        </div>

        <div class="tag-page-param__title">
          <span>{{ category[0].meta.name }}</span>
          <v-icon size="18">mdi-{{ category[0].meta.icon }}</v-icon>
        </div>
      </div>

      <!-- VALUES -->
      <div
        v-for="category in valuesComputed"
        :key="`${category[0].id}_${item.id}`"
        class="tag-page-param"
      >
        <div class="tag-page-param__value">
          <v-chip
            v-for="i in category"
            :key="`${i.name}_${item.id}`"
          >{{ i.value }}
          </v-chip>
        </div>

        <div class="tag-page-param__title">
          <span>{{ category[0].name }}</span>
          <v-icon size="18">mdi-{{ category[0].icon }}</v-icon>
        </div>
      </div>
    </div>

    <!-- GROUPED -->
    <div v-else-if="isGrouped">
      <!-- PRESET META GROUPED -->
      <div
        v-for="meta in preset_meta"
        :key="meta.name"
        class="category"
      >
        <div class="category-name d-flex align-center ga-2">
          <v-icon start>mdi-{{ meta.icon }}</v-icon>
          {{ meta.text }}
        </div>

        <v-chip
          :label="settingsStore.show_default_meta_label == '1'"
          :variant="settingsStore.default_meta_chip_variant"
          :text="meta.value || item[meta.name]"
        ></v-chip>
      </div>

      <!-- TAGS GROUPED -->
      <div
        v-for="category in tagsComputed"
        :key="`${category[0].metaId}_${item.id}`"
        class="category"
      >
        <div class="category-name d-flex align-center ga-2">
          <v-icon start>mdi-{{ category[0].meta.icon }}</v-icon>
          {{ category[0].meta.name }}
        </div>

        <v-chip
          v-for="tag in category"
          :key="`${tag.id}_${item.id}`"
          :color="tag.meta?.color ? tag.color : undefined"
          :variant="tag.meta?.chipVariant"
          :label="tag.meta?.chipLabel"
          :text="tag.name"
          @click.stop.prevent="showMenu($event, tag)"
          @mouseenter="$readable.showHoverImage($event, tag.metaId, tag.id)"
          @mouseleave="$readable.hideHoverImage"
        ></v-chip>
      </div>

      <!-- VALUES GROUPED -->
      <div
        v-for="category in valuesComputed"
        :key="`${category[0].id}_${item.id}`"
        class="category"
      >
        <div class="category-name d-flex align-center ga-2">
          <v-icon start>mdi-{{ category[0].icon }}</v-icon>
          {{ category[0].name }}
        </div>

        <v-chip
          v-for="i in category"
          :key="`${i.name}_${item.id}`"
          :text="i.value"
        ></v-chip>
      </div>
    </div>

    <!-- FLAT -->
    <div v-else>
      <!-- PRESET META FLAT -->
      <v-chip
        v-for="meta in preset_meta"
        :key="meta.name"
        :title="meta.text"
        :label="settingsStore.show_default_meta_label == '1'"
        :variant="settingsStore.default_meta_chip_variant"
        :prepend-icon="`mdi-${meta.icon}`"
        :text="meta.value || item[meta.name]"
      ></v-chip>

      <!-- TAGS FLAT -->
      <v-chip
        v-for="tag in tagsComputed"
        :key="`${tag.id}_${item.id}`"
        :color="tag.meta?.color ? tag.color : undefined"
        :variant="tag.meta?.chipVariant"
        :label="tag.meta?.chipLabel"
        :prepend-icon="`mdi-${tag?.meta?.icon}`"
        :text="tag.name"
        @click.stop.prevent="showMenu($event, tag)"
      ></v-chip>

      <!-- VALUES FLAT -->
      <v-chip
        v-for="value in valuesComputed"
        :key="`${value.id}_${item.id}`"
        :prepend-icon="`mdi-${value.icon}`"
        :text="value.name"
      ></v-chip>
    </div>
  </div>
</template>

<script setup>
import {computed, onBeforeMount} from 'vue'
import _ from 'lodash'
import axios from 'axios'

import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useContextMenu} from '@/stores/contextMenu'
import {useDialogsStore} from '@/stores/dialogs'
import {useItemsStore} from '@/stores/items'

import {useEventBus} from "@/utils/eventBus"
import {useRouter} from "vue-router";
import {usePresetMeta} from "@/composable/ItemPresetMeta"

const router = useRouter()

/* props */
const props = defineProps({
  item: {type: Object, required: true},
  tags: {type: Array, default: () => []},
  values: {type: Array, default: () => []},
  type: {type: String, required: true},
  tagPage: {type: Boolean, default: false},
  isShowAll: {type: Boolean, default: false},
})

// composable for default meta
const presetMetaProps = {
  type: props.type,
  item: props.item,
  tagPage: props.tagPage,
  isShowAll: props.isShowAll,
}

const {preset_meta} = usePresetMeta(presetMetaProps)

/* stores */
const settingsStore = useSettingsStore()
const appStore = useAppStore()
const metaStore = useAppStore().meta
const tagsStore = useAppStore().tags
const contextMenuStore = useContextMenu()
const dialogsStore = useDialogsStore()
const itemsStore = useItemsStore()

const eventBus = useEventBus()

/* computed */
const isGrouped = computed(() =>
  settingsStore.group_chips_in_card_description === '1' || props.tagPage
)

/* TAGS */
const tagsComputed = computed(() => {
  if (!metaStore.length || !tagsStore.length || !props.tags?.length) return []

  let result = props.tags
    .map(i => {
      if (!i) return null
      const meta = metaStore.find(m => m.id === i.metaId)
      const tag = tagsStore.find(t => t.id === i.tagId)
      return tag && meta ? {...tag, meta} : null
    })
    .filter(Boolean)
    .filter(tag => tag && tag.meta && tag.id) // Additional filtering

  if (result.length === 0) return []

  result = _.orderBy(result, ['name'])
  result = result.filter(i => i && i.meta && checkShow(i.metaId))

  if (result.length === 0) return []

  return isGrouped.value ? _.groupBy(result, 'metaId') : result
})

/* VALUES */
const valuesComputed = computed(() => {
  if (!metaStore.length || !props.values?.length) return []

  let result = props.values
    .map(i => {
      if (!i) return null
      const meta = metaStore.find(m => m.id === i.metaId)
      return meta ? {...meta, value: i.value} : null
    })
    .filter(Boolean)
    .filter(meta => meta && meta.id) // Additional filtering

  if (result.length === 0) return []

  result = _.orderBy(result, ['name'])
  result = result.filter(i => i && i.id && checkShow(i.id))

  if (result.length === 0) return []

  return isGrouped.value ? _.groupBy(result, 'id') : result
})

// проверяем стоит ли отображать эти метаданные
const checkShow = (metaId) => {
  if (props.tagPage) {
    return true
  }
  let assigned = itemsStore.assigned
  let tagName = "metaId"
  if (itemsStore.type === 'tag') tagName = "pinnedMetaId"
  let x = assigned.findIndex((i) => i[tagName] == metaId)
  if (x > -1) {
    return assigned[x].show == 1 ? true : false
  } else {
    return false
  }
}

const getPath = (tag) => {
  return "/tag?metaId=" + tag.metaId + "&tagId=" + tag.id + "&mediaTypeId=1"
}

const openNewTab = (tag) => {
  axios({
    method: "post",
    url: appStore.localhost + "/api/tab",
    data: {
      name: tag.name,
      icon: tag.meta.icon,
      url: '/tag',
      tagId: tag.id,
      mediaTypeId: itemsStore.environment?.media_type_id || 1,
      metaId: tag.metaId,
    },
  })
    .then((res) => {
      eventBus.emit('getTabs')
    })
    .catch((e) => {
      console.error(e)
    })
}

const removeTag = (tag) => {
  let url = `/api/TagsIn${props.type}/deleteFrom${props.type}`
  let data = {
    tagId: tag.id
  }

  if (props.type === 'media') {
    data.mediaId = props.item.id
  } else if (props.type === 'tag') {
    data.parentTagId = props.item.id
  } else return

  axios({
    method: "post",
    url: appStore.localhost + url,
    data,
  })
    .then((res) => {
      // Эмит события для обновления элементов
      eventBus.emit('getItemsFromDb', {
        ids: [props.item.id],
        type: props.type,
      });
    })
    .catch((e) => {
      console.error(e)
    })
}

const filterByTag = (tag) => {
  const filter_new = $readable.getFilterObject({
    param: tag.metaId,
    type: "array",
    cond: "in all",
    lock: false,
    val: [tag.id],
  })

  itemsStore.filters.push(filter_new)

  setTimeout(() => {
    $readable.emit('applyFilters');
  }, 0)
}

const showMenu = (e, tag) => {
  $readable.hideHoverImage()

  const contextMenu = [
    {
      name: "Edit tag",
      type: "item",
      icon: "pencil",
      action: () => {
        let meta = appStore.getMetaById(tag.metaId)
        dialogsStore.editTag(tag, meta)
        // TODO написать функцию для добавления нового фильтра
      },
    }, {
      type: "divider"
    },
    {
      name: "Filter by tag",
      type: "item",
      icon: "filter",
      action: () => {
        filterByTag(tag)
      },
    }, {
      type: "divider"
    },
    {
      name: "Open page",
      type: "item",
      icon: "open-in-app",
      disabled: getPath(tag) == router.currentRoute.value.fullPath,
      action: () => {
        const url = getPath(tag)
        router.push(url)
      },
    }, {
      name: "Open in new tab",
      type: "item",
      icon: "tab",
      action: () => {
        openNewTab(tag)
      },
    }, {
      type: "divider"
    }, {
      name: "Remove",
      type: "item",
      icon: "close",
      color: "error",
      action: () => {
        removeTag(tag)
      },
    }
  ]

  contextMenuStore.showContextMenu({
    x: e.clientX,
    y: e.clientY,
    content: contextMenu,
    tagMeta: tag,
  })
}
</script>
