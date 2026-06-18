<template>
  <v-autocomplete
    v-bind="attrs"
    :model-value="val"
    @update:model-value="setVal"
    v-model:search="search"
    :items="listTags"
    :custom-filter="filterTags"
    item-value="id"
    ref="field"
    :rules="[rules]"
    :menu-props="menuProps"
    :label="meta.name"
    :hint="meta.hint"
    :hide-no-data="!search"
    hide-selected
    @keydown.enter="onEnter"
  >
    <template v-slot:no-data>
      <div v-if="purpose == 'filter'" class="pa-3">{{ t('common.no_data') }}</div>
      <v-btn v-else @click="create()" color="success" block size="large" variant="flat">
        <v-icon start>mdi-tag-plus</v-icon>
        {{ t('meta.fields.create_tag', {name: search}) }}
      </v-btn>
    </template>

    <template v-slot:selection="{ item }">
      <v-chip
        v-if="item.raw"
        @click:close="removeTag(item.value)"
        @mouseover.stop="$readable.showHoverImage($event, meta.id, item.value)"
        @mouseleave.stop="$readable.hideHoverImage"
        :label="meta?.chipLabel"
        :variant="meta?.chipVariant"
        :color="meta?.color ? item.raw.color : ''"
        :text-color="meta?.color ? $readable.getTextColor(item.raw.color,meta?.chipVariant) : ''"
        closable
        class="ma-1"
        size="small"
      >
        <span>{{ item.raw.name || item.title }}</span>
      </v-chip>
      <v-chip
        v-else
        @click:close="removeTag(item.value)"
        class="ma-1"
        closable
      >
        <!-- Если raw недоступен, ищем тег в listTags -->
        <span>{{ findTagName(item.value) }}</span>
      </v-chip>
    </template>

    <template v-slot:item="{ props, item }">
      <v-list-item
        v-bind="props"
        @click="$readable.hideHoverImage"
        @mouseover.stop="$readable.showHoverImage($event, meta.id, item.value)"
        @mouseleave.stop="$readable.hideHoverImage"
        class="list-item"
      >
        <!-- Убираем v-list-item-title и используем свой контент -->
        <template v-slot:title>
          <div class="d-flex align-center flex-grow-1">
            <div class="d-flex align-center mr-2">
              <span v-if="meta.favorite">
                <v-icon v-if="item.raw.favorite" color="pink" size="small" class="mr-1">
                  mdi-heart
                </v-icon>
                <v-icon v-else size="small" class="mr-1">mdi-heart-outline</v-icon>
              </span>
              <span v-if="meta.color">
                <v-icon :color="item.raw.color || ''" size="14" class="mr-1">mdi-circle</v-icon>
              </span>
            </div>
            <div class="d-flex align-baseline">
              <span v-html="search ? item.raw.name_parsed || item.raw.name : item.raw.name"/>
              <span
                v-if="meta.synonyms && item.raw.synonyms"
                v-html="search ? item.raw.synonyms_parsed || item.raw.synonyms : item.raw.synonyms"
                class="synonyms"
              />
            </div>
          </div>
        </template>
      </v-list-item>
    </template>

    <template v-if="purpose != 'filter' && showIcons" v-slot:prepend>
      <v-menu location="top" close-on-click>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon variant="plain" density="compact">
            <v-icon>mdi-{{ meta.icon }}</v-icon>
          </v-btn>
        </template>

        <v-list density="compact">
          <v-list-subheader>{{ t('meta.sorting.sort_direction') }}</v-list-subheader>
          <v-list-item @click="changeSortDir">
            <v-list-item-title>
              <span v-if="meta?.sortDir === 'asc'">
                <v-icon start>mdi-sort-ascending</v-icon>
                {{ t('meta.sorting.ascending') }}
              </span>
              <span v-else>
                <v-icon start>mdi-sort-descending</v-icon>
                {{ t('meta.sorting.descending') }}
              </span>
            </v-list-item-title>
          </v-list-item>

          <v-list-subheader>{{ t('meta.sorting.sort_tags_by') }}</v-list-subheader>

          <v-list-item-group density="compact" mandatory>
            <v-list-item
              v-for="(s, x) in sortBy"
              @click="changeSortBy(s.value)"
              :value="s.value"
              :key="x"
              :active="s.value == meta.sortBy"
              color="primary"
            >
              <v-list-item-title>
                <v-icon start>mdi-{{ s.icon }}</v-icon>
                {{ s.title }}
              </v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
    </template>
  </v-autocomplete>
