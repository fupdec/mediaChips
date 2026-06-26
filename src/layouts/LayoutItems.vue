<template>
  <v-container @dragover="showDrop"
    ref="container">

    <div class="text-md-h2 d-flex align-end justify-space-between flex-wrap my-6">
      <div class="d-flex align-baseline">
        <v-icon size="42" start>mdi-{{ ITEMS.icon }}</v-icon>
        {{ pageTitle }}
        <span v-if="!loader.is_busy && total > 0">
        <span v-if="total != totalInDb"
          class="text-h5 ml-2">
          ({{ total }} of {{ totalInDb }})
        </span>
        <span v-else
          class="text-h5 ml-2">({{ total }})</span>
        <span v-if="filesize_all"
          class="text-h6 ml-2">({{ filesize_all }})</span>
        </span>
      </div>

      <div class="d-flex align-end">
        <ToolbarSort></ToolbarSort>

        <v-btn @click="toggleCustomization"
          v-tooltip:top="t('appbar.buttons.customize')"
          color="primary"
          variant="flat"
          icon>
          <v-icon>mdi-tune</v-icon>
        </v-btn>
      </div>
    </div>

    <v-expand-transition>
      <ToolbarAppearance v-if="toolbarStore.appearance.show"></ToolbarAppearance>
    </v-expand-transition>

    <SavedFilters v-if="settingsStore.showSavedFilters == '1'"/>

    <!-- боковая панель -->
    <Filters :isReady="isFiltersReady"/>

    <FiltersChips
      v-if="activeFilters.length > 0 || (ENV.media_type_id ? ITEMS.find_duplicates : false)"
      :filters="ITEMS.filters"
      class="my-4"
    />

    <Loading v-if="loader.is_busy"/>

    <ItemsPaginationBar
      v-if="showPagination"
      v-model:page="paginationPage"
      v-model:jump-page="paginationJumpPage"
      :pages="pages"
      :total-visible="xs ? 5 : SETTINGS.numberOfPagesLimit"
      @change="changePage"
      @jump="jumpToPage"
    />

    <div
      v-if="ITEMS.itemsOnPage.length"
      :class="itemsGridClasses"
    >
      <Item
        v-for="(i, x) in ITEMS.itemsOnPage"
        :key="i.key || i.id"
        :type="items_type"
        :item="i"
        :meta="meta"
        :media-type="mediaType"
        :reg="reg"
        :x="x"
      />
    </div>
    <!-- TODO запоминать номер страницы и сохранять в БД -->

    <div
      v-if="ITEMS.itemsOnPage.length && is_infinite_scroll && ITEMS.itemsOnPage.length >= ITEMS.totalFiltered && ITEMS.totalFiltered > 0"
      class="scroll-top-after-items"
    >
      <v-btn
        @click="scrollTop"
        color="primary"
        rounded
        variant="outlined"
      >
        <v-icon left>mdi-format-vertical-align-top</v-icon>
        {{ t('items.scroll_to_top') }}
      </v-btn>
    </div>

    <ItemsPaginationBar
      v-if="showPagination"
      v-model:page="paginationPage"
      v-model:jump-page="paginationJumpPage"
      :pages="pages"
      :total-visible="xs ? 5 : SETTINGS.numberOfPagesLimit"
      @change="changePage"
      @jump="jumpToPage"
    />

    <div v-if="0 == total && total == totalInDb"
      class="layout-img">
      <v-img src="/images/no-data.svg"
        max-height="40vh"
        class="my-4"
        contain></v-img>
      <div class="text-medium-emphasish">{{ t('empty_states.no_items_add_first') }}</div>
      <div class="mt-4 d-flex justify-center">
        <DialogMediaAdding
          v-if="items_type === 'media'"
          button-color="success"
          button-size="large"
          button-variant="flat"
        />
        <TagsAdd
          v-else-if="items_type === 'tag'"
          :meta_id="metaId"
          button-color="success"
          button-size="large"
          button-variant="flat"
        />
      </div>
    </div>

    <div v-if="0 == total && total !== totalInDb"
      class="layout-img">
      <v-img :src="image_filters_no_results"
        max-height="40vh"
        class="my-4"
        contain></v-img>
      <div class="text-medium-emphasis">There is no items matching the filters
      </div>
    </div>

    <div
      v-if="ITEMS.itemsOnPage.length && is_infinite_scroll && ITEMS.itemsOnPage.length < ITEMS.totalFiltered"
      :class="{ 'infinite-loader': is_not_full_height && items_type !== 'media' }"
      class="infinite-loader-full-height"
    >
      <Loading v-if="isLoadingMore" />

      <div
        v-intersect="infiniteIntersectOptions"
        class="infinite-scroll-sentinel"
        aria-hidden="true"
      />
    </div>

    <Teleport to="#main-drop-target">
      <v-card
        v-show="dropzone"
        @dragleave="onDropzoneDragLeave"
        @drop.prevent="catchDrop($event)"
        @dragenter.prevent="onDropzoneDragEnter"
        @dragover.prevent="onDropzoneDragOver"
        class="dropzone"
      >
        <div class="text">{{ t('items.drop_video_or_folder') }}</div>
      </v-card>
    </Teleport>

    <QuickActionButton v-if="SETTINGS.show_quick_action_button == '1'"/>
  </v-container>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'
