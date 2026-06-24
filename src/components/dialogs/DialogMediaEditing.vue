<template>
  <v-dialog
    v-model="dialogsStore.mediaEditing.show"
    :fullscreen="xs"
    :width="xl ? 1400 : 1000"
    scrollable
  >
    <v-card>
      <DialogHeader
        @close="dialogsStore.mediaEditing.show = false"
        :header="t('common.editing')"
        :subheader="fileName"
        :buttons="buttons"
        icon="pencil"
        closable
      />

      <v-card-text class="pa-2 pa-sm-4">
        <EditPinnedMetaValues
          v-if="media"
          layout="hero"
          @close="dialogsStore.mediaEditing.show = false"
          :media="media"
          ref="editingComponent"
        >
          <template #media>
            <EditDialogMediaPanel
              v-if="!isAudioMedia"
              mode="media"
              :image-src="thumb"
              :image-path="imgPath"
              :cropper-options="cropperOps"
              :min-width="500"
              @edited="onImageEdited"
            />
            <v-sheet
              v-else
              color="grey-darken-3"
              rounded="lg"
              class="d-flex align-center justify-center"
              min-height="240"
            >
              <v-icon size="72" color="grey">mdi-music</v-icon>
            </v-sheet>
          </template>
        </EditPinnedMetaValues>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted, defineAsyncComponent} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'
import {useAppStore} from '@/stores/app'
import {useDialogsStore} from '@/stores/dialogs'
import {useItemsStore} from '@/stores/items'
import axios from 'axios'
import EditPinnedMetaValues from "@/components/items/EditPinnedMetaValues.vue"
import EditDialogMediaPanel from "@/components/items/EditDialogMediaPanel.vue"
import {useEventBus} from "@/utils/eventBus"
import path from 'path-browserify'
import {
  getCurrentMediaType,
  getMediaDeleteAssetFolder,
  isAudioMediaType,
  isImageMediaType,
} from '@/utils/mediaType'

const DialogHeader = defineAsyncComponent(() => import("@/components/elements/DialogHeader.vue"))

const props = defineProps({
  dialog: Boolean,
  media: Object,
  mediaType: Object,
})

const {xs, xl} = useDisplay()
const eventBus = useEventBus()
const appStore = useAppStore()
const dialogsStore = useDialogsStore()
const itemsStore = useItemsStore()
const {t} = useI18n()
const thumb = ref(null)
const imgPath = ref(null)
const buttons = ref([])
const editingComponent = ref(null)
const cropperOps = ref({
  aspectRatio: 16 / 9,
})

const apiUrl = computed(() => appStore.localhost)

const media = computed(() => props.media || dialogsStore.mediaEditing.media)

const fileName = computed(() => {
  const filePath = media.value?.path || ''
  return filePath.split('/').pop() || ''
})

const currentMediaType = computed(() =>
  getCurrentMediaType(
    appStore.mediaTypes,
    media.value?.mediaTypeId || itemsStore.environment?.media_type_id
  )
)

const isAudioMedia = computed(() => isAudioMediaType(currentMediaType.value))

function initButtons() {
  buttons.value = [{
    icon: "delete",
    text: t('common.delete'),
    color: "error",
    outlined: false,
    action: deleteMedia,
  }, {
    icon: "content-save",
    text: t('common.save'),
    color: "success",
    outlined: false,
    action: save,
  }]
}

async function getImage() {
  const currentMedia = media.value
  if (!currentMedia?.id) return

  const mediaType = getCurrentMediaType(
    appStore.mediaTypes,
    currentMedia.mediaTypeId || itemsStore.environment?.media_type_id
  )

  if (isImageMediaType(mediaType)) {
    imgPath.value = path.join(appStore.mediaPath, 'images/thumbs', `${currentMedia.id}.jpg`)
    thumb.value = await $operable.getLocalImage(imgPath.value)

    if (thumb.value.includes('unavailable.png') && currentMedia.path) {
      thumb.value = await $operable.getLocalImage(currentMedia.path, true)
    }

    const width = Number(currentMedia.width) || 1
    const height = Number(currentMedia.height) || 1
    cropperOps.value = {aspectRatio: width / height}
    return
  }

  if (isAudioMediaType(mediaType)) {
    imgPath.value = null
    thumb.value = null
    return
  }

  imgPath.value = path.join(appStore.mediaPath, 'videos/thumbs', `${currentMedia.id}.jpg`)
  thumb.value = await $operable.getLocalImage(imgPath.value)
  cropperOps.value = {aspectRatio: 16 / 9}
}

async function onImageEdited() {
  await getImage()
  eventBus.emit('getItemsFromDb', {
    ids: [media.value.id],
    type: 'media'
  })
}

function save() {
  if (editingComponent.value && typeof editingComponent.value.save === 'function') {
    editingComponent.value.save();
  } else {
    console.error('Component or method not available');
  }

  if (itemsStore.type === 'media') {
    eventBus.emit('getTags')
    eventBus.emit('getItemsFromDb', {ids: [], type: 'media'})
  }

  dialogsStore.mediaEditing.show = false
}

function deleteMedia() {
  if (dialogsStore?.confirm) {
    dialogsStore.confirm.show = true
    dialogsStore.confirm.checkBoxText = t('actions.also_delete_files')
    dialogsStore.confirm.text = t('media.delete_from_app_confirm')
    dialogsStore.confirm.action = async () => {
      const is_checked = dialogsStore.confirm.checkBox
      await axios({
        method: "post",
        url: apiUrl.value + "/api/media/deleteOne",
        data: {
          type: getMediaDeleteAssetFolder(currentMediaType.value),
          id: media.value.id,
          with_file: is_checked,
          path: media.value.path,
        },
      })

      eventBus.emit('removeEntitiesFromState', {
        detail: {
          ids: [media.value.id],
          type: 'media',
        }
      })

      close()
    }
  }
}

function close() {
  dialogsStore.mediaEditing.show = false
}

onMounted(() => {
  initButtons()
  getImage()
})
</script>
