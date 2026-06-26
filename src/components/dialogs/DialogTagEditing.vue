<template>
  <v-dialog
    v-if="dialogsStore.tagEditing.show"
    :model-value="dialogsStore.tagEditing.show"
    @click:outside="dialogsStore.tagEditing.show = false"
    :fullscreen="xs"
    :width="xl ? 1400 : 1000"
    scrollable
  >
    <v-card>
      <DialogHeader
        @close="dialogsStore.tagEditing.show = false"
        :header="'Editing'"
        :subheader="tag?.name"
        :buttons="buttons"
        icon="pencil"
        closable
      />

      <v-card-text class="pa-2 pa-sm-4">
        <EditPinnedMetaValues
          v-if="tag"
          layout="hero"
          @close="close"
          :tag="tag"
          :meta="meta"
          ref="editingComponent"
        >
          <template #media>
            <EditDialogMediaPanel
              mode="tag"
              :images="images"
              :current-index="currentIndex"
              @update:current-index="currentIndex = $event"
              @edited="onImageEdited"
            />
          </template>
        </EditPinnedMetaValues>
      </v-card-text>
    </v-card>

    <DialogDeleteConfirm
      v-if="is_show_dialog_delete_confirm"
      :dialog="is_show_dialog_delete_confirm"
      @delete="deleteTag"
      @close="is_show_dialog_delete_confirm = false"
      text="Delete tag?"
    />
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, shallowRef} from 'vue'
import {useDisplay} from 'vuetify'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useDialogsStore} from '@/stores/dialogs'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useAppStore} from '@/stores/app'
import {useScraperStore} from "@/stores/scraper"
import {useNotificationsStore} from "@/stores/notifications"
import {apiClient} from '@/services/apiClient'
import {getLocalImage} from '@/services/fileService'
import {checkCurrentPage} from '@/services/routeService'
import path from 'path-browserify'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import EditPinnedMetaValues from '@/components/items/EditPinnedMetaValues.vue'
import EditDialogMediaPanel from '@/components/items/EditDialogMediaPanel.vue'
import {useEventBus} from "@/utils/eventBus"
import DialogDeleteConfirm from "@/components/dialogs/DialogDeleteConfirm.vue"

const {xl, xs} = useDisplay()
const router = useRouter()
const dialogsStore = useDialogsStore()
const itemsStore = useItemsStore()
const settingsStore = useSettingsStore()
const store = useAppStore()
const scraperStore = useScraperStore()
const notificationsStore = useNotificationsStore()
const eventBus = useEventBus()
const {t} = useI18n()

const images = ref([])
const buttons = ref([])
const debounceTimer = ref(null)
const is_show_dialog_delete_confirm = ref(false)
const editingComponent = ref(null)
const currentIndex = shallowRef(0)

const tag = computed(() => dialogsStore.tagEditing.tag)
const meta = computed(() => dialogsStore.tagEditing.meta)

const isTagPage = computed(() => checkCurrentPage(router.currentRoute.value, 'tag'))

const initButtons = () => {
  buttons.value = [
    {
      icon: 'delete',
      text: t('common.delete'),
      color: 'error',
      variant: 'flat',
      action: () => {
        is_show_dialog_delete_confirm.value = true
      }
    }
  ]

  if (settingsStore.showAdultContent === '1' && meta.value?.scraper) {
    buttons.value.push({
      icon: 'search-web',
      text: t('actions.scrape_info'),
      color: 'info',
      variant: 'flat',
      action: openScraper
    })
  }

  buttons.value.push({
    icon: 'content-save',
    text: t('common.save'),
    color: 'success',
    variant: 'flat',
    action: save
  })
}

const getImages = async () => {
  images.value = []
  if (!tag.value || !meta.value) return

  const imageTypes = [
    {type: 'main', aspectRatio: meta.value.imageAspectRatio || 1, width: 300},
    {type: 'alt', aspectRatio: meta.value.imageAspectRatio || 1, width: 300},
    {type: 'custom1', aspectRatio: meta.value.imageAspectRatio || 1, width: 300},
    {type: 'custom2', aspectRatio: meta.value.imageAspectRatio || 1, width: 300},
    {type: 'avatar', aspectRatio: 1, width: 164},
    {type: 'header', aspectRatio: 2.3, width: 1400}
  ]

  for (const imgType of imageTypes) {
    const fileName = `${tag.value.id}_${imgType.type}.jpg`
    const imgPath = path.join(
      store.dbPath,
      "meta",
      `${meta.value.id}`,
      `${fileName}`
    )

    try {
      const src = await getLocalImage(imgPath)
      if (src) {
        images.value.push({
          type: imgType.type,
          path: imgPath,
          src,
          aspectRatio: imgType.aspectRatio,
          width: imgType.width,
          height: Math.floor(imgType.width / imgType.aspectRatio),
          key: `${imgType.type}-${tag.value.id}`,
        })
      }
    } catch (error) {
      console.warn(`Image not found: ${imgPath}`)
    }
  }

  if (currentIndex.value >= images.value.length) {
    currentIndex.value = 0
  }
}

const onImageEdited = () => {
  getImages()
  eventBus.emit('getItemsFromDb', {
    ids: [tag.value.id],
    type: 'tag'
  })
}

const deleteTag = async () => {
  if (!tag.value || !meta.value) return

  try {
    await apiClient.post('/api/tag/deleteOne', {
      metaId: meta.value.id,
      id: tag.value.id
    })

    if (itemsStore.type === 'media') {
      eventBus.emit('getItemsFromDb', {ids: [], type: 'media'})
    }

    eventBus.emit('removeEntitiesFromState', {
      ids: [tag.value.id],
      type: 'tag'
    })

    eventBus.emit('getTags', [])

    close()

    notificationsStore.setNotification({
      type: 'info',
      title: 'The tag has been deleted',
      text: tag.value.name,
    })

    if (isTagPage.value) {
      await router.push(`/meta?metaId=${meta.value.id}`)
    }
  } catch (error) {
    console.error('Error deleting tag:', error)
  }
}

const save = () => {
  if (editingComponent.value && typeof editingComponent.value.save === 'function') {
    editingComponent.value.save();
  } else {
    console.error('Component or method not available');
  }

  if (isTagPage.value) {
    eventBus.emit('getTag')
  }

  if (itemsStore.type === 'media') {
    eventBus.emit('getTags')
    eventBus.emit('getItemsFromDb', {ids: [], type: 'media'})
  } else {
    eventBus.emit('getItemsFromDb', {ids: [tag.value.id], type: 'tag'})
  }

  dialogsStore.tagEditing.show = false
}

const close = () => {
  dialogsStore.tagEditing.show = false
}

const openScraper = () => {
  if (tag.value?.name) {
    scraperStore.query = tag.value.name
  }
  dialogsStore.scraper.show = true
}

const handleScraperImages = () => {
  getImages()
  eventBus.emit('getItemsFromDb', {ids: [tag.value.id], type: 'tag'})
}

onMounted(() => {
  if (dialogsStore.tagEditing.show && tag.value && meta.value) {
    initButtons()
    getImages()
  }

  eventBus.on('scraperGotImages', handleScraperImages)
})

onBeforeUnmount(() => {
  eventBus.off('scraperGotImages', handleScraperImages)
  clearTimeout(debounceTimer.value)
})
</script>