</template>

<script setup>
import {ref, reactive, computed, onMounted, watch, nextTick, useAttrs} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import axios from "axios"
import _ from 'lodash'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useEventBus} from "@/utils/eventBus"

const attrs = useAttrs()

const props = defineProps({
  metaId: Number,
  purpose: String,
  modelValue: [Array, Number],
  cond: {
    type: String,
    default: null,
  },
  menuProps: {
    type: Object,
    default: () => ({
      contentClass: "custom-list",
    }),
  },
})

const emit = defineEmits(['update:modelValue'])

// Stores
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const eventBus = useEventBus()
const router = useRouter()
const {t} = useI18n()

// Reactive data
const meta = ref({})
const val = ref([])
const listTags = ref([])
const search = ref(null)
const field = ref(null)

const sortBy = computed(() => [
  {
    title: t("meta.sorting.name"),
    icon: "alphabetical-variant",
    value: "name",
  },
  {
    title: t("meta.sorting.favorite"),
    icon: "heart",
    value: "favorite",
  },
  {
    title: t("meta.sorting.date_added"),
    icon: "calendar",
    value: "createdAt",
  },
  {
    title: t("meta.sorting.date_updated"),
    icon: "calendar-edit",
    value: "updatedAt",
  },
])

// Computed properties
const apiUrl = computed(() => appStore.localhost)

const showIcons = computed(() =>
  settingsStore.showIconsOfMetaInEditingDialog === '1'
)

const filterTags = (title, queryText, tagObj) => {
  let tag = _.cloneDeep(tagObj.raw);
  let query = queryText.toLowerCase();

  const foundByChars = (text, query) => {
    return $readable.foundByChars(text, query);
  };

  const is_default = settingsStore.typingFiltersDefault == "1";
  const is_name_found = is_default ? tag.name.toLowerCase().indexOf(query) > -1 : foundByChars(tag.name, query);

  if (is_name_found) {
    tagObj.raw.name_parsed = $readable.highlightChars(tag.name, queryText, is_default);
    tagObj.raw.synonyms_parsed = tagObj.raw.synonyms;
    return true;
  } else {
    if (!tag.synonyms) {
      return false;
    }
    let synonyms = tag.synonyms.split(',');
    synonyms = synonyms.map(i => i.trim());

    let values = [];
    let synonyms_parsed = [];
    for (let i of synonyms) {
      const val = is_default ? i.toLowerCase().indexOf(query) > -1 : foundByChars(i, query);
      values.push(val);

      // для отображения строки с подчеркнутыми символами
      if (val) {
        let text = $readable.highlightChars(i, queryText, is_default);
        synonyms_parsed.push(text);
      } else {
        synonyms_parsed.push(i);
      }
    }

    tagObj.raw.name_parsed = tag.name;
    tagObj.raw.synonyms_parsed = synonyms_parsed.join(', ');
    return values.some(i => i);
  }
}


// Methods
const findTagName = (tagId) => {
  const tag = listTags.value.find(t => t.id === tagId)
  return tag ? tag.name : tagId
}

