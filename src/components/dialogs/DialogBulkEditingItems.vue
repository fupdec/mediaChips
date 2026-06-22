<template>
  <v-dialog
    v-if="dialog"
    v-model="dialog"
    :fullscreen="xs"
    :width="xl ? 1500 : 900"
    scrollable
  >
    <v-card>
      <DialogHeader
        @close="close"
        :header="t('bulk_editing.title')"
        :buttons="pinned.length ? buttons : []"
        icon="pencil-plus"
        closable
      />

      <v-card-text class="pa-2 pa-sm-4">
        <v-alert
          v-if="itemsStore.selection.length"
          type="info"
          class="text-caption mb-4"
          variant="tonal"
          density="compact"
          rounded="xl"
        >
          {{ t('bulk_editing.selected_count', { count: itemsStore.selection.length }) }}
        </v-alert>

        <v-alert
          v-if="saving"
          type="warning"
          class="text-caption mb-4"
          variant="tonal"
          density="compact"
          rounded="xl"
        >
          {{ t('bulk_editing.saving') }}
        </v-alert>

        <v-alert v-if="pinned.length" type="info" class="text-caption mb-4" variant="tonal" density="compact" rounded="xl" closable>
          <span>{{ t('bulk_editing.mode_hint') }}<br>{{ t('bulk_editing.processing_hint') }}<br>
            <v-icon icon="mdi-cancel" color="info" size="small" class="mr-1"/> {{ t('bulk_editing.mode_keep') }} <br>
            <v-icon icon="mdi-close-circle-outline" color="error" size="small" class="mr-1"/> {{ t('bulk_editing.mode_delete') }} <br>
            <v-icon icon="mdi-reload-alert" color="warning" size="small" class="mr-1"/> {{ t('bulk_editing.mode_replace') }} <br>
            <v-icon icon="mdi-plus-circle-outline" color="success" size="small" class="mr-1"/> {{ t('bulk_editing.mode_add') }} <br>
          </span>
        </v-alert>

        <v-alert v-else type="warning" class="text-caption mb-4" variant="tonal" density="compact" rounded="xl">
          <v-row align="center">
            <v-col class="grow">
              {{ t('bulk_editing.no_meta_assigned', { type: itemsStore.type }) }} <br>
              {{ t('bulk_editing.assign_in_settings') }}
            </v-col>
            <v-col class="shrink d-flex justify-end">
              <button-documentation id="meta.assign"></button-documentation>
            </v-col>
          </v-row>
        </v-alert>

        <v-row v-if="pinned.length">
          <v-col
            v-for="m in pinned"
            :key="m.id"
            cols="12" md="6" xl="4"
          >
            <v-card class="rounded-xl d-flex align-center pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <v-btn @click="toggleEditMode(m)" :key="`${m.id}_${key}`" size="small" variant="text" icon class="btn-toggle-mode">
                <v-tooltip v-if="edits[m.id]===1" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-close-circle-outline" size="20" color="error"/>
                  </template>
                  <span>{{ t('common.remove') }}</span>
                </v-tooltip>
                <v-tooltip v-else-if="edits[m.id]===2" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-reload-alert" size="20" color="warning"/>
                  </template>
                  <span>{{ t('bulk_editing.replace') }}</span>
                </v-tooltip>
                <v-tooltip v-else-if="edits[m.id]===3" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-plus-circle-outline" size="20" color="success"/>
                  </template>
                  <span>{{ t('common.add') }}</span>
                </v-tooltip>
                <v-tooltip v-else location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-cancel" size="18" color="info"/>
                  </template>
                  <span>{{ t('bulk_editing.no_action') }}</span>
                </v-tooltip>
              </v-btn>

              <MetaInputArray
                v-if="m.type === 'array'"
                @update:model-value="setVal($event, m.id)"
                :model-value="values[m.id]"
                :meta-id="m.id"
                :disabled="edits[m.id] === 0 || edits[m.id] === 1"
              />

              <v-text-field
                v-if="m.type === 'number'"
                v-model="values[m.id]"
                :label="m.name"
                :hint="m.hint"
                :prepend-icon="showIcons ? `mdi-${m.icon}` : ''"
                :disabled="edits[m.id] === 0 || edits[m.id] === 1"
                type="number"
                persistent-hint
                clearable
              />

              <v-text-field
                v-if="m.type === 'string'"
                v-model="values[m.id]"
                :label="m.name"
                :hint="m.hint"
                :prepend-icon="showIcons ? `mdi-${m.icon}` : ''"
                :disabled="edits[m.id] === 0 || edits[m.id] === 1"
                persistent-hint
                clearable
              />

              <v-checkbox
                v-if="m.type === 'boolean'"
                v-model="values[m.id]"
                :label="m.name"
                :hint="m.hint"
                :prepend-icon="showIcons ? `mdi-${m.icon}` : ''"
                :disabled="edits[m.id] === 0 || edits[m.id] === 1"
                persistent-hint
              />

              <v-text-field
                v-if="m.type === 'date'"
                @click="pickDate(m.id)"
                :model-value="values[m.id]"
                :label="m.name"
                :hint="m.hint"
                :prepend-icon="showIcons ? `mdi-${m.icon}` : ''"
                :disabled="edits[m.id] === 0 || edits[m.id] === 1"
                persistent-hint
                readonly
                clearable
              />

              <div v-if="m.type === 'rating'" class="d-flex flex-column">
                <div
                  class="text-medium-emphasis text-caption"
                  :class="[{ 'pl-9': showIcons }]"
                >
                  {{ m.name }}
                </div>
                <div class="d-flex">
                  <v-icon v-if="showIcons" :icon="`mdi-${m.icon}`" class="mr-2"/>
                  <v-rating
                    v-model="values[m.id]"
                    :length="m.ratingMax"
                    :full-icon="`mdi-${m.ratingIcon}`"
                    :empty-icon="`mdi-${m.ratingIconEmpty || m.ratingIcon}`"
                    :half-increments="m.ratingHalf"
                    :half-icon="`mdi-${m.ratingIconHalf || m.ratingIcon}`"
                    :color="m.ratingColor"
                    :readonly="edits[m.id] === 0 || edits[m.id] === 1"
                    background-color="grey"
                    density="compact"
                    clearable
                    hover
                  />
                </div>
                <div
                  class="text-medium-emphasis text-caption"
                  :class="[{ 'pl-9': showIcons }]"
                >
                  {{ m.hint }}
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-dialog v-model="datePicker.dialog" width="290">
      <v-date-picker
        @update:model-value="setDate"
        :model-value="datePicker.value"
        color="primary"
        rounded="xl"
      />
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'
import dayjs from 'dayjs'
import axios from 'axios'
import DialogHeader from "@/components/elements/DialogHeader.vue"
import MetaInputArray from "@/components/meta/input/MetaInputArray.vue"
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useDialogsStore} from '@/stores/dialogs'
import {useSettingsStore} from '@/stores/settings'
import {useEventBus} from '@/utils/eventBus'
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue"
import {shouldReloadListAfterBulkAction} from '@/utils/resolveSelection'

