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

    <v-card
      v-show="dropzone"
      @dragleave="dropzone = false"
      @drop.prevent="catchDrop($event)"
      @dragenter.prevent
      @dragover.prevent
      class="dropzone"
    >
      <div class="text">{{ t('items.drop_video_or_folder') }}</div>
    </v-card>

    <QuickActionButton v-if="SETTINGS.show_quick_action_button == '1'"/>
  </v-container>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'
import axios from 'axios'
import _ from 'lodash'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useTasksStore} from '@/stores/tasks'
import {useRegistrationStore} from '@/stores/registration'
import {useToolbarStore} from '@/stores/toolbar'
import {useRouter} from 'vue-router'
import {useEventBus} from '@/utils/eventBus'
import {scrollMainTo, getMainScrollEl} from '@/utils/mainScroll'
import useVideoImageGenerator from '@/composable/GeneratingThumbsForVideos'

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
  getDuplicatesGroupKey,
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
const total = ref(1)
const totalInDb = ref(0)
const pages = ref(0)
const isFiltersReady = ref(false)
const loader = ref({
  show: false,
  timeout: 0,
  is_busy: true,
})
const is_not_full_height = ref(false)
const isLoadingMore = ref(false)
const dropzone = ref(false)
const container = ref(null)
const scrollRoot = ref(null)
const INFINITE_PAGE_SIZE = 25
let mediaScrollEl = null

// Компьютеды
const ITEMS = computed(() => itemsStore)
const SETTINGS = computed(() => settingsStore)
const activeFilters = computed(() => {
  if (!ITEMS.value.filters || !Array.isArray(ITEMS.value.filters)) {
    return [];
  }
  return ITEMS.value.filters.filter(i => i && i.active);
});
const is_infinite_scroll = computed(() => ITEMS.value.limit === 101)
const showPagination = computed(() => (
  ITEMS.value.itemsOnPage.length > 0 && !is_infinite_scroll.value && pages.value > 0
))
const paginationPage = computed({
  get: () => ITEMS.value.page,
  set: (value) => {
    itemsStore.updateState({key: 'page', value})
  },
})
const paginationJumpPage = computed({
  get: () => ITEMS.value.jumpPage,
  set: (value) => {
    itemsStore.updateState({key: 'jumpPage', value})
  },
})
const infiniteIntersectOptions = computed(() => ({
  handler: infiniteScrolling,
  options: {
    root: scrollRoot.value,
    rootMargin: '400px 0px',
    threshold: 0,
  },
}))
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
  await $operable.getSavedFilters();
}

