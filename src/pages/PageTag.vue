<template>
  <div>
    <v-responsive
      :aspect-ratio="1400/609"
      color="transparent"
      class="tag-header"
      :light="!is_dark"
      :dark="is_dark"
      :class="{'no-header-image': !is_header_exists}"
      :style="{'background-image': `url('${is_header_exists ? images.header : images.main}')`}"
    >
      <v-container class="profile-container my-6">
        <v-row>
          <v-col cols="12">
            <v-btn @click="openMetaPage" :title="t('actions.open_page')" rounded>
              <v-icon start>mdi-{{ meta.icon }}</v-icon>
              <div class="text">{{ meta.name }}</div>
              <v-icon end>mdi-arrow-left</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <v-row style="position: relative;">
          <v-col cols="12">
            <v-card class="text-md-h2 text-xl-h1" variant="text">
              <v-avatar v-if="is_avatar_exists" :size="lg ? 120 : md ? 80 : sm ? 60 : xs ? 40 : 160" class="mr-8">
                <v-img :src="images.avatar"></v-img>
              </v-avatar>
              <v-icon v-else start>mdi-{{ meta.icon }}</v-icon>
              <span>{{ tag.name }}</span>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="3">
            <v-responsive
              v-if="images.main"
              :aspect-ratio="meta?.imageAspectRatio"
            >
              <v-img :src="images.main" rounded="xl" :class="{'main-img':is_header_exists}"></v-img>
            </v-responsive>
          </v-col>
          <v-col cols="12" md="9" style="position:relative;">
            <v-expansion-panels v-model="panel" multiple focusable>
              <v-expansion-panel class="rounded-xl tag-panel" :key="0">
                <v-expansion-panel-title class="pa-6" ripple hide-actions style="position: relative">
                  <div class="buttons-right">
                    <v-btn @click.stop="editMetaTag" color="primary" class="pr-4" rounded depressed>
                      <v-icon start>mdi-pencil</v-icon>
                      {{ t('common.edit') }}
                    </v-btn>
                  </div>

                  <div class="meta-card-name">{{ t('meta.fields.metadata') }}</div>
                  <v-progress-linear
                    :model-value="completionStatus"
                    height="2"
                    color="primary"
                    class="profile-complete-progress-linear"
                  ></v-progress-linear>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ItemPinnedMeta
                    :item="tag"
                    :tags="tag.tags"
                    :values="tag.values"
                    :assignment="pinnedMeta"
                    :is-show-all="true"
                    type="tag"
                    tag-page
                    class="mt-4"
                  ></ItemPinnedMeta>
                </v-expansion-panel-text>
                <div class="profile-hover-btn show">
                  <v-icon>mdi-chevron-down</v-icon>
                </div>
                <div class="profile-hover-btn hide">
                  <v-icon>mdi-chevron-up</v-icon>
                </div>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </v-responsive>

    <div v-if="pinnedMedia.length > 0 || pinnedParentMeta.length > 0">
      <div v-show="pinnedMedia.length + pinnedParentMeta.length > 1">
        <v-tabs
          v-if="is_init"
          :model-value="tab"
          @update:model-value="changeTab"
          background-color="transparent"
          class="fullwidth-tabs"
          slider-size="3"
          color="primary"
          icons-and-text
          show-arrows
          fixed-tabs
        >
          <v-tab
            v-for="i in pinnedMedia"
            :key="'media_type_tab'+i.mediaType.id"
            :value="`media_${i.mediaType.id}`"
          >
            <v-icon start>mdi-{{ i.mediaType.icon }}</v-icon>
            {{ getMediaTypeName(i.mediaType, t) }}
          </v-tab>
          <v-tab v-for="i in pinnedParentMeta" :key="'meta_tab'+i.id" :value="`tag_${i.id}`">
            <v-icon start>mdi-{{ i.icon }}</v-icon>
            {{ i.name }}
          </v-tab>
        </v-tabs>
      </div>

      <v-window v-if="is_init" v-model="tab" class="fullwidth-tabs transparent-tabs-only">
        <template v-for="i in pinnedMedia" :key="'media_type_tab_item'+i.mediaType.id">
          <v-window-item v-if="ITEMS.type.includes('media')" :value="`media_${i.mediaType.id}`">
            <LayoutItems
              :key="'media_type_' + upd + '_' + i.mediaType.id"
              :items_type="'media'"
              :mediaTypeId="i.mediaType.id"
              :metaId="ENV.meta_id"
              :tagId="ENV.tag_id"
              :tabId="ENV.tab_id"
            ></LayoutItems>
          </v-window-item>
        </template>

        <template v-for="i in pinnedParentMeta" :key="'meta_tab_item'+i.id">
          <v-window-item v-if="ITEMS.type.includes('tag')" :value="`tag_${i.id}`">
            <LayoutItems
              :key="'meta_' + upd + '_' + i.id"
              :items_type="'tag'"
              :mediaTypeId="ENV.media_type_id"
              :metaId="i.id"
              :tagId="ENV.tag_id"
              :tabId="ENV.tab_id"
            ></LayoutItems>
          </v-window-item>
        </template>
      </v-window>
    </div>

    <v-container v-else>
      <v-alert type="warning" rounded="xl" variant="tonal">
        {{ t('items.no_media_or_meta_with_tag') }}
      </v-alert>
    </v-container>

    <DialogImageEditing
      v-if="dialogImageEditing"
      @edited="getImages"
      @close="dialogImageEditing = false"
      :dialog="dialogImageEditing"
      :image="images.main"
      :options="cropperOps"
      :imagePath="imgPath"
    />
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'
import {useTheme, useDisplay} from 'vuetify'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useRegistrationStore} from '@/stores/registration'
import axios from 'axios'
import _ from 'lodash'
import ItemPinnedMeta from '@/components/items/ItemPinnedMeta.vue'
import {useEventBus} from '@/utils/eventBus'
import path from 'path-browserify';
import LayoutItems from "@/layouts/LayoutItems.vue";
import {getMediaTypeName} from '@/utils/mediaTypeI18n'

