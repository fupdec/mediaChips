<template>
  <div>
    <!-- GRID VIEW -->
    <div v-if="Number(ITEMS.view) === 1">
      <v-img
        :src="images.main || undefined"
        :aspect-ratio="meta?.imageAspectRatio"
        class="main-img"
        :class="{ static: images.alt }"
        cover
        @click="openTagPage"
      />

      <v-img
        v-if="images.alt"
        :src="images.alt"
        :aspect-ratio="meta?.imageAspectRatio"
        class="secondary-img"
        cover
        @click="openTagPage"
      />

      <div v-if="images.custom1" class="custom1-img-button">1</div>
      <v-img
        v-if="images.custom1"
        :src="images.custom1"
        class="custom1-img"
        cover
      />

      <div v-if="images.custom2" class="custom2-img-button">2</div>
      <v-img
        v-if="images.custom2"
        :src="images.custom2"
        class="custom2-img"
        cover
      />

      <div v-if="meta?.country" class="country">
        <div
          v-for="i in countries"
          :key="i"
          class="flag-icon mb-1"
        >
          <country-flag
            :country="getFlag(i)"
            size="normal"
            :title="i"
          />
        </div>
      </div>
    </div>

    <!-- CHIP VIEW -->
    <v-avatar
      v-else-if="Number(ITEMS.view) === 2"
      :rounded="meta?.chipLabel ? 'lg' : false"
      @click="openTagPage"
    >
      <v-img :src="avatar || undefined" cover />
    </v-avatar>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import CountryFlag from 'vue-country-flag-next'
import { parseCountries, getCountryCode } from '@/utils/country'
import path from 'path-browserify'

import { useAppStore } from '@/stores/app'
import { useItemsStore } from '@/stores/items'
import {getDefaultMediaTypeId} from '@/utils/mediaType'
import {getLocalImage} from '@/services/fileService'
import {hideHoverImage} from '@/services/hoverService'
import type {Meta, Tag} from '@/types/stores'

type TagImageType = 'main' | 'alt' | 'custom1' | 'custom2' | 'avatar'

const props = withDefaults(defineProps<{
  tag: Tag
  meta: Meta
  upd?: number[]
}>(), {
  upd: () => [],
})

const appStore = useAppStore()
const itemsStore = useItemsStore()
const router = useRouter()

const images = reactive<Record<TagImageType, string | null>>({
  main: null,
  alt: null,
  custom1: null,
  custom2: null,
  avatar: null,
})

const ITEMS = computed(() => itemsStore)

const countries = computed(() =>
  parseCountries(typeof props.tag.country === 'string' ? props.tag.country : undefined)
)

const avatar = computed(() =>
  images.avatar || images.main
)

const getImages = async () => {
  let imageTypes: TagImageType[] = ['main', 'alt', 'custom1', 'custom2']

  if (Number(ITEMS.value.view) === 2) {
    imageTypes = ['avatar', 'main']
  }

  for (const type of imageTypes) {
    const imgPath = path.join(
      appStore.dbPath,
      'meta',
      String(props.meta.id),
      `${props.tag.id}_${type}.jpg`
    )

    const src = await getLocalImage(imgPath)

    if (type !== 'main' && src.includes('unavailable.png')) {
      images[type] = null
    } else {
      images[type] = src
    }
  }
}

const openTagPage = () => {
  router.push({
    path: '/tag',
    query: {
      metaId: props.meta.id,
      tagId: props.tag.id,
      mediaTypeId: getDefaultMediaTypeId(appStore.mediaTypes),
    },
  })
  hideHoverImage()
}

const getFlag = (name: string) => getCountryCode(name)

onMounted(getImages)

watch(
  () => props.upd,
  (arr) => {
    if (arr.includes(props.tag.id)) {
      getImages()
    }
  }
)
</script>