const {xs, xl} = useDisplay()
const appStore = useAppStore()
const itemsStore = useItemsStore()
const dialogsStore = useDialogsStore()
const settingsStore = useSettingsStore()
const eventBus = useEventBus()
const {t} = useI18n()

// Reactive state
const dialog = ref(true)
const buttons = ref([])
const values = ref({})
const edits = ref({})
const key = ref(Date.now())
const saving = ref(false)
const datePicker = ref({
  dialog: false,
  metaId: null,
  value: null,
})

// Computed properties
const pinned = computed(() => {
  return itemsStore.assigned?.map(i => i.meta) || []
})

const showIcons = computed(() => {
  return settingsStore.showIconsOfMetaInEditingDialog == 1
})

// Methods
const initButtons = () => {
  buttons.value = [{
    icon: "content-save",
    text: "Save",
    color: "success",
    variant: "flat",
    action: save,
  }]
}

const initValues = () => {
  for (let meta of pinned.value) {
    edits.value[meta.id] = 0

    // Initialize default values based on type
    if (meta.type === 'array') {
      values.value[meta.id] = []
    } else if (meta.type === 'boolean') {
      values.value[meta.id] = false
    } else if (meta.type === 'number' || meta.type === 'rating') {
      values.value[meta.id] = 0
    } else {
      values.value[meta.id] = null
    }
  }
}

const close = () => {
  dialog.value = false
  dialogsStore.bulkEditingItems = false
}

const save = async () => {
  const items_type = itemsStore.type
  const selected_items_ids = itemsStore.selection

  if (!selected_items_ids.length || saving.value) return

  const changes = pinned.value
    .map((meta) => ({
      metaId: meta.id,
      editType: edits.value[meta.id] || 0,
      metaType: meta.type,
      value: values.value[meta.id],
    }))
    .filter((change) => change.editType > 0)

  if (!changes.length) {
    close()
    return
  }

  saving.value = true

  try {
    await axios.post(`${appStore.localhost}/api/bulk-meta/apply`, {
      itemType: items_type,
      itemIds: selected_items_ids,
      changes,
    })

    close()

    const reloadList = shouldReloadListAfterBulkAction(selected_items_ids)
    eventBus.emit('getItemsFromDb', reloadList
      ? {type: items_type}
      : {ids: selected_items_ids, type: items_type})

    itemsStore.selection = []
    itemsStore.selected_last = null
    itemsStore.isSelect = false
  } catch (error) {
    console.error('Error saving bulk edits:', error)
  } finally {
    saving.value = false
  }
}

const toggleEditMode = (meta) => {
  // 0 - ничего, 1 - удалить, 2 - удалить, 3 - добавить (только для массивов)
  edits.value[meta.id] = (edits.value[meta.id] || 0) + 1

  if (edits.value[meta.id] > 2 && meta.type !== 'array') {
    edits.value[meta.id] = 0
  } else if (edits.value[meta.id] > 3 && meta.type === 'array') {
    edits.value[meta.id] = 0
  }

  key.value = Date.now()
}

const setVal = (val, key) => {
  values.value[key] = val
}

const pickDate = (metaId) => {
  datePicker.value.dialog = true
  datePicker.value.value = values.value[metaId]
  datePicker.value.metaId = metaId
}

const setDate = (date) => {
  datePicker.value.dialog = false
  if (datePicker.value.metaId !== null) {
    values.value[datePicker.value.metaId] = dayjs(date).format('YYYY-MM-DD')
  }
}

// Lifecycle
onMounted(() => {
  initButtons()
  initValues()
})

// Watch for dialog state changes from store
watch(() => dialogsStore.bulkEditingItems, (newValue) => {
  if (!newValue && dialog.value) {
    close()
  }
})
</script>

<style scoped>
.btn-toggle-mode {
  position: absolute;
  top: 0;
  left: 0;
}
</style>