const getFilters = async () => {
  // набор сохраненных фильтров
  let savedFilter = {};

  // получаем набор сохраненных фильтров
  await axios({
    method: "post",
    url: apiUrl.value + "/api/SavedFilter",
    data: {
      name: null,
      mediaTypeId: ENV.value.media_type_id,
      metaId: ENV.value.meta_id,
      tagId: ENV.value.tag_id,
      tabId: ENV.value.tab_id,
    },
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
  await axios({
    method: "post",
    url: apiUrl.value + "/api/PageSetting",
    data: {
      tagId: props.tagId,
      mediaTypeId: props.mediaTypeId,
      metaId: props.metaId,
      tabId: props.tabId,
    },
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

const updatePageSetting = async (data) => {
  await axios({
    method: "put",
    url: apiUrl.value + "/api/PageSetting",
    data: {
      data,
      query: {
        tagId: props.tagId,
        mediaTypeId: props.mediaTypeId,
        metaId: props.metaId,
        tabId: props.tabId,
      },
    },
  });
}

const getMeta = async () => {
  await axios
    .get(apiUrl.value + "/api/meta/" + props.metaId)
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
  await axios
    .get(apiUrl.value + "/api/MediaType/" + props.mediaTypeId)
    .then((res) => {
      mediaType.value = res.data;
      itemsStore.updateState({key: "name", value: getMediaTypeName(res.data, t)});
      itemsStore.updateState({key: "icon", value: res.data.icon});
    })
    .catch((e) => {
      console.log(e);
    });
}

const applyMediaListResponse = (response, {append = false} = {}) => {
  const pageItems = response.data.items || []

  if (response.data.navigation) {
    itemsStore.updateState({
      key: 'navigationItems',
      value: response.data.navigation,
    })
  }

  if (response.data.totalFiltered != null) {
    itemsStore.updateState({
      key: 'totalFiltered',
      value: response.data.totalFiltered,
    })
    total.value = response.data.totalFiltered
  } else if (!append) {
    itemsStore.updateState({
      key: 'totalFiltered',
      value: pageItems.length,
    })
    total.value = pageItems.length
  }

  if (response.data.totalFilesize != null) {
    itemsStore.updateState({
      key: 'totalFilesize',
      value: response.data.totalFilesize || 0,
    })
  }

  if (response.data.total != null) {
    totalInDb.value = response.data.total || 0
  }

  if (response.data.pages != null) {
    pages.value = response.data.pages || 1
  }

  const nextItems = append
    ? _.uniqBy([...ITEMS.value.itemsOnPage, ...pageItems], 'id')
    : pageItems

  itemsStore.updateState({key: 'entities', value: nextItems})
  itemsStore.updateState({key: 'itemsOnPage', value: nextItems})
  itemsStore.updateState({key: 'isFiltersLoaded', value: true})
}

const getItemsFromDb = async (ids) => {
  let url = "/api/";
  let query = {};
  if (props.items_type === 'tag') {
    url += "tag/items/";
    query.metaId = props.metaId;
  } else if (props.items_type === 'media') {
    url += "media/items";
    query.mediaTypeId = props.mediaTypeId;
  }

  // Подготавливаем query с безопасными значениями
  query.filters = _.cloneDeep(ITEMS.value.filters || []);
  query.sortBy = normalizeSortBy(
    ITEMS.value.sortBy || 'id',
    props.items_type,
    mediaType.value,
    'createdAt'
  ) || 'id';
  query.direction = ITEMS.value.sortDir || 'desc';
  query.find_duplicates = ITEMS.value.find_duplicates || false;
  if (props.items_type === 'media') {
    query.duplicates_by = getDuplicatesGroupKey(mediaType.value);
  }
  query.ids = ids || [];

  const appendMediaPage = props.items_type === 'media'
    && is_infinite_scroll.value
    && ITEMS.value.page > 1
    && ITEMS.value.itemsOnPage.length > 0
    && (!ids || !ids.length)

  if (props.items_type === 'media' && is_infinite_scroll.value && !appendMediaPage && (!ids || !ids.length)) {
    itemsStore.updateState({key: 'page', value: 1})
    query.page = 1
  }

  if (props.items_type === 'media') {
    query.includeNavigation = false
    const pageLimit = is_infinite_scroll.value ? INFINITE_PAGE_SIZE : ITEMS.value.limit
    query.page = ITEMS.value.page || 1
    query.limit = pageLimit
    query.skipTotals = appendMediaPage
  }

  if (ids && ids.length > 0) {
    query.filters = []
    await axios.post(apiUrl.value + url, query)
      .then((res) => {
        for (let id of ids) {
          let item = res.data.items.find(i => Number(i.id) === Number(id))
          itemsStore.updateItem({id, item})
        }
      })
      .catch((e) => {
        console.error('Error fetching specific items:', e);
      });
    loader.value.is_busy = false;
  } else {
    if (!appendMediaPage) {
      itemsStore.updateState({
        key: "isFiltersLoaded",
        value: false,
      });

      itemsStore.updateState({
        key: "itemsOnPage",
        value: [],
      });
      loader.value.is_busy = true;
      loader.value.show = false;
    }

    try {
      const response = await axios.post(apiUrl.value + url, query);

      if (!appendMediaPage) {
        clearTimeout(loader.value.timeout);
        loader.value.is_busy = false;
        loader.value.timeout = setTimeout(() => {
          loader.value.show = true;
        }, 500);
      }

      if (props.items_type === 'media') {
        const previousCount = appendMediaPage ? ITEMS.value.itemsOnPage.length : 0
        applyMediaListResponse(response, {append: appendMediaPage})

        if (response.data.page != null) {
          itemsStore.updateState({key: 'page', value: response.data.page})
        }

        if (appendMediaPage && response.data.items?.length === 0) {
          itemsStore.updateState({
            key: 'totalFiltered',
            value: ITEMS.value.itemsOnPage.length,
          })
          total.value = ITEMS.value.itemsOnPage.length
        } else if (appendMediaPage && ITEMS.value.itemsOnPage.length === previousCount) {
          itemsStore.updateState({
            key: 'totalFiltered',
            value: ITEMS.value.itemsOnPage.length,
          })
          total.value = ITEMS.value.itemsOnPage.length
        } else if (appendMediaPage) {
          await nextTick()
          maybeLoadMoreIfNearBottom()
        } else if (is_infinite_scroll.value) {
          await nextTick()
          maybeLoadMoreIfNearBottom()
        }
      } else {
        itemsStore.updateState({
          key: "entities",
          value: response.data.items || []
        });
        totalInDb.value = response.data.total || 0;
        itemsStore.updateState({key: "itemsOnPage", value: []});

        if (is_infinite_scroll.value) {
          itemsStore.updateState({key: "page", value: 1});
        }

        getEntitiesOnPage();
      }

    } catch (error) {
      loader.value.is_busy = false;
      itemsStore.updateState({key: "isFiltersLoaded", value: true});

      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification(t('notifications_text.server_error_logs'), 'error');
      }

      if (props.items_type === 'media') {
        itemsStore.updateState({key: "itemsOnPage", value: []});
        itemsStore.updateState({key: "entities", value: []});
        itemsStore.updateState({key: "navigationItems", value: []});
        total.value = 0;
        totalInDb.value = 0;
      } else {
        itemsStore.updateState({key: "entities", value: []});
        totalInDb.value = 0;
        getEntitiesOnPage();
      }

      throw error;
    }
  }
}

const getEntitiesOnPage = (ids_remove = []) => {
  // убираем предметы по айди
  for (let id of ids_remove) {
    itemsStore.removeItem(id)
    --totalInDb.value;
  }

  const container_height = container.value?.clientHeight || 100;
  const difference_height = window.screen.height - container_height + 48;
  is_not_full_height.value = difference_height > 0;
  let items_concat = null;
  // здесь ВСЕ предметы которые есть в БД
  let items = ITEMS.value.entities;

  total.value = items.length;
  itemsStore.updateState({key: 'totalFiltered', value: items.length});
  const limit = is_infinite_scroll.value ? INFINITE_PAGE_SIZE : ITEMS.value.limit;
  const pagesCount = Math.ceil(total.value / limit);
  pages.value = pagesCount;
  if (ITEMS.value.page > pagesCount) {
    itemsStore.updateState({key: "page", value: 1});
  }
  const start = (ITEMS.value.page - 1) * limit;
  const end = start + limit;
  const new_items_on_page = items.slice(start, end)

  if (is_infinite_scroll.value) {
    items_concat = [...ITEMS.value.itemsOnPage, ...new_items_on_page]
    items_concat = _.uniqBy(items_concat, 'id')
  } else {
    items_concat = new_items_on_page;
  }

  itemsStore.updateState({key: "itemsOnPage", value: items_concat});
  itemsStore.updateState({key: "isFiltersLoaded", value: true});
}

const getPinnedMeta = async () => {
  let url = "/api/";
  if (props.items_type === 'media') {
    url += "MetaInMediaType?mediaTypeId=" + props.mediaTypeId;
  } else if (props.items_type === 'tag') {
    url += "PinnedMeta?metaId=" + props.metaId;
  }
  await axios
    .get(apiUrl.value + url)
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

const changePage = (val) => {
  itemsStore.updateState({
    key: "page",
    value: val,
  });

  if (props.items_type === 'media') {
    updatePageSetting({page: val});
    getItemsFromDb();
    scrollTop();
    return
  }

  getEntitiesOnPage();
  updatePageSetting({page: val});
  scrollTop();
}

const getNextInfiniteMediaPage = () => {
  if (!ITEMS.value.itemsOnPage.length) return 1
  return Math.floor(ITEMS.value.itemsOnPage.length / INFINITE_PAGE_SIZE) + 1
}

const refreshScrollRoot = () => {
  scrollRoot.value = getMainScrollEl()
  return scrollRoot.value
}

const loadNextInfinitePage = async () => {
  if (!is_infinite_scroll.value) return;
  if (loader.value.is_busy || isLoadingMore.value) return;
  if (ITEMS.value.totalFiltered <= 0) return;
  if (ITEMS.value.itemsOnPage.length >= ITEMS.value.totalFiltered) return;

  isLoadingMore.value = true;
  try {
    if (props.items_type === 'media') {
      itemsStore.updateState({
        key: "page",
        value: getNextInfiniteMediaPage(),
      });
      await getItemsFromDb();
    } else {
      itemsStore.updateState({
        key: "page",
        value: ITEMS.value.page + 1,
      });
      getEntitiesOnPage();
    }
  } finally {
    isLoadingMore.value = false;
  }
}

const maybeLoadMoreIfNearBottom = () => {
  if (!is_infinite_scroll.value) return;
  if (loader.value.is_busy || isLoadingMore.value) return;
  if (ITEMS.value.totalFiltered <= 0) return;
  if (ITEMS.value.itemsOnPage.length >= ITEMS.value.totalFiltered) return;

  const el = refreshScrollRoot() || getMainScrollEl();
  if (!el) return;

  const threshold = 400;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  const shortPage = el.scrollHeight <= el.clientHeight + threshold;

  if (nearBottom || shortPage) {
    loadNextInfinitePage();
  }
}

const infiniteScrolling = (isIntersecting) => {
  if (isIntersecting === false) return;
  loadNextInfinitePage();
}

const onMediaInfiniteScroll = _.throttle(() => {
  if (!is_infinite_scroll.value || props.items_type !== 'media') return;
  const el = getMainScrollEl();
  if (!el) return;

  const threshold = 400;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  if (nearBottom) loadNextInfinitePage();
}, 150);

const bindMediaInfiniteScroll = () => {
  unbindMediaInfiniteScroll();
  if (!is_infinite_scroll.value || props.items_type !== 'media') return;
  mediaScrollEl = refreshScrollRoot();
  mediaScrollEl?.addEventListener('scroll', onMediaInfiniteScroll, {passive: true});
}

const unbindMediaInfiniteScroll = () => {
  if (mediaScrollEl) {
    mediaScrollEl.removeEventListener('scroll', onMediaInfiniteScroll);
    mediaScrollEl = null;
  }
  onMediaInfiniteScroll.cancel();
}

const scrollTop = () => {
  scrollMainTo({ top: 0, behavior: 'smooth' })
}

const toggleCustomization = () => {
  const toolbarStore = useToolbarStore()
  toolbarStore.appearance.show = !toolbarStore.appearance.show
}

const jumpToPage = (value = ITEMS.value.jumpPage) => {
  if (value === null || value === undefined) return;
  let val = Number(value);
  if (val < 1) val = 1;
  else if (val > pages.value) val = pages.value;
  if (val !== ITEMS.value.page) itemsStore.updateState({
    key: "page",
    value: val
  });
  itemsStore.updateState({key: "jumpPage", value: val});
  changePage(val);
}

const showDrop = (e) => {
  const containsFiles = (event) => {
    if (event.dataTransfer.types) {
      for (let i = 0; i < event.dataTransfer.types.length; i++) {
        if (event.dataTransfer.types[i] == "Files") {
          return true;
        }
      }
    }
    return false;
  }
  if (containsFiles(e)) {
    e.preventDefault()
    if (isElectron.value && props.items_type === 'media' && dropzone.value == false) {
      dropzone.value = true;
    }
  }
}

const catchDrop = (e) => {
  dropzone.value = false
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
  // clearing previous values
  itemsStore.updateState({key: "itemsOnPage", value: []});
  itemsStore.updateState({key: "navigationItems", value: []});
  itemsStore.updateState({key: "totalFiltered", value: 0});
  itemsStore.updateState({key: "totalFilesize", value: 0});
  itemsStore.updateState({key: "isSelect", value: false});
  itemsStore.updateState({key: "selection", value: []});
  itemsStore.updateState({key: "filters", value: []});

  if (props.items_type === 'media' && ITEMS.value.limit === 101) {
    itemsStore.updateState({key: 'page', value: 1});
  }

  await init();

  refreshScrollRoot();

  if (props.items_type === 'media' && is_infinite_scroll.value) {
    await nextTick();
    maybeLoadMoreIfNearBottom();
  }

  // Слушатели событий (нужно будет перенести на provide/inject или event bus в Vue 3)
  // Временное решение:
  eventBus.on('getItemsFromDb', handleGetItemsFromDb);
  eventBus.on('setItemsFilters', handleSetItemsFilters);
  eventBus.on('setItemsLimit', handleSetItemsLimit);
  eventBus.on('removeEntitiesFromState', handleRemoveEntitiesFromState);
  eventBus.on('setItemsSortDir', handleSetItemsSortDir);
  eventBus.on('setItemsSortBy', handleSetItemsSortBy);
  eventBus.on('setItemsView', handleSetItemsView);
  eventBus.on('updateAssignedMeta', handleUpdateAssignedMeta);
  eventBus.on('openRandomItem', handleOpenRandomItem);

  bindMediaInfiniteScroll();
})

onBeforeUnmount(() => {
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
  if (props.items_type === type) {
    getItemsFromDb(ids);
  }
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