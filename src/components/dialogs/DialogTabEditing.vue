<template>
  <v-dialog v-model="dialog.show" scrollable width="600">
    <v-card>
      <DialogHeader
        @close="closeDialog"
        header="Editing tab"
        :buttons="buttons"
        icon="tab"
        closable
      />

      <v-card-text class="pa-sm-4 pa-2">
        <v-form ref="form" v-model="valid" @submit.prevent="save">
          <v-text-field
            v-model="tabName"
            :rules="nameRules"
            label="Name"
            required
            autofocus
          />
        </v-form>

        <DialogIcons
          :icon="icon"
          @apply="changeIcon"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed, watch, defineAsyncComponent} from 'vue'
import {apiClient} from '@/services/apiClient'
import {useAppStore} from '@/stores/app'
import {useDialogsStore} from '@/stores/dialogs'
import {useEventBus} from "@/utils/eventBus"

import DialogHeader from "@/components/elements/DialogHeader.vue"

const DialogIcons = defineAsyncComponent(() => import("@/components/dialogs/DialogIcons.vue"))

const appStore = useAppStore()
const dialogsStore = useDialogsStore()
const eventBus = useEventBus()

const valid = ref(false)
const dialogIcons = ref(false)
const tabName = ref('')
const icon = ref('')
const form = ref(null)

const buttons = ref([{
  icon: "content-save",
  text: "Save",
  color: "success",
  variant: "flat",
  action: () => {
    save()
  },
}])

// Computed properties
const dialog = computed({
  get() {
    return dialogsStore.tabEditing
  },
  set(value) {
    dialogsStore.tabEditing = value
  }
})

const nameRules = [
  (v) => !!v || 'Name is required',
  (v) => validateName(v) || 'Invalid name format'
]

// Methods
const changeIcon = (newIcon) => {
  dialogIcons.value = false
  icon.value = newIcon
}

const save = async () => {
  if (!form.value) return

  const {valid: formValid} = await form.value.validate()
  if (!formValid) return

  if (!dialog.value.tab?.id) {
    console.error('No tab ID found')
    return
  }

  try {
    await apiClient.put(`/api/tab/${dialog.value.tab.id}`, {
      name: tabName.value,
      icon: icon.value,
    })

    eventBus.emit('getTabs')
  } catch (error) {
    console.error('Error saving tab:', error)
  }

  closeDialog()
}

const closeDialog = () => {
  dialogsStore.tabEditing.show = false
  dialogsStore.tabEditing.tab = null
  tabName.value = ''
  icon.value = ''
}

const validateName = (string) => {
  // Замените на вашу реализацию $validateName
  if (!string) return false
  return string.length >= 1 && string.length <= 100
}

// Watchers
watch(() => dialog.value.tab, (val) => {
  if (!val) return

  console.log('Editing tab:', val)
  icon.value = val.icon || ''
  tabName.value = val.name || ''
}, {immediate: true})

// Для очистки при закрытии диалога
watch(() => dialog.value.show, (show) => {
  if (!show) {
    tabName.value = ''
    icon.value = ''
  }
})
</script>