import _ from 'lodash'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useTasksStore} from '@/stores/tasks'
import {useRegistrationStore} from '@/stores/registration'
import {useToolbarStore} from '@/stores/toolbar'
import {useRouter} from 'vue-router'
import {useEventBus} from '@/utils/eventBus'
import {apiClient} from '@/services/apiClient'
import useVideoImageGenerator from '@/composable/GeneratingThumbsForVideos'
import {useItemsPage} from '@/composable/useItemsPage'

// Компоненты
import Item from '@/components/items/Item.vue'
import Filters from '@/components/app/Filters.vue'
import SavedFilters from '@/components/elements/FiltersSaved.vue'
import FiltersChips from '@/components/elements/FiltersChips.vue'
import Loading from '@/components/elements/Loading.vue'
import ItemsPaginationBar from '@/components/elements/ItemsPaginationBar.vue'
import QuickActionButton from '@/components/app/QuickActionButton.vue'
import ToolbarSort from '@/components/app/toolbar/ToolbarSort.vue'
import ToolbarAppearance from "@/components/app/toolbar/ToolbarAppearance.vue";
import DialogMediaAdding from '@/components/dialogs/DialogMediaAdding.vue'
import TagsAdd from '@/components/app/appbar/elements/TagsAdd.vue'
import {getMediaTypeName} from '@/utils/mediaTypeI18n'
import {isVideoMediaType, getDefaultMediaTypeId, isImageMediaType, isAudioMediaType, isTextMediaType} from '@/utils/mediaType'
import {collectDroppedPaths, startDroppedMediaAdding} from '@/utils/mediaDrop'
import {
  normalizeSortBy,
} from '@/utils/mediaSortFilter'

// Пропсы
const props = defineProps({
  items_type: String,
  tagId: Number,
  mediaTypeId: Number,
  metaId: Number,
  tabId: Number,
})

// Сторы Pinia
const appStore = useAppStore()
const itemsStore = useItemsStore()
const settingsStore = useSettingsStore()
const tasksStore = useTasksStore()
const toolbarStore = useToolbarStore()
const registrationStore = useRegistrationStore()

const eventBus = useEventBus()
const router = useRouter()
const {t} = useI18n()

// Константы из Vuetify
const {xs} = useDisplay()

// Запускает watcher генерации превью в composable
useVideoImageGenerator()

// Реактивные переменные
const mediaType = ref(null)
const meta = ref(null)
const isFiltersReady = ref(false)
const dropzone = ref(false)
const dropzoneDragDepth = ref(0)
const container = ref(null)

const updatePageSetting = async (data) => {
  await apiClient.put('/api/PageSetting', {
    data,
    query: {
      tagId: props.tagId,
      mediaTypeId: props.mediaTypeId,
      metaId: props.metaId,
      tabId: props.tabId,
    },
  })
}

