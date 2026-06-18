<template>
  <v-dialog
    v-if="dialogsStore.mediaEditing.show"
    :model-value="dialogsStore.mediaEditing.show"
    @click:outside="dialogsStore.mediaEditing.show = false"
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
              mode="media"
              :image-src="thumb"
              :image-path="imgPath"
              :cropper-options="cropperOps"
              :min-width="500"
              @edited="onImageEdited"
            />
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
const fileName = computed(() => {
  const path = props.media?.path || ''
  return path.split('/').pop() || ''
})

function initButtons() {
  buttons.value.push({
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
  })
}

async function getImage() {
  imgPath.value = path.join(appStore.mediaPath, 'videos/thumbs', `${props.media.id}.jpg`)
  thumb.value = await $operable.getLocalImage(imgPath.value)
}

async function onImageEdited() {
  await getImage()
  eventBus.emit('getItemsFromDb', {
    ids: [props.media.id],
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
          type: "videos",
          id: props.media.id,
          with_file: is_checked,
          path: props.media.path,
        },
      })

      eventBus.emit('removeEntitiesFromState', {
        detail: {
          ids: [props.media.id],
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