const route = useRoute()
const router = useRouter()
const theme = useTheme()
const {xl, lg, md, sm, xs} = useDisplay()
const appStore = useAppStore()
const itemsStore = useItemsStore()
const settingsStore = useSettingsStore()
const dialogsStore = useDialogsStore()
const registrationStore = useRegistrationStore()
const eventBus = useEventBus()
const {t} = useI18n()

// Refs
const upd = ref(0)
const upd_tag = ref(0)
const tab = ref(null)
const is_init = ref(false)
const meta = ref({})
const tag = ref({
  tags: [],
  values: [],
})
const images = ref({
  main: null,
  header: null,
  avatar: null,
})
const panel = ref([])
const dialogImageEditing = ref(false)
const imgPath = ref("")
const cropperOps = ref({
  aspectRatio: 1,
})
const bgc = ref("#777")
const tags_filter = ref([])
const tags_filter_value = ref([])
const pinnedParentMeta = ref([])
const pinnedMeta = ref([])
const pinnedMedia = ref([])
const values = ref([])
const completionStatus = ref(0)

// Computed
const apiUrl = computed(() => appStore.localhost)
const ITEMS = computed(() => itemsStore)
const ENV = computed(() => itemsStore.environment)
const SETTINGS = computed(() => settingsStore)
const reg = computed(() => registrationStore.reg)
const is_dark = computed(() => theme.global.current.value.dark)
const isTextDark = computed(() => {
  return $readable.checkColorForDarkText(bgc.value)
})
const is_header_exists = computed(() => {
  if (images.value.header) {
    return !images.value.header.includes('unavailable.png')
  } else {
    return false
  }
})
const is_avatar_exists = computed(() => {
  if (images.value.avatar) {
    return !images.value.avatar.includes('unavailable.png')
  } else {
    return false
  }
})
// Methods
const init = async () => {
  await getMeta()
  await getTag()
  await getImages()
  await getPinnedMedia()
  await getPinnedParentMeta()
  await getCompletionStatus()
  is_init.value = true

  cropperOps.value.aspectRatio = meta.value?.imageAspectRatio
  imgPath.value = path.join(
    appStore.dbPath,
    "meta/",
    `${ENV.value.meta_id}`,
    `${ENV.value.tag_id}_main.jpg`
  )

  // увеличиваем кол-во просмотров
  await itemsStore.countViewNumber(tag.value, 'tag')
}