const {
  total,
  totalInDb,
  pages,
  loader,
  isLoadingMore,
  is_not_full_height,
  is_infinite_scroll,
  showPagination,
  paginationPage,
  paginationJumpPage,
  infiniteIntersectOptions,
  getItemsFromDb,
  getEntitiesOnPage,
  changePage,
  jumpToPage,
  scrollTop,
  resetMediaListState,
  disposeListFetching,
  bindMediaInfiniteScroll,
  unbindMediaInfiniteScroll,
  maybeLoadMoreIfNearBottom,
  refreshScrollRoot,
} = useItemsPage({
  props,
  mediaType,
  container,
  updatePageSetting,
})

// Компьютеды
const ITEMS = computed(() => itemsStore)
const SETTINGS = computed(() => settingsStore)
const activeFilters = computed(() => {
  if (!ITEMS.value.filters || !Array.isArray(ITEMS.value.filters)) {
    return [];
  }
  return ITEMS.value.filters.filter(i => i && i.active);
});
const isImageGrid = computed(() =>
  props.items_type === 'media' && mediaType.value?.type === 'image' && ITEMS.value.view == '1'
)
const isWideImage = computed(() =>
  props.items_type === 'media' && isVideoMediaType(mediaType.value) && ITEMS.value.view == '2'
)
const isLineGrid = computed(() => isWideImage.value)
const isChipsGrid = computed(() =>
  props.items_type === 'tag' && ITEMS.value.view == '2'
)
const itemsGridClasses = computed(() => [
  `item__size-${ITEMS.value.size}`,
  `gap-size-${SETTINGS.value.gapSize}`,
  {'card-grid': ITEMS.value.view == '1'},
  {'chips-grid': isChipsGrid.value},
  {'line-grid': isLineGrid.value},
  {'wide-image': isWideImage.value},
  {'image-grid': isImageGrid.value},
])
const reg = computed(() => registrationStore.reg)
const isElectron = computed(() => appStore.isElectron)
const apiUrl = computed(() => appStore.localhost)
const ENV = computed(() => ITEMS.value.environment)

const filesize_all = computed(() => {
  if (props.items_type !== 'media') return ""
  const sum = ITEMS.value.totalFilesize
  if (!sum) return ""
  return $readable.getReadableFileSize(sum)
})

const pageTitle = computed(() => {
  if (props.items_type === 'media' && mediaType.value) {
    return getMediaTypeName(mediaType.value, t)
  }
  return ITEMS.value.name
})

const image_filters_no_results = computed(() => {
  let img_path = ''
  if (props.items_type === 'tag') {
    img_path = '/images/filters/filters-no-results-tag.svg';
  } else if (props.items_type === 'media') {
    img_path = '/images/filters/filters-no-results-file.svg';
    if (isVideoMediaType(mediaType.value)) {
      img_path = '/images/filters/filters-no-results-video.svg';
    } else if (isImageMediaType(mediaType.value)) {
      img_path = '/images/filters/filters-no-results-file.svg';
    }
  }
  return img_path;
})

// Методы
const init = async () => {
  if (!apiUrl.value) {
    return
  }
  if (props.items_type === 'media' && !props.mediaTypeId) {
    return
  }
  if (props.items_type === 'tag' && !props.metaId) {
    return
  }

  disposeListFetching()

  if (props.items_type === 'media') {
    resetMediaListState()
  }

  if (props.items_type === 'tag') {
    await getMeta();
    if (!props.tagId && meta.value?.id) {
      await itemsStore.countViewNumber(meta.value, 'meta')
    }
  } else if (props.items_type === 'media') {
    await getMediaType();
  }
  await getFilters();
  await getPageSettings();
  await getPinnedMeta();
  await getItemsFromDb();
}

const loadSavedFilters = () => {
  $operable.getSavedFilters().catch((error) => {
    console.error('Failed to load saved filters:', error)
  })
}