const getTags = async () => {
  const sets = {
    metaId: props.metaId,
    page: 0,
    limit: -1,
    sortBy: "name",
    sortDir: "asc",
    filters: [],
    query: `SELECT *
            FROM tags
            WHERE metaId = ${props.metaId}
            ORDER BY name ASC`
  }

  try {
    const res = await axios.post(apiUrl.value + "/api/tag/filter", sets)
    const tags = res.data.items
    listTags.value = sortTags(tags)
  } catch (e) {
    listTags.value = []
    console.error(e)
  }
}

const changeSortDir = async () => {
  const sortDir = meta.value.sortDir === 'asc' ? 'desc' : 'asc'

  try {
    await axios.put(apiUrl.value + "/api/Meta/" + meta.value.id, {
      sortDir: sortDir,
    })
    await getMeta()
    listTags.value = sortTags(listTags.value)
  } catch (error) {
    console.error(error)
  }
}

const changeSortBy = async (param) => {
  try {
    await axios.put(apiUrl.value + "/api/Meta/" + meta.value.id, {
      sortBy: param,
    })
    await getMeta()
    listTags.value = sortTags(listTags.value)
  } catch (error) {
    console.error(error)
  }
}

const sortTags = (tags) => {
  const sortByParam = meta.value?.sortBy || 'createdAt'
  const sortDir = meta.value?.sortDir || 'asc'

  // Сначала сортируем по имени, затем по выбранному параметру
  let sorted = _.orderBy(tags, ['name'], ['asc'])
  return _.orderBy(sorted, [sortByParam], [sortDir])
}

const create = async () => {
  if (!search.value) return

  const searchText = search.value.trim()
  if (!searchText) return

  const isExists = listTags.value.findIndex(
    i => i.name.toLowerCase() === searchText.toLowerCase()
  ) > -1

  if (isExists) return

  try {
    const res = await axios.post(apiUrl.value + "/api/tag", [{
      name: searchText,
      metaId: props.metaId,
    }])

    search.value = null
    let newVal = [res.data[0].id]

    if (Array.isArray(val.value)) {
      newVal = [...(val.value || []), ...newVal]
    }

    setVal(newVal)
    await getTags()

    // Используем event bus вместо $root
    eventBus.emit("getTags")

    if (+router.currentRoute.value.query.metaId === props.metaId) {
      const data = {
        ids: [],
        type: 'tag',
      }

      if (router.currentRoute.value.query.player) {
        // Для Electron
        if (window.electronAPI) {
          window.electronAPI.send("getItemsFromDb", data)
        }
      } else {
        eventBus.emit("getItemsFromDb", data)
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const onEnter = (event) => {
  const searchText = search.value?.trim()
  const isExists = listTags.value.some(
    i => i.name.toLowerCase() === searchText?.toLowerCase()
  )

  if (searchText && !isExists) {
    event.preventDefault()
    create()
  }
}
const setVal = (newVal) => {
  val.value = newVal
  emit('update:modelValue', newVal)

  // Очищаем поиск после выбора
  nextTick(() => {
    search.value = null
  })
}

const removeTag = (tagId) => {
  if (Array.isArray(val.value)) {
    const newVal = (val.value || []).filter(i => String(i) !== String(tagId))
    setVal(newVal)
  } else if (String(val.value) === String(tagId)) {
    setVal(null)
  }
  $readable.hideHoverImage()
}

const rules = () => {
  if (props.purpose !== "filter") return true
  if (val.value !== null && val.value.length > 0) return true
  else if (props.cond === "is null" || props.cond === "null") return true
  else return t("validation.value_required")
}

const getMeta = async () => {
  try {
    const res = await axios.get(apiUrl.value + "/api/meta/" + props.metaId)
    meta.value = res.data
  } catch (e) {
    console.error(e)
  }
}

// Lifecycle hooks
onMounted(async () => {
  await getMeta()

  val.value = props.modelValue
  await getTags()
})

// Watchers
watch(() => props.modelValue, (newVal) => {
  val.value = newVal
})
</script>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.synonyms {
  font-size: 0.85em;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>