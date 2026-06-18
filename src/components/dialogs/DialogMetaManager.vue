<template>
  <!-- Диалог для управления метой -->
  <v-dialog
    v-model="internalDialog"
    :fullscreen="xs"
    scrollable
    :width="!editMode ? 960 : hasOptions ? 960 : 500"
    @after-leave="resetDialogState"
  >
    <v-card>
      <DialogHeader
        @close="closeDialog"
        :header="dialogHeader"
        :buttons="buttons"
        closable
      />

      <v-card-text :key="metaKey" class="pa-4 meta-manager-dialog-content">
        <v-row>
          <!-- Левая колонка - основные поля -->
          <v-col cols="12" :md="!editMode ? 5 : hasOptions ? 5 : 12">
            <v-card rounded="xl" elevation="4" class="pa-4">
              <!-- Подсказка только для режима создания -->
              <v-alert
                v-if="!editMode && metaSettings.type === 'array'"
                type="info"
                class="text-caption mb-4"
                variant="tonal"
                density="compact"
                rounded="xl"
              >
                {{ t('meta.dialogs.array_meta_info') }}
              </v-alert>

              <v-form
                v-model="valid"
                ref="form"
                class="flex-grow-1"
                @submit.prevent
              >
                <!-- Поле выбора типа метаданных (только при создании) -->
                <v-select
                  v-if="!editMode"
                  v-model="metaSettings.type"
                  :items="metaTypes"
                  item-title="text"
                  item-value="value"
                  :rules="[(v) => !!v || t('validation.type_required')]"
                  :menu-props="{ attach: '.meta-manager-dialog-content' }"
                  persistent-hint
                  :hint="getHint()"
                  :label="t('common.type')"
                  class="mb-3"
                >
                  <template v-slot:selection="{ item }">
                    <v-icon :icon="item.raw.icon" size="16" start />
                    <span class="text-body-2">{{ item.raw.text }}</span>
                  </template>

                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :prepend-icon="item.raw.icon"
                      :title="item.raw.text"
                      density="compact"
                    />
                  </template>
                </v-select>

                <!-- Основные поля -->
                <v-text-field
                  v-model="metaSettings.name"
                  :rules="[nameRules]"
                  :label="t('common.name')"
                  class="mb-3"
                  density="comfortable"
                />

                <v-text-field
                  v-model="metaSettings.hint"
                  :label="t('common.hint')"
                  :hint="t('meta.fields.hint_help')"
                  persistent-hint
                  class="mb-3"
                  density="comfortable"
                />

                <!-- Выбор иконки -->
                <DialogIcons
                  :icon="metaSettings.icon"
                  @apply="changeIcon"
                  class="mb-4"
                />
              </v-form>
            </v-card>

            <v-card rounded="xl" elevation="4" class="px-4 pb-4 mt-6">
              <!-- Настройки закрепления (только в режиме редактирования) -->
              <settings-category-divider icon="pin" :title="t('meta.fields.pinned')">
                <template #actions>
                  <button-documentation id="meta.assign"></button-documentation>
                </template>
              </settings-category-divider>
              <MetaSettingsPinned v-if="editMode" :meta="metaSettings" class="mb-4" />

              <v-alert
                v-else
                type="info"
                class="text-caption"
                variant="tonal"
                density="compact"
                rounded="xl"
              >
                {{ t('meta.dialogs.settings_active_after_adding') }}
              </v-alert>
            </v-card>
          </v-col>

          <!-- Правая колонка - настройки -->
          <v-col cols="12" md="7">
            <!-- Настройки массива (для array типа) -->
            <MetaSettingsArray
              v-if="metaSettings.type === 'array'"
              @update="updateMetaSettings"
              :meta="metaSettings"
              :edit-mode="editMode"
              class="mb-4"
            />

            <!-- Настройки рейтинга (для rating типа) -->
            <MetaSettingsRating
              v-if="metaSettings.type === 'rating'"
              @update="updateMetaSettings"
              :meta="metaSettings"
              class="mb-4"
            />

            <!-- Switch для ссылок (для string типа) -->
            <v-card
              v-if="metaSettings.type === 'string'"
              rounded="xl" elevation="4" class="pa-4" style="height: 100%"
            >
              <v-switch
                v-model="metaSettings.isLink"
                :label="t('meta.fields.link')"
                hide-details
                inset
              />
            </v-card>

            <!-- Дополнительные настройки для других типов могут быть добавлены здесь -->
            <v-card v-if="!editMode && !hasOptions"
              rounded="xl" elevation="4"
              class="pa-4 d-flex flex-column justify-center align-center"
              height="100%"
            >
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cog</v-icon>
              <div>{{ t('meta.fields.no_additional_settings') }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Диалог подтверждения удаления (только в режиме редактирования) -->
  <DialogDeleteConfirm
    v-if="editMode && dialogDeleteMeta"
    v-model="dialogDeleteMeta"
    @delete="deleteMeta"
    @close="dialogDeleteMeta=false"
    :text="textDialogDelete"
  ></DialogDeleteConfirm>
</template>

<script setup>
import {ref, computed, onMounted, watch, nextTick} from 'vue'
import {useDisplay} from 'vuetify'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import DialogIcons from '@/components/dialogs/DialogIcons.vue'
import DialogDeleteConfirm from '@/components/dialogs/DialogDeleteConfirm.vue'
import MetaSettingsArray from '@/components/dialogs/meta/MetaSettingsArray.vue'
import MetaSettingsRating from '@/components/dialogs/meta/MetaSettingsRating.vue'
import MetaSettingsPinned from "@/components/dialogs/meta/MetaSettingsPinned.vue";
import SettingsCategoryDivider from "@/components/ui/SettingsCategoryDivider.vue";
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue";
import MetaTypes from '@/assets/MetaTypes.js'
import axios from 'axios'
import _ from 'lodash'

// Props
const props = defineProps({
  dialog: {
    type: Boolean,
    default: false
  },
  // Для режима редактирования
  meta: {
    type: Object,
    default: null
  },
  // Режим работы: создание (false) или редактирование (true)
  editMode: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['updated', 'close', 'delete'])

// Stores
const appStore = useAppStore()
const {xs} = useDisplay()
const {t} = useI18n()

// Refs
const form = ref(null)
const internalDialog = ref(false)
const dialogIcons = ref(false)
const dialogDeleteMeta = ref(false)
const valid = ref(false)

// Meta data
const metaTypes = computed(() => MetaTypes.map(type => ({
  ...type,
  text: t(`meta.types.${type.value}`),
  hint: t(`meta.hints.${type.value}`),
})))

const metaSettings = ref({})

// Единый объект для всех настроек мета
const metaSettingsDefault = ref({

  // Основные настройки для всех типов
  type: 'array',
  name: '',
  hint: '',
  icon: 'shape',

  // Настройки для типа string
  isLink: false,

  // Настройки для типа array
  hidden: false,
  parser: false,
  imageAspectRatio: 1,
  chipLabel: false,
  chipVariant: 'flat',
  color: false,
  favorite: false,
  rating: false,
  synonyms: false,
  bookmark: false,
  country: false,
  career: false,
  scraper: false,
  nested: false,
  marks: false,

  // Настройки для типа rating
  ratingIcon: "star",
  ratingIconEmpty: "star-outline",
  ratingIconHalf: "star-half-full",
  ratingHalf: false,
  ratingMax: 5,
  ratingColor: "#ffab00",
})

// Keys для принудительного перерисовывания
const metaKey = ref(0)

// Buttons for DialogHeader
const buttons = ref([])

// Computed
const apiUrl = computed(() => appStore.localhost)

const hasOptions = computed(() => ['array', 'rating', 'string'].includes(metaSettings.value.type))

const dialogHeader = computed(() => {
  return props.editMode ? t('media.type.editing_meta') : t('meta.dialogs.adding_meta')
})

const textDialogDelete = computed(() => {
  if (!props.editMode || !props.meta) return ''

  let text = t('meta.dialogs.delete_meta_assigned_confirm') + '\n'
  if (metaSettings.value.type === 'array') {
    text += t('meta.dialogs.delete_meta_tags_confirm') + '\n'
  }
  text += t('common.are_you_sure')
  return text
})

// Methods
const initButtons = () => {
  if (props.editMode && props.meta) {
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
        action: sendForm
      }
    ]
  } else {
    buttons.value = [
      {
        icon: 'plus',
        text: t('common.add'),
        color: 'success',
        variant: 'flat',
        action: sendForm
      }
    ]
  }
}

