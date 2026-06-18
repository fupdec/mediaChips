<template>
  <div>
    <v-card
      v-for="category in tagsTop"
      :key="category.meta.id"
      class="rounded-xl mb-4"
      color="primary"
      variant="tonal"
    >
      <v-card-title class="d-flex align-center justify-space-between my-2">
        <div class="mr-2 d-flex align-center">
          <v-icon class="mr-2">mdi-{{ category.meta.icon }}</v-icon>
          <span>{{ getMetaName(category.meta, t) }}</span>
          <span>: {{ t('widgets.top_tags.top_by_views', { count: category.tags.length }) }}</span>
        </div>

        <v-btn @click="openPage(category.meta)" color="primary" flat rounded>
          {{ t('actions.open_page') }}
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col
            v-for="tag in category.tags"
            :key="tag.id"
            cols="12"
            sm="3"
            md="2"
            xl="1"
          >
            <v-card
              @click="openTagPage(category.meta, tag)"
              rounded="lg"
              variant="tonal"
              elevation="2"
              style="position: relative; z-index: 1;"
              hover
            >
              <v-img :src="tag.image"
                     :title="t('widgets.top_tags.open_tag', { name: tag.name })"
                     cover>
                <span class="widget-tags-value">{{ tag.views }}</span>
              </v-img>

              <div class="caption pa-1 text-truncate">
                {{ tag.name }}
              </div>
            </v-card>
          </v-col>

          <div
            v-if="category.isNotAllLoaded"
            class="ma-2 d-flex align-center"
          >
            <v-btn @click="getTagsTop(category)" color="primary" flat rounded>
              {{ t('widgets.top_tags.show_more', { count: 10, total: category.total - category.limit }) }}
            </v-btn>
          </div>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted} from "vue"
import {useRouter} from "vue-router"
import {useAppStore} from "@/stores/app"
import {useI18n} from 'vue-i18n'
import _orderBy from "lodash-es/orderBy"
import _groupBy from "lodash-es/groupBy"
import _cloneDeep from "lodash-es/cloneDeep"
import path from "path-browserify"
import {getMetaName} from '@/utils/metaI18n'

const store = useAppStore()
const router = useRouter()
const {t} = useI18n()

/* ------------------------ STATE ------------------------ */

const tagsTop = ref([])

/* ------------------------ COMPUTED ------------------------ */

const apiUrl = computed(() => store.localhost)
const tags = computed(() => store.tags)
const metas = computed(() => store.meta)

/* ------------------------ LOADERS ------------------------ */

async function getTagsTop(activeGroup = null) {
  if (!metas.value.length) return

  let grouped = _groupBy(tags.value, "metaId")
  let reservedCopy = _cloneDeep(grouped)
  let groups = []

  for (let metaId in grouped) {
    let limit = 10

    if (activeGroup && activeGroup.meta.id === Number(metaId)) {
      limit = activeGroup.limit + 10
    }

    const sorted = _orderBy(grouped[metaId], "views", "desc").slice(0, limit)

    const meta = store.getMetaById(Number(metaId))
    if (!meta || meta.hidden) continue

    // Load thumbnails
    for (let tag of sorted) {
      const imgPath = path.join(
        store.dbPath,
        "meta",
        `${metaId}`,
        `${tag.id}_main.jpg`
      )
      tag.image = await $operable.getLocalImage(imgPath)
    }

    groups.push({
      meta,
      tags: sorted,
      limit,
      total: reservedCopy[metaId].length,
      isNotAllLoaded: reservedCopy[metaId].length >= limit
    })
  }

  tagsTop.value = groups
}

/* ------------------------ ROUTING ------------------------ */

function openPage(meta) {
  router.push(`/meta?metaId=${meta.id}`)
}

function openTagPage(meta, tag) {
  router.push(`/tag?metaId=${meta.id}&tagId=${tag.id}&mediaTypeId=1`)
}

/* ------------------------ WATCHERS ------------------------ */

watch(tags, () => getTagsTop())
watch(metas, () => getTagsTop())

/* ------------------------ MOUNTED ------------------------ */

onMounted(() => {
  window.dispatchEvent(new CustomEvent("getTags"))
  getTagsTop()
})
</script>

<style lang="scss">
.widget-tags-value {
  position: absolute;
  left: 5px;
  top: 5px;
  background: #d2d2d2b8;
  color: #000;
  line-height: 1;
  padding: 2px;
  font-size: 13px;
  border-radius: 10px;
}
</style>