const getMeta = async () => {
  try {
    const res = await axios.get(apiUrl.value + "/api/meta/" + ENV.value.meta_id)
    meta.value = res.data
  } catch (e) {
    console.log(e)
  }
}

const getTag = async () => {
  let query = {
    metaId: meta.value.id,
    filters: [],
    sortBy: 'name',
    sortDir: 'asc',
    ids: [ENV.value.tag_id],
  }

  try {
    const res = await axios.post(apiUrl.value + "/api/tag/items", query)
    tag.value = res.data.items[0] || {tags: [], values: []}
  } catch (e) {
    console.log(e)
  }
}

const getImages = async () => {
  const imageTypes = ["main", "header", 'avatar']
  for (let i of imageTypes) {
    let imgPath = path.join(
      appStore.dbPath,
      "meta",
      `${meta.value.id}`,
      `${tag.value.id}_${i}.jpg`
    )

    images.value[i] = await $operable.getLocalImage(imgPath)
  }
  upd.value = Date.now()
}

const getPinnedMedia = async () => {
  try {
    const res = await axios.get(
      apiUrl.value + `/api/MetaInMediaType?metaId=${ENV.value.meta_id}`
    )
    pinnedMedia.value = res.data || []
  } catch (e) {
    console.log(e)
  }
}

const getPinnedParentMeta = async () => {
  try {
    const res = await axios.get(apiUrl.value + "/api/PinnedMeta?pinnedMetaId=" + ENV.value.meta_id)
    let childMetas = res.data || []
    let metas = []

    for (let cm of childMetas) {
      let found = appStore.meta.find(i => i.id === cm.metaId)
      if (found) {
        metas.push(found)
      }
    }
    pinnedParentMeta.value = metas
  } catch (e) {
    console.log(e)
  }
}

const getCompletionStatus = async () => {
  let tags = []
  let values = []
  let pinned = []

  try {
    const tagsRes = await axios.get(apiUrl.value + `/api/TagsInTag?tagId=${tag.value.id}`)
    tags = tagsRes.data || []
  } catch (e) {
    console.log(e)
  }

  try {
    const valuesRes = await axios.get(apiUrl.value + `/api/ValuesInTag?tagId=${tag.value.id}`)
    values = valuesRes.data || []
  } catch (e) {
    console.log(e)
  }

  try {
    const pinnedRes = await axios.get(apiUrl.value + "/api/PinnedMeta?metaId=" + meta.value.id)
    pinned = pinnedRes.data || []
    pinnedMeta.value = pinned
  } catch (e) {
    console.log(e)
  }

  let vals = {}
  const setValByKey = (val, key) => {
    vals[key] = val
  }

  for (let i of pinned) setValByKey(null, i.pinnedMetaId)

  // parsing values and place their value into meta values
  for (let i of values) {
    let v = i.value
    let x = pinned.findIndex((j) => j.pinnedMetaId == i.metaId)
    if (x > -1) {
      let type = pinned[x].meta?.type
      if (type === "rating") {
        v = Number(v)
        if (isNaN(v)) v = 0
      } else if (type === "number") {
        // оставляем как есть
      }
    }
    setValByKey(v, i.metaId)
  }

  // parsing tags. creating array and place it into meta values
  let pi = {} // parsed tags
  for (let i of tags) {
    if (!pi[i.metaId]) pi[i.metaId] = [i.tagId]
    else pi[i.metaId].push(i.tagId)
  }
  for (let i in pi) setValByKey(pi[i], i)

  let completed = []
  for (let m of _.cloneDeep(pinned)) {
    const val = vals[m.pinnedMetaId]
    if (val === undefined || val === null) completed.push(0)
    else if (typeof val == "boolean") completed.push(1)
    else if (typeof val == "number")
      val > 0 ? completed.push(1) : completed.push(0)
    else val.length > 0 ? completed.push(1) : completed.push(0)
  }
  let completedValue = 0
  for (let i of completed) {
    completedValue = completedValue + i
  }
  completionStatus.value = Math.ceil((completedValue / completed.length) * 100)
}