const changeIcon = (icon) => {
  dialogIcons.value = false
  metaSettings.value.icon = icon
}

const nameRules = (value) => {
  return $readable.validateName(value)
}

const sendForm = async () => {
  if (!form.value) return

  const {valid: formValid} = await form.value.validate()
  if (!formValid) return

  try {

    let response = {}

    if (props.editMode && props.meta.id) {
      response = await axios.put(`${apiUrl.value}/api/Meta/${props.meta.id}`, metaSettings.value)
    } else {
      response = await axios.post(`${apiUrl.value}/api/Meta`, metaSettings.value)
    }

    if (response.data) {
      if (!props.editMode) {
        $operable.setNotification({
          type: 'success',
          title: t('meta.dialogs.meta_added', {name: metaSettings.value.name})
        })
      }

      emit('updated', metaSettings.value.type)
      closeDialog()
    }
  } catch (error) {
    console.error('Error adding meta:', error)

    let errorMessage = t('meta.dialogs.failed_add')
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    $operable.setNotification({
      type: 'error',
      text: errorMessage
    })
  }
}

const updateMetaSettings = (newSettings) => {
  console.log('updateMetaSettings called with:', newSettings)

  // Объединяем с текущими настройками
  metaSettings.value = {
    ...metaSettings.value,
    ...newSettings
  }

  console.log('Meta settings after update:', metaSettings.value)
}

const closeDialog = () => {
  internalDialog.value = false
  emit('close')
}

const resetDialogState = () => {
  metaSettings.value = _.cloneDeep(metaSettingsDefault.value)
  valid.value = false

  if (form.value) {
    form.value.reset()
    form.value.resetValidation()
  }
}

const deleteMeta = async () => {
  if (!props.meta?.id) return

  try {
    await axios.delete(`${apiUrl.value}/api/Meta/${props.meta.id}`)

    $operable.setNotification({
      type: 'success',
      title: t('meta.dialogs.meta_deleted', {name: metaSettings.value.name})
    })

    dialogDeleteMeta.value = false
    emit('updated', metaSettings.value.type)
    emit('delete')
    closeDialog()
  } catch (error) {
    console.error('Error deleting meta:', error)

    $operable.setNotification({
      type: 'error',
      text: t('meta.dialogs.failed_delete')
    })
  }
}

const getHint = () => {
  return metaTypes.value.find(type => type.value === metaSettings.value.type)?.hint || t('meta.dialogs.select_meta_type')
}

// Watchers
watch(() => props.dialog, (newVal) => {
  internalDialog.value = newVal
  initButtons()

  console.log('Dialog state changed:', newVal, 'editMode:', props.editMode)

  metaSettings.value = _.cloneDeep(metaSettingsDefault.value)

  if (props.meta) {
    metaSettings.value = _.cloneDeep({...metaSettingsDefault.value, ...props.meta})
  }

  metaKey.value++
})
</script>