<template>
  <div
    :disabled="!reg && x > 14"
    @contextmenu.stop="showContextMenu"
    @mousedown="stopSmoothScroll($event)"
    :class="[
      {favorite: is_favorite_active && item.favorite},
      {'big-preview': big_preview},
      {'item-media': type === 'media'},
      {'item-tag': type === 'tag'},
      `item__size-${itemsStore.size}`,
      `item-view-${itemsStore.view}`,
    ]"
    class="item"
  >
    <v-card
      v-if="itemsStore.view == '1' || (itemsStore.view == '2' && type === 'media')"
      class="item_wrapper"
      :color="card_color"
      variant="flat"
      :hover="true"
    >
      <div class="item_preview">
        <ItemPreviewVideo
          v-if="type === 'media' && isVideoMedia"
          @update-big-preview="(val) => big_preview = val"
          :media="item"
          :is-file-exists="is_file_exists"
        />
        <ItemPreviewImage
          v-else-if="type === 'media' && isImageMedia"
          :media="item"
          :is-file-exists="is_file_exists"
        />
        <ItemPreviewTag
          v-if="type=='tag'"
          :tag="item"
          :meta="meta"
        />

        <ItemRating
          v-if="settingsStore.ratingAndFavoriteInCard != '1' && is_rating_active"
          :item="item"
          :type="type"
        ></ItemRating>
        <ItemFavorite
          v-if="settingsStore.ratingAndFavoriteInCard != '1' && is_favorite_active"
          :item="item"
          :type="type"
        ></ItemFavorite>
        <div v-if="!reg && x > 14"
             class="reg-block"
             v-html="'App not registered'"/>
      </div>

      <v-progress-linear
        v-if="type === 'media' && isVideoMedia && item.duration"
        :value="(Number(item.time || 0) / item.duration) * 100"
      />

      <div @click="editItem"
           v-ripple="{ class: `text-primary` }"
           class="description">
        <div v-if="settingsStore.ratingAndFavoriteInCard == '1' && (is_rating_active || is_favorite_active)"
             @click.stop
             class="rating-favorite-in-description">
          <ItemRating v-if="is_rating_active"
                      :item="item"
                      :type="type"></ItemRating>
          <div v-else></div>
          <ItemFavorite v-if="is_favorite_active"
                        :item="item"
                        :type="type"></ItemFavorite>
        </div>
        <div class="item-title">
          <span v-text="item.name"
                :title="item.name"/>
        </div>
        <div
          v-if="meta?.synonyms && item.synonyms"
          class="px-1 synonyms text-medium-emphasis"
          v-html="item.synonyms"
        />

        <ItemPinnedMeta
          :item="item"
          :tags="item.tags"
          :values="item.values"
          :type="type"
        />
      </div>

      <v-icon
        v-if="item.bookmark"
        :title="item.bookmark"
        icon="mdi-bookmark"
        class="bookmark"
        color="red"
      />

      <v-btn @mouseup="showContextMenu"
             class="item-menu-btn"
             size="small"
             variant="text"
             icon>
        <v-icon size="x-large"
                icon="mdi-dots-vertical"></v-icon>
      </v-btn>
    </v-card>

    <v-chip
      v-else-if="itemsStore.view == '2' && type == 'tag'"
      @contextmenu.stop="showContextMenu"
      @mousedown="stopSmoothScroll($event)"
      @mouseover.stop="$readable.showHoverImage($event, item.metaId, item.id)"
      @mouseleave.stop="$readable.hideHoverImage"
      :variant="meta?.chipVariant"
      :color="meta?.color ? item.color || '' : ''"
      :size="getChipSize"
      class="tag-chip-view"
      rounded="pill"
    >
      <ItemPreviewTag v-if="type=='tag'"
                      :tag="item"
                      :meta="meta"></ItemPreviewTag>
      <div @click="editItem"
           class="ml-2">{{ item.name }}
      </div>
    </v-chip>

    <v-overlay
      v-if="itemsStore.isSelect"
      @click.stop="toggleSelect"
      :model-value="true"
      :scrim="is_selected ? 'primary' : '#000'"
      z-index="1"
      absolute
      contained
      class="align-center justify-center"
      style="cursor: pointer; border-radius: 14px;"
      activator="parent"
    >
      <v-btn v-if="is_selected"
             color="primary"
             variant="elevated"
             icon>
        <v-icon> mdi-check</v-icon>
      </v-btn>
    </v-overlay>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useContextMenu} from '@/stores/contextMenu'
import ItemPreviewVideo from '@/components/items/ItemPreviewVideo.vue'
import ItemPreviewImage from '@/components/items/ItemPreviewImage.vue'
import ItemPreviewTag from '@/components/items/ItemPreviewTag.vue'
import ItemPinnedMeta from '@/components/items/ItemPinnedMeta.vue'
import ItemRating from '@/components/items/ItemRating.vue'
import ItemFavorite from '@/components/items/ItemFavorite.vue'
import useItemContextMenu from '@/composable/ItemContextMenu'
import {isImageMediaType, isVideoMediaType} from '@/utils/mediaType'

const props = defineProps({
  item: Object,
  reg: Boolean,
  x: Number,
  type: String,
  meta: Object,
  mediaType: Object,
})

const emit = defineEmits([
  'getItemsFromDb',
  'getTabs',
  'parseMetadata',
  'removeEntitiesFromState',
  'getTags',
  'playVideo'
])

const itemsStore = useItemsStore()
const settingsStore = useSettingsStore()
const dialogsStore = useDialogsStore()
const contextMenuStore = useContextMenu()

const contextMenu = computed(() => contextMenuStore)

const is_file_exists = ref(false)
const big_preview = ref(false)

const isVideoMedia = computed(() => isVideoMediaType(props.mediaType))
const isImageMedia = computed(() => isImageMediaType(props.mediaType))

const is_selected = computed(() => {
  return itemsStore.selection.includes(props.item.id)
})

const card_color = computed(() => {
  const default_color = ''
  if (props.meta?.color) {
    return props.item.color ? $readable.hexToRgba(props.item.color, 9) : default_color
  } else {
    return default_color
  }
})

const is_rating_active = computed(() => {
  return props.type === 'tag' ? props.meta?.rating : true
})

const is_favorite_active = computed(() => {
  return props.type === 'tag' ? props.meta?.favorite : true
})

const getChipSize = computed(() => {
  switch (itemsStore.size) {
    case 1:
      return 'x-small'
    case 2:
      return 'small'
    case 4:
      return 'large'
    case 5:
      return 'x-large'
    default:
      return 'default'
  }
})

const stopSmoothScroll = (event) => {
  if (event.button != 1) return
  event.preventDefault()
  event.stopPropagation()
}

const editItem = () => {
  if (props.type === 'media' || props.mediaType) {
    dialogsStore.editMedia(props.item, props.mediaType)
  } else if (props.type === 'tag') {
    dialogsStore.editTag(props.item, props.meta)
  }
}

const showContextMenu = (e) => {
  e.preventDefault()

  const {getContextMenu} = useItemContextMenu(
    props.item,
    props.type,
    props.meta,
    is_file_exists.value,
    emit
  )

  const content = getContextMenu()

  const menu = {
    content: content,
    x: e.clientX,
    y: e.clientY,
    tagMeta: props.meta,
  }

  contextMenu.value.showContextMenu(menu)
}

const toggleSelect = (e) => {
  itemsStore.toggleSelect(e, props.item)
}

const checkFileExists = async () => {
  is_file_exists.value = await $operable.checkFileExists(props.item.path)
}

onMounted(() => {
  if (props.type === 'media') {
    checkFileExists()
  }
})
</script>