// const setVal = async (val, key) => {
//   try {
//     await axios({
//       method: "put",
//       url: apiUrl.value + "/api/tag/" + tag.value.id,
//       data: {
//         [key]: val,
//       },
//     })
//   } catch (e) {
//     console.log(e)
//   }
// }

const editMetaTag = async () => {
  await getTag()
  dialogsStore.tagEditing.meta = meta.value
  dialogsStore.tagEditing.tag = tag.value
  dialogsStore.tagEditing.show = true
}

const getTagsInMedia = async () => {
  let query = {
    mediaTypeId: ENV.value.media_type_id,
    filters: _.cloneDeep(ITEMS.value.filters.filter(i => i.lock)),
    sortBy: 'createdAt',
    direction: 'asc',
    find_duplicates: false,
    ids: [],
  }

  try {
    const res = await axios.post(apiUrl.value + "/api/media/items", query)
    let medias = res.data.items
    let tags = []
    for (let i of medias) {
      tags = [...tags, ...i.tags]
    }
    tags = _.uniqBy(tags, 'tagId')
    tags = tags.map(j => j.tagId)
    tags = appStore.tags.filter(i => tags.includes(i.id))
    tags_filter.value = _.groupBy(tags, 'metaId')
  } catch (e) {
    console.log(e)
  }
}

const changeTab = async (tab_value) => {
  let item_types = ['tag', 'media']
  for (let item_type of item_types) {
    if (tab_value.includes(item_type)) {
      itemsStore.type = item_type
    }
  }

  let id = Number(tab_value.match(/\d+/g)) || null
  let metaId = itemsStore.type === 'tag' ? id : null
  let mediaTypeId = itemsStore.type === 'media' ? id : null

  itemsStore.environment.media_type_id = mediaTypeId
  itemsStore.environment.meta_id = metaId

  try {
    const filter = await $operable.createDbEntry(
      {
        name: null,
        tagId: ENV.value.tag_id,
        mediaTypeId: mediaTypeId,
        metaId: metaId,
      },
      "SavedFilter"
    )

    await $operable.createDbEntry(
      {
        filterId: filter.data[0].id,
        tagId: ENV.value.tag_id,
        mediaTypeId: mediaTypeId,
        metaId: metaId,
      },
      "PageSetting"
    )
  } catch (e) {
    console.log(e)
  }

  upd.value = Date.now()
  tab.value = tab_value
}

const openMetaPage = () => {
  router.push("/meta?metaId=" + meta.value.id)
}

// Event handlers
const handleGetTag = async () => {
  await getTag()
  await getImages()
  setTimeout(() => {
    upd_tag.value = Date.now() + '_tag'
  }, 1000)
}

const handleUpdateLayoutItems = () => {
  upd.value = Date.now()
}

// Lifecycle
onMounted(async () => {
  // Set environment from URL params
  itemsStore.environment.media_type_id = getUrlParam("mediaTypeId")
  itemsStore.environment.meta_id = getUrlParam("metaId")
  itemsStore.environment.tag_id = getUrlParam("tagId")
  itemsStore.environment.tab_id = getUrlParam("tabId")

  await init()

  eventBus.on("getTag", handleGetTag)
  eventBus.on("updateLayoutItems", handleUpdateLayoutItems)

  panel.value = [0]
})

onBeforeUnmount(() => {
  eventBus.off("updateLayoutItems")
  eventBus.off("getTag")
})

// Helper function to get URL params
const getUrlParam = (param) => {
  return route.query[param] || null
}
</script>