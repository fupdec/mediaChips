<template>
  <div>
    <v-dialog
      v-model="dialogModel"
      :fullscreen="xs"
      max-width="600"
      scrollable
    >
      <v-card>
        <DialogHeader
          :header="t('filters.saved_filters')"
          closable
          @close="close"
        />

        <v-card-text class="pa-4 pb-0">
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            rounded="xl"
            class="mb-4 text-caption"
          >
            {{ t('filters.saved_filters_load_hint') }}
          </v-alert>

          <SavedFiltersList
            :filters="savedFilters"
            selectable
            editable
            deletable
            @apply="apply"
            @edit="openDialogEditing"
            @delete="openDialogDelete"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEditing" max-width="600" scrollable>
      <v-card>
        <DialogHeader
          :header="t('filters.editing_filter_name')"
          closable
          :buttons="editButtons"
          @close="dialogEditing = false"
        />

        <v-card-text class="text-center py-4 px-2 px-sm-4">
          <v-form
            ref="formRef"
            v-model="validName"
            @submit.prevent
          >
            <v-text-field
              v-model="filterName"
              :label="t('filters.filter_name')"
              :rules="[v => $readable.validateName(v) || t('validation.name_required')]"
              autofocus
              variant="filled"
            />
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <DialogDeleteConfirm
      v-if="dialogDel"
      :dialog="dialogDel"
      :text="t('filters.delete_saved_filter_confirm')"
      @close="dialogDel = false"
      @delete="deleteSavedFilter"
    />
  </div>
</template>

<script setup>
import {ref, computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'
import axios from 'axios'

import DialogHeader from '@/components/elements/DialogHeader.vue'
import DialogDeleteConfirm from '@/components/dialogs/DialogDeleteConfirm.vue'
import SavedFiltersList from '@/components/elements/SavedFiltersList.vue'

import {useItemsStore} from '@/stores/items'
import {useAppStore} from '@/stores/app'

const props = defineProps({
  dialog: Boolean,
})

const emit = defineEmits(['close', 'apply'])

const itemsStore = useItemsStore()
const appStore = useAppStore()
const {t} = useI18n()
const {xs} = useDisplay()

const dialogModel = computed({
  get: () => props.dialog,
  set: () => close(),
})

const dialogDel = ref(false)
const dialogEditing = ref(false)
const selected = ref(null)

const validName = ref(true)
const filterName = ref('')
const formRef = ref(null)

const savedFilters = computed(() => itemsStore.filters_saved)
const apiUrl = computed(() => appStore.localhost)

const close = () => emit('close')

const openDialogDelete = (filter) => {
  selected.value = filter
  dialogDel.value = true
}

const deleteSavedFilter = async () => {
  const savedFilter = selected.value
  if (!savedFilter) return

  await axios.delete(`${apiUrl.value}/api/SavedFilter/${savedFilter.id}`)

  for (const row of savedFilter.filters) {
    await axios.delete(`${apiUrl.value}/api/FilterRow/${row.id}`)
  }

  await $operable.getSavedFilters()
  dialogDel.value = false
}

const openDialogEditing = (filter) => {
  selected.value = filter
  filterName.value = filter.name
  dialogEditing.value = true
}

const updateFilterName = async () => {
  await formRef.value?.validate()
  if (!validName.value) return

  const savedFilter = selected.value

  await axios.put(
    `${apiUrl.value}/api/SavedFilter/${savedFilter.id}`,
    {name: filterName.value},
  )
    .then(() => {
      dialogEditing.value = false
      $operable.getSavedFilters()
    })
    .catch((e) => {
      dialogEditing.value = false
      console.log(e)
    })
}

const apply = (savedFilter) => {
  const filters = savedFilter.filters.map((f) => ({
    ...f,
    id: null,
  }))
  emit('apply', filters)
}

const editButtons = computed(() => [
  {
    icon: 'content-save',
    text: t('common.save'),
    color: 'success',
    action: updateFilterName,
  },
])
</script>
