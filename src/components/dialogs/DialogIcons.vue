<template>
  <v-dialog
    v-model="internalDialog"
    width="720"
    scrollable
    @after-leave="resetDialog"
  >
    <template v-slot:activator="{ props: activatorProps }">
      <div class="text-caption mt-2 mb-1">{{ t('meta.fields.icon') }}</div>
      <div class="d-flex align-center">
        <v-icon v-bind="activatorProps" size="large" start>mdi-{{ icon }}</v-icon>
        <v-btn v-bind="activatorProps" :text="t('meta.fields.select_icon')"
               color="primary" rounded variant="flat">
          {{ t('meta.fields.select_icon') }}
        </v-btn>
      </div>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card>
        <DialogHeader @close="closeDialog" :header="t('meta.fields.icon_selection')" closable/>

        <v-card-text>
          <v-data-iterator
            :items="filteredIcons"
            :items-per-page="itemsPerPage"
            :page="page"
            @update:page="page = $event"
            :search="search"
          >
            <template v-slot:header="{ page, pageCount, prevPage, nextPage }">
              <div class="d-flex justify-space-between align-center py-4">
                <v-text-field
                  v-model="search"
                  clearable
                  density="compact"
                  rounded
                  variant="outlined"
                  prepend-inner-icon="mdi-magnify"
                  :label="t('meta.fields.search_icons')"
                  max-width="300"
                  color="primary"
                  autofocus
                  hide-details
                />
                <div class="d-flex justify-space-between align-center">
                  <v-btn
                    icon
                    :disabled="page === 1"
                    @click="prevPage"
                    variant="text"
                  >
                    <v-icon>mdi-chevron-left</v-icon>
                  </v-btn>

                  <span class="mx-2 text-caption">
                {{ t('common.page_of', {page, total: pageCount}) }}
                </span>

                  <v-btn
                    icon
                    :disabled="page >= pageCount"
                    @click="nextPage"
                    variant="text"
                  >
                    <v-icon>mdi-chevron-right</v-icon>
                  </v-btn>
                </div>
              </div>
            </template>

            <template v-slot:default="props">
              <div class="d-flex flex-wrap justify-center">
                <div
                  v-for="item in props.items"
                  :key="item.raw.id"
                  @click="applyIcon(item.raw.name)"
                  class="ma-2 pa-2 icon-container"
                  :class="{ 'icon-selected': selectedIcon === item.raw.name }"
                  :title="item.raw.name"
                >
                  <v-icon size="40">mdi-{{ item.raw.name }}</v-icon>
                </div>
              </div>
            </template>
          </v-data-iterator>
        </v-card-text>

        <v-card-actions v-if="selectedIcon" class="pa-4">
          <v-spacer></v-spacer>
          <div class="d-flex align-center mr-4">
            <v-icon size="large" class="mr-2">mdi-{{ selectedIcon }}</v-icon>
            <span class="text-body-1">{{ t('common.selected') }}: <strong>{{ selectedIcon }}</strong></span>
          </div>
          <v-btn @click="applyIcon(selectedIcon)" color="primary" variant="flat">
            {{ t('meta.fields.apply_icon') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import icons from '@/assets/material-icons.json'

// Props
const props = defineProps({
  icon: {
    type: String,
    default: 'shape'
  }
})

// Emits
const emit = defineEmits(['update:model-value', 'apply', 'close'])
const {t} = useI18n()

// Refs
const internalDialog = ref(false)
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(50)
const selectedIcon = ref('')

// Computed
const filteredIcons = computed(() => {
  if (!search.value) return icons

  const searchTerm = search.value.toLowerCase()
  return icons.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm) ||
    (icon.tags && icon.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  )
})

// Methods
const applyIcon = (iconName) => {
  selectedIcon.value = iconName
  emit('apply', iconName)
  closeDialog()
}

const closeDialog = () => {
  internalDialog.value = false
  emit('close')
}

const resetDialog = () => {
  search.value = ''
  page.value = 1
  selectedIcon.value = ''
}

const truncateIconName = (name) => {
  if (name && name.length > 15) {
    return name.substring(0, 12) + '...'
  }
  return name
}

// Lifecycle
onMounted(() => {
  internalDialog.value = props.modelValue
})

// Watchers
watch(() => props.modelValue, (newVal) => {
  internalDialog.value = newVal

  if (newVal) {
    resetDialog()
  }
})

watch(internalDialog, (newVal) => {
  emit('update:model-value', newVal)
})

// Expose methods if needed
defineExpose({
  applyIcon,
  closeDialog
})
</script>

<style scoped>
.icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: transparent;
}

.icon-container:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.icon-selected {
  background-color: rgba(var(--v-theme-primary), 0.2);
  border: 2px solid rgb(var(--v-theme-primary));
}

.icon-selected:hover {
  background-color: rgba(var(--v-theme-primary), 0.3);
}
</style>