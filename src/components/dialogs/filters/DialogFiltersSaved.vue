<template>
  <div>
    <!-- MAIN DIALOG -->
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
          <div v-if="savedFilters.length">
            <v-card
              v-for="filter in savedFilters"
              :key="filter.id"
              class="mb-4 pa-2 saved-filter"
              variant="tonal"
              color="primary"
              rounded="xl"
              hover
              @click="apply(filter)"
            >
              <div class="pa-1 mb-2 d-flex justify-space-between flex-wrap">
                <v-btn
                  variant="text"
                  rounded="xl"
                  size="small"
                  class="pr-4"
                  @click.stop="openDialogEditing(filter)"
                >
                  <v-icon start size="16">mdi-pencil</v-icon>
                  <span class="text-body-1">{{ filter.name }}</span>
                </v-btn>

                <v-spacer />

                <v-btn
                  variant="text"
                  rounded="xl"
                  color="error"
                  size="small"
                  class="pr-4 saved-filter_delete"
                  @click.stop="openDialogDelete(filter)"
                >
                  <v-icon start size="16">mdi-delete</v-icon>
                  {{ t('common.delete') }}
                </v-btn>
              </div>

              <div class="d-flex align-center">
                <FiltersChips
                  :key="filter.id"
                  :filters="filter.filters"
                  readonly
                  is-tooltip
                />
              </div>
            </v-card>
          </div>

          <div v-else class="text-center pt-4 pb-6">
            <v-img
              src="/images/no-saved-filters.svg"
              max-height="200"
              class="mb-4"
              contain
            />
            <div>{{ t('filters.no_saved_filters') }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- EDIT NAME -->
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

    <!-- DELETE CONFIRM -->
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import axios from 'axios'

import DialogHeader from '@/components/elements/DialogHeader.vue'
import DialogDeleteConfirm from '@/components/dialogs/DialogDeleteConfirm.vue'
import FiltersChips from '@/components/elements/FiltersChips.vue'

import { useItemsStore } from '@/stores/items'
import { useAppStore } from '@/stores/app'

/* =========================
 * PROPS / EMITS
 * ========================= */

const props = defineProps({
  dialog: Boolean,
})

const emit = defineEmits(['close', 'apply'])

/* =========================
 * STORES & HELPERS
 * ========================= */

const itemsStore = useItemsStore()
const appStore = useAppStore()
const {t} = useI18n()

const { xs } = useDisplay()

/* =========================
 * STATE
 * ========================= */

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

/* =========================
 * COMPUTED
 * ========================= */

const savedFilters = computed(() => itemsStore.filters_saved)
const apiUrl = computed(() => appStore.localhost)

/* =========================
 * METHODS
 * ========================= */

const close = () => emit('close')

const openDialogDelete = filter => {
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

const openDialogEditing = filter => {
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
    { name: filterName.value }
  )
    .then((res) => {
      dialogEditing.value = false
      $operable.getSavedFilters()
    })
    .catch((e) => {
      dialogEditing.value = false
      console.log(e);
    });
}

const apply = savedFilter => {
  const filters = savedFilter.filters.map(f => ({
    ...f,
    id: null,
  }))
  emit('apply', filters)
}

/* =========================
 * UI
 * ========================= */

const editButtons = computed(() => [
  {
    icon: 'content-save',
    text: t('common.save'),
    color: 'success',
    action: updateFilterName,
  },
])
</script>


<style lang="scss" scoped>
.saved-filter {
  .saved-filter_delete {
    opacity: 0;
  }
  &:hover .saved-filter_delete {
    opacity: 1;
  }
}
</style>