const getFilters = async () => {
  // набор сохраненных фильтров
  let savedFilter = {};

  // получаем набор сохраненных фильтров
  await apiClient.post('/api/SavedFilter', {
    name: null,
    mediaTypeId: ENV.value.media_type_id,
    metaId: ENV.value.meta_id,
    tagId: ENV.value.tag_id,
    tabId: ENV.value.tab_id,
  })
    .then((res) => {
      savedFilter = res.data[0];
    })
    .catch((e) => {
      console.log(e);
    });

  if (_.isEmpty(savedFilter)) {
    return;
  }

  let filters = await $operable.getFilters(savedFilter.id);

  itemsStore.updateState({key: "filters", value: filters});
  itemsStore.updateState({key: "savedFilter", value: savedFilter});

  if (props.tagId) {
    initFilterForTagPage();
  }

  itemsStore.updateState({key: "isFiltersLoaded", value: true});
}

const initFilterForTagPage = () => {
  const index = ITEMS.value.filters.findIndex(
    i => i.param == meta.value?.id && i.lock == true
  );

  if (index < 0) {
    let fltr = $readable.getFilterObject({
      param: $readable.getUrlParam("metaId"),
      type: "array",
      cond: "in all",
      lock: true,
      val: [Number(props.tagId)],
    });
    itemsStore.updateState({
      key: "filters",
      value: [...ITEMS.value.filters, fltr]
    });
  }
}

const getPageSettings = async () => {
  await apiClient.post('/api/PageSetting', {
    tagId: props.tagId,
    mediaTypeId: props.mediaTypeId,
    metaId: props.metaId,
    tabId: props.tabId,
  })
    .then((res) => {
      if (!res.data?.[0]) return

      let vals = ["page", "limit", "size", "view", "sortBy", "sortDir"];

      for (let i of vals) {
        let value = res.data[0][i]
        if (value === undefined || value === null) continue

        if (i === 'page' && props.items_type === 'media' && Number(res.data[0].limit) === 101) {
          value = 1
        }

        if (i === 'sortBy' && props.items_type === 'media') {
          value = normalizeSortBy(value, props.items_type, mediaType.value, 'createdAt')
        }
        itemsStore.updateState({
          key: i,
          value,
        });
      }

      if (
        props.items_type === 'media' &&
        res.data[0].sortBy &&
        res.data[0].sortBy !== itemsStore.sortBy
      ) {
        updatePageSetting({sortBy: itemsStore.sortBy});
      }

      // if page settings created then update filter id for it
      if (res.data[1])
        updatePageSetting({filterId: ITEMS.value.savedFilter?.id});
    })
    .catch((e) => {
      console.log(e);
    });
}

const getMeta = async () => {
  await apiClient
    .get(`/api/meta/${props.metaId}`)
    .then((res) => {
      const metaData = _.cloneDeep(res.data);
      meta.value = metaData;
      itemsStore.updateState({key: "meta", value: metaData});
      itemsStore.updateState({key: "name", value: metaData.name});
      itemsStore.updateState({key: "icon", value: metaData.icon});
    })
    .catch((e) => {
      console.log(e);
    });
}

const getMediaType = async () => {
  await apiClient
    .get(`/api/MediaType/${props.mediaTypeId}`)
    .then((res) => {
      mediaType.value = res.data;
      itemsStore.updateState({key: "name", value: getMediaTypeName(res.data, t)});
      itemsStore.updateState({key: "icon", value: res.data.icon});
    })
    .catch((e) => {
      console.log(e);
    });
}

const getPinnedMeta = async () => {
  let url = "/api/";
  if (props.items_type === 'media') {
    url += "MetaInMediaType?mediaTypeId=" + props.mediaTypeId;
  } else if (props.items_type === 'tag') {
    url += "PinnedMeta?metaId=" + props.metaId;
  }
  await apiClient
    .get(url)
    .then((res) => {
      itemsStore.updateState({
        key: "assigned",
        value: res.data,
      });
      isFiltersReady.value = true;
    })
    .catch((e) => {
      console.log(e);
    });
}

