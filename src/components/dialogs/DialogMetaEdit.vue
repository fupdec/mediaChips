<template>
  <div>
    <v-dialog
      v-if="dialog"
      v-model="internalDialog"
      :fullscreen="xs"
      scrollable
      width="600"
      @after-leave="resetDialog"
    >
      <v-card>
        <DialogHeader
          @close="closeDialog"
          header="Editing meta"
          :buttons="buttons"
          closable
        />

        <v-card-title primary-title class="d-flex justify-space-between">
          <div>
            <v-icon start>{{ `mdi-${meta.icon}` }}</v-icon>
            {{ meta.name }}
          </div>
          <ChipMetaType :meta="meta"></ChipMetaType>
        </v-card-title>

        <v-card-text>
          <v-form
            v-model="valid"
            ref="form"
            class="flex-grow-1"
            @submit.prevent
          >
            <v-text-field v-model="name" :rules="[nameRules]" label="Name"/>
            <v-text-field
              v-model="metaHint"
              label="Hint"
              hint="This text under the field is the hint"
              persistent-hint
            />

            <DialogIcons
              :icon="metaIcon"
              @apply="changeIcon"
            ></DialogIcons>
          </v-form>

          <!-- Rating settings -->
          <MetaSettingsRating
            v-if="meta.type === 'rating'"
            @update="updateRating"
            :meta="meta"
          />

          <!-- Link checkbox for string type -->
          <v-checkbox
            v-if="meta.type === 'string'"
            v-model="isLink"
            label="Link to an Internet address"
            hide-details
            class="mt-4"
          />

          <!-- Array settings -->
          <MetaSettingsArray
            v-if="meta.type === 'array'"
            @update="updateSettingsArray"
            :meta="meta"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <DialogDeleteConfirm
      v-if="dialogDeleteMeta"
      v-model="dialogDeleteMeta"
      @delete="deleteMeta"
      @close="dialogDeleteMeta=false"
      :text="textDialogDelete"
    />
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watch, nextTick} from 'vue'
import {useDisplay} from 'vuetify'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useEventBus} from '@/utils/eventBus'
import {useAppStore} from '@/stores/app'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import ChipMetaType from '@/components/elements/ChipMetaType.vue'
import DialogIcons from '@/components/dialogs/DialogIcons.vue'
import DialogDeleteConfirm from '@/components/dialogs/DialogDeleteConfirm.vue'
import MetaSettingsArray from '@/components/dialogs/meta/MetaSettingsArray.vue'
import MetaSettingsRating from '@/components/dialogs/meta/MetaSettingsRating.vue'
import {apiClient} from '@/services/apiClient'
import {setNotification} from '@/services/notificationService'

// Props
const props = defineProps({
  dialog: {
    type: Boolean,
    default: false
  },
  meta: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:model-value', 'update', 'delete', 'close'])

// Stores
const appStore = useAppStore()
const {xs} = useDisplay()
const route = useRoute()
const eventBus = useEventBus()
const {t} = useI18n()

// Refs
const form = ref(null)
const internalDialog = ref(false)
const dialogIcons = ref(false)
const dialogDeleteMeta = ref(false)
const valid = ref(false)

// Form fields
const name = ref('')
const singular = ref('')
const metaHint = ref('')
const metaIcon = ref('shape')
const isLink = ref(false)

// Settings
const rating = ref({})
const settingsArray = ref({})

// Buttons for DialogHeader
const buttons = ref([])

// Computed
const textDialogDelete = computed(() => {
  let text = `${t('meta.dialogs.delete_meta_assigned_confirm')}\n`
  if (props.meta.type === 'array') {
    text += `${t('meta.dialogs.delete_meta_tags_confirm')}\n`
  }
  text += t('common.are_you_sure')
  return text
})

// Methods
const initButtons = () => {
  buttons.value = [
    {
      icon: 'delete',
      text: t('common.delete'),
      color: 'error',
      variant: 'flat',
      action: () => {
        dialogDeleteMeta.value = true
      }
    },
    {
      icon: 'check',
      text: t('common.apply'),
      color: 'success',
      variant: 'flat',
      action: applyChanges
    }
  ]
}

const initMeta = () => {
  if (!props.meta) return

  name.value = props.meta.name || ''
  singular.value = props.meta.nameSingular || props.meta.name || ''
  metaHint.value = props.meta.hint || ''
  metaIcon.value = props.meta.icon || 'shape'
}

const changeIcon = (icon) => {
  dialogIcons.value = false
  metaIcon.value = icon
}

const nameRules = (value) => {
  if (!value || value.trim().length === 0) {
    return 'Name is required'
  }
  if (value.length < 2) {
    return 'Name must be at least 2 characters'
  }
  if (value.length > 100) {
    return 'Name must be less than 100 characters'
  }
  return true
}

const applyChanges = async () => {
  if (!form.value) return

  const {valid: formValid} = await form.value.validate()
  if (!formValid) return

  try {
    const metaData = {
      name: name.value,
      nameSingular: singular.value || name.value,
      hint: metaHint.value,
      icon: metaIcon.value,
      ...settingsArray.value,
      ...rating.value,
      ...{isLink: isLink.value}
    }

    await apiClient.put(`/api/Meta/${props.meta.id}`, metaData)

    setNotification({
      type: 'success',
      title: `Meta "${name.value}" updated successfully`
    })

    // Emit update event
    emit('update', props.meta.type)

    // Update meta list if array type
    if (props.meta.type === 'array') {
      eventBus.emit('getMeta')

      // If on meta page, trigger update
      if (route.path === '/meta') {
        eventBus.emit('updatePage')
      }
    }

    closeDialog()
  } catch (error) {
    console.error('Error updating meta:', error)

    let errorMessage = 'Failed to update meta'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    setNotification({
      type: 'error',
      text: errorMessage
    })
  }
}

const getSettings = async () => {
  try {
    const response = await apiClient.get(`/api/MetaSetting/${props.meta.id}`)
    const settings = response.data
    isLink.value = settings.isLink || false
  } catch (error) {
    console.error('Error fetching meta settings:', error)
  }
}

const updateRating = (ratingData) => {
  rating.value = ratingData
}

const updateSettingsArray = (settings) => {
  settingsArray.value = settings
}

const closeDialog = () => {
  internalDialog.value = false
  emit('close')
}

const deleteMeta = () => {
  dialogDeleteMeta.value = false
  emit('delete', props.meta)
}

const resetDialog = () => {
  // Reset form fields
  name.value = ''
  singular.value = ''
  metaHint.value = ''
  metaIcon.value = 'shape'
  isLink.value = false
  rating.value = {}
  settingsArray.value = {}
  valid.value = false

  // Reset form validation
  if (form.value) {
    form.value.reset()
    form.value.resetValidation()
  }
  closeDialog()
}

// Lifecycle
onMounted(() => {
  initButtons()
})

// Watchers
watch(() => props.dialog, (newVal) => {
  internalDialog.value = newVal

  if (newVal && props.meta) {
    nextTick(() => {
      initMeta()
      getSettings()
    })
  }
})

watch(() => props.meta, () => {
  if (internalDialog.value && props.meta) {
    initMeta()
    getSettings()
  }
})

watch(internalDialog, (newVal) => {
  emit('update:model-value', newVal)
})

// Expose methods if needed
defineExpose({
  applyChanges,
  closeDialog
})
</script>