const toggleCustomization = () => {
  const toolbarStore = useToolbarStore()
  toolbarStore.appearance.show = !toolbarStore.appearance.show
}

const containsDroppedFiles = (event) =>
  Array.from(event?.dataTransfer?.types || []).includes('Files')

const showDrop = (e) => {
  if (!containsDroppedFiles(e)) return

  e.preventDefault()
  if (isElectron.value && props.items_type === 'media') {
    dropzone.value = true
  }
}

const onDropzoneDragEnter = (event) => {
  if (!containsDroppedFiles(event)) return
  dropzoneDragDepth.value += 1
  dropzone.value = true
}

const onDropzoneDragOver = (event) => {
  if (!containsDroppedFiles(event)) return
  event.preventDefault()
  dropzone.value = true
}

const onDropzoneDragLeave = () => {
  dropzoneDragDepth.value = Math.max(0, dropzoneDragDepth.value - 1)
  if (dropzoneDragDepth.value === 0) {
    dropzone.value = false
  }
}

const catchDrop = (e) => {
  dropzone.value = false
  dropzoneDragDepth.value = 0
  if (!isElectron.value || props.items_type !== 'media' || !mediaType.value) return

  const paths = collectDroppedPaths(e)
  if (!paths.length) return

  startDroppedMediaAdding({
    paths,
    mediaTypeId: props.mediaTypeId,
    tasksStore,
    eventBus,
  })
}

// События
const emit = defineEmits(['addMedia', 'playVideo'])

// Хуки жизненного цикла
onMounted(async () => {
  itemsStore.updateState({key: "isSelect", value: false});
  itemsStore.updateState({key: "selection", value: []});

  if (props.items_type === 'media' && ITEMS.value.limit === 101) {
    itemsStore.updateState({key: 'page', value: 1});
  }

  eventBus.on('getItemsFromDb', handleGetItemsFromDb);
  eventBus.on('setItemsFilters', handleSetItemsFilters);
  eventBus.on('setItemsLimit', handleSetItemsLimit);
  eventBus.on('removeEntitiesFromState', handleRemoveEntitiesFromState);
  eventBus.on('setItemsSortDir', handleSetItemsSortDir);
  eventBus.on('setItemsSortBy', handleSetItemsSortBy);
  eventBus.on('setItemsView', handleSetItemsView);
  eventBus.on('updateAssignedMeta', handleUpdateAssignedMeta);
  eventBus.on('openRandomItem', handleOpenRandomItem);

  try {
    await init();
    loadSavedFilters();
  } catch (error) {
    console.error('Failed to initialize items page:', error);
  } finally {
    loader.value.is_busy = false;
  }

  refreshScrollRoot();

  if (props.items_type === 'media' && is_infinite_scroll.value) {
    await nextTick();
    maybeLoadMoreIfNearBottom();
  }

  bindMediaInfiniteScroll();
})

onBeforeUnmount(() => {
  disposeListFetching()
  unbindMediaInfiniteScroll();
  if (is_infinite_scroll.value) updatePageSetting({page: 1});
  itemsStore.updateState({
    key: "isFiltersLoaded",
    value: false,
  });

  itemsStore.find_duplicates = false

  // Удаляем слушатели
  eventBus.off('getItemsFromDb', handleGetItemsFromDb);
  eventBus.off('setItemsFilters', handleSetItemsFilters);
  eventBus.off('setItemsLimit', handleSetItemsLimit);
  eventBus.off('removeEntitiesFromState', handleRemoveEntitiesFromState);
  eventBus.off('setItemsSortDir', handleSetItemsSortDir);
  eventBus.off('setItemsSortBy', handleSetItemsSortBy);
  eventBus.off('setItemsView', handleSetItemsView);
  eventBus.off('updateAssignedMeta', handleUpdateAssignedMeta);
  eventBus.off('openRandomItem', handleOpenRandomItem);
})

// Обработчики событий
const handleGetItemsFromDb = (event) => {
  const {ids, type} = event;
  if (props.items_type !== type) return
  if (Array.isArray(ids) && ids.length === 0 && loader.value.is_busy) {
    return
  }
  getItemsFromDb(ids);
}

const handleSetItemsFilters = async (event) => {
  const val = event;
  itemsStore.updateState({key: 'page', value: 1});
  await updatePageSetting({
    page: 1,
    query: val,
  });
  await getFilters();
  await getItemsFromDb();
}

const handleSetItemsLimit = (event) => {
  const val = event;
  itemsStore.updateState({
    key: "page",
    value: 1,
  });
  if (val == 101) itemsStore.updateState({key: "itemsOnPage", value: []});
  updatePageSetting({
    page: 1,
    limit: val,
  });

  if (props.items_type === 'media') {
    getItemsFromDb();
    return
  }

  getEntitiesOnPage();
}

const handleRemoveEntitiesFromState = (event) => {
  const {ids, type} = event;
  if (type !== props.items_type) return

  if (props.items_type === 'media') {
    for (const id of ids) {
      itemsStore.removeItem(id)
    }
    total.value = ITEMS.value.totalFiltered
    totalInDb.value = Math.max(0, totalInDb.value - ids.length)
    return
  }

  getEntitiesOnPage(ids);
}

const handleSetItemsSortDir = (event) => {
  const val = event;
  if (val === ITEMS.value.sortDir) return

  itemsStore.updateState({
    key: "page",
    value: 1,
  });
  updatePageSetting({
    page: 1,
    sortDir: val,
  });
  getItemsFromDb();
}

const handleSetItemsSortBy = (event) => {
  const val = event;
  if (val === ITEMS.value.sortBy) return

  itemsStore.updateState({
    key: "page",
    value: 1,
  });
  updatePageSetting({
    page: 1,
    sortBy: val,
  });
  getItemsFromDb();
}

const handleSetItemsView = (event) => {
  const val = event;
  updatePageSetting({
    view: val,
  });
}

const handleUpdateAssignedMeta = async () => {
  await getPinnedMeta();
}

const handleOpenRandomItem = (event) => {
  const id = event;
  const navigationPool = ITEMS.value.navigationItems.length
    ? ITEMS.value.navigationItems
    : ITEMS.value.entities

  if (props.items_type === 'tag') {
    let url = "/tag?metaId=" + meta.value.id + "&tagId=" + id + "&mediaTypeId=" + getDefaultMediaTypeId(appStore.mediaTypes);
    router.push(url);
  } else if (props.items_type === 'media') {
    const media = navigationPool.find(i => i.id === id);
    if (isImageMediaType(mediaType.value)) {
      itemsStore.viewImage({image: media})
    } else if (isVideoMediaType(mediaType.value) || isAudioMediaType(mediaType.value)) {
      itemsStore.playVideo({
        video: media,
      })
    } else if (isTextMediaType(mediaType.value) && media?.path) {
      $operable.openPath(media.path)
    }
  }
}

// Watchers
watch(() => ITEMS.size, (val, old) => {
  if (val === old) return;
  updatePageSetting({size: val});
})

watch(is_infinite_scroll, () => {
  bindMediaInfiniteScroll();
})

watch(
  () => [props.items_type, props.mediaTypeId, props.metaId, props.tagId, props.tabId],
  async (next, prev) => {
    if (prev && JSON.stringify(next) === JSON.stringify(prev)) return
    if (props.items_type === 'media' && !props.mediaTypeId) return
    if (props.items_type === 'tag' && !props.metaId) return

    try {
      await init()
      loadSavedFilters()
    } catch (error) {
      console.error('Failed to reinitialize items page:', error)
    } finally {
      loader.value.is_busy = false
    }
  },
)
</script>

<style lang="scss">
.infinite-loader {
  min-height: calc(100vh - 124px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

.infinite-loader-full-height {
  text-align: center;
  padding: 24px 0;
}

.scroll-top-after-items {
  display: flex;
  justify-content: center;
  padding: 60px 0 24px;
}

.infinite-scroll-sentinel {
  width: 100%;
  height: 1px;
  pointer-events: none;
}
</style>