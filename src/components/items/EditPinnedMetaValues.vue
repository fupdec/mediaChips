<template>
  <div class="editing" :class="{ 'show-icons': showIcons, 'editing--hero': layout === 'hero' }">
    <div v-if="layout === 'hero'" class="edit-dialog-hero mb-1">
      <div class="edit-dialog-hero__media">
        <slot name="media"/>
      </div>
      <div class="edit-dialog-hero__overview">
        <EditPinnedOverview
          :item="currentItem"
          :is-media="isMedia"
          :completion-status="completionStatus"
          :preset-meta="preset_meta"
        />
      </div>
    </div>

    <template v-else-if="showOverview">
      <v-col cols="12">
        <EditPinnedOverview
          :item="currentItem"
          :is-media="isMedia"
          :completion-status="completionStatus"
          :preset-meta="preset_meta"
        />
      </v-col>
    </template>

    <!-- Main form -->
    <v-form v-model="valid" ref="form" @submit.prevent>
      <v-container fluid>
        <v-row>
          <!-- Name field - only for tags -->
          <v-col v-if="isTag && meta" cols="12" md="6" xl="4" class="field">
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <v-text-field
                v-model="vals.name"
                :rules="[nameRules]"
                :prepend-icon="showIcons ? 'mdi-alphabetical-variant' : ''"
                :label="t('common.name')"
                variant="filled"
              />
              <v-btn
                v-if="vals.name !== old.name"
                @click="restore('name')"
                class="restore"
                :title="t('common.restore')"
                variant="plain"
                size="x-small"
                icon
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </v-card>
          </v-col>

          <!-- Synonyms - only for tags -->
          <v-col v-if="isTag && meta?.synonyms" cols="12" md="6" xl="4" class="field">
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <v-text-field
                v-model="vals.synonyms"
                :prepend-icon="showIcons ? 'mdi-alphabetical' : ''"
                :label="t('filters.sort.synonyms')"
                :hint="t('editing.synonyms_hint')"
                clearable
                variant="filled"
              />
              <v-btn
                v-if="vals.synonyms !== old.synonyms"
                @click="restore('synonyms')"
                class="restore"
                :title="t('common.restore')"
                variant="plain"
                size="x-small"
                icon
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </v-card>
          </v-col>

          <!-- Rating & Favorite -->
          <v-col v-if="ratingEnabled || favoriteEnabled" cols="12" md="6" xl="4">
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <div class="d-flex justify-space-between">
                <div v-if="ratingEnabled" class="text-medium-emphasis text-caption">
                  {{ t('meta.default_names.rating') }}
                </div>
                <div v-if="favoriteEnabled" class="text-medium-emphasis text-caption">
                  {{ t('meta.default_names.favorite') }}
                </div>
              </div>
              <div class="d-flex justify-space-between">
                <v-rating
                  v-if="ratingEnabled"
                  v-model="vals.rating"
                  color="yellow-darken-3"
                  background-color="grey-darken-1"
                  empty-icon="mdi-star-outline"
                  half-icon="mdi-star-half-full"
                  half-increments
                  clearable
                  density="compact"
                  class="pt-2"
                  hover
                ></v-rating>
                <v-checkbox
                  v-if="favoriteEnabled"
                  v-model="vals.favorite"
                  :false-value="0"
                  :true-value="1"
                  false-icon="mdi-heart-outline"
                  true-icon="mdi-heart"
                  color="pink"
                  hide-details
                  class="fav-btn"
                />
              </div>
            </v-card>
          </v-col>

          <!-- Number of views -->
          <v-col v-if="settingsStore.count_number_of_views === '1'" cols="12" md="6" xl="4">
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <v-text-field
                v-model="vals.views"
                :label="t('settings_labels.appearance.number_of_views')"
                :prepend-icon="showIcons ? 'mdi-eye' : ''"
                type="number"
                hide-details
                variant="filled"
              />
            </v-card>
          </v-col>

          <!-- Color - only for tags -->
          <v-col v-if="isTag && meta?.color" cols="12" md="6" xl="4">
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <div class="text-medium-emphasis text-caption">{{ t('meta.default_names.color') }}</div>
              <v-icon @click="pickColor" :color="vals.color" start>mdi-circle</v-icon>
              <v-btn @click="pickColor" color="primary" variant="flat" rounded="xl">{{ t('settings_labels.appearance.change_color') }}</v-btn>
            </v-card>
          </v-col>

          <!-- Country - only for tags -->
          <v-col v-if="isTag && meta?.country" cols="12" md="6" xl="4">
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <MetaInputCountry
                @update:model-value="setValByKey($event, 'country')"
                :model-value="vals.country"
                variant="filled"
                hide-details
              />
            </v-card>
          </v-col>

          <!-- Assigned/Pinned metadata -->
          <v-col
            v-for="(item, index) in assignedItems"
            :key="`${index}_${item.pinnedMetaId || item.metaId}`"
            cols="12" md="6" xl="4"
            class="field"
          >
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <!-- Array type meta -->
              <MetaInputArray
                v-if="item.meta?.type === 'array'"
                @update:model-value="setVal($event, getItemKey(item))"
                :model-value="vals[getItemKey(item)]"
                :meta-id="getItemKey(item)"
                :ref="el => setMetaInputRef(el, getItemKey(item))"
                multiple
              />

              <!-- Number type meta -->
              <v-text-field
                v-if="item.meta?.type === 'number'"
                v-model="vals[getItemKey(item)]"
                :label="item.meta?.name"
                :hint="item.meta?.hint"
                :prepend-icon="showIcons ? `mdi-${item.meta?.icon}` : ''"
                type="number"
                persistent-hint
                clearable
                variant="filled"
              />

              <!-- String type meta -->
              <v-text-field
                v-if="item.meta?.type === 'string'"
                v-model="vals[getItemKey(item)]"
                :label="item.meta?.name"
                :hint="item.meta?.hint"
                :prepend-icon="showIcons ? `mdi-${item.meta?.icon}` : ''"
                persistent-hint
                clearable
                variant="filled"
              />

              <!-- Boolean type meta -->
              <v-checkbox
                v-if="item.meta?.type === 'boolean'"
                v-model="vals[getItemKey(item)]"
                :label="item.meta?.name"
                :hint="item.meta?.hint"
                :prepend-icon="showIcons ? `mdi-${item.meta?.icon}` : ''"
                persistent-hint
              />

              <!-- Date type meta -->
              <v-text-field
                v-if="item.meta?.type === 'date'"
                @click="pickDate(getItemKey(item))"
                :model-value="vals[getItemKey(item)]"
                :label="item.meta?.name"
                :hint="item.meta?.hint"
                :prepend-icon="showIcons ? `mdi-${item.meta?.icon}` : ''"
                persistent-hint
                readonly
                clearable
                variant="filled"
              />

              <!-- Rating type meta -->
              <div v-if="item.meta?.type === 'rating'" class="d-flex flex-column">
                <div class="text-medium-emphasis text-caption" :class="[{ 'pl-9': showIcons }]">
                  {{ item.meta?.name }}
                </div>
                <div class="d-flex">
                  <v-icon v-if="showIcons" :icon="`mdi-${item.meta?.icon}`" start/>
                  <v-rating
                    :model-value="vals[getItemKey(item)]"
                    @update:model-value="setVal($event, getItemKey(item))"
                    :length="item.meta?.ratingMax"
                    :full-icon="`mdi-${item.meta?.ratingIcon}`"
                    :empty-icon="`mdi-${item.meta?.ratingIconEmpty || item.meta?.ratingIcon}`"
                    :half-increments="item.meta?.ratingHalf"
                    :half-icon="`mdi-${item.meta?.ratingIconHalf || item.meta?.ratingIcon}`"
                    :active-color="item.meta?.ratingColor"
                    color="grey-darken-1"
                    density="compact"
                    clearable
                    hover
                  ></v-rating>
                </div>
                <div class="text-medium-emphasis text-caption" :class="[{ 'pl-9': showIcons }]">
                  {{ item.meta?.hint }}
                </div>
              </div>

              <v-btn
                v-if="!equalOld(getItemKey(item), item.meta?.type)"
                @click="restore(getItemKey(item))"
                class="restore"
                :title="t('common.restore')"
                variant="plain"
                size="x-small"
                icon
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </v-card>
          </v-col>

          <!-- Bookmark -->
          <v-col cols="12" md="6" xl="4" class="field">
            <v-card class="rounded-xl pa-4" color="rgba(150, 150, 150, 0.09)" variant="flat">
              <v-textarea
                v-model="vals.bookmark"
                :prepend-icon="showIcons ? 'mdi-bookmark' : ''"
                :label="t('meta.default_names.bookmark')"
                hide-details
                clearable
                auto-grow
                rows="1"
                variant="filled"
              />
              <v-btn
                v-if="vals.bookmark !== old.bookmark"
                @click="restore('bookmark')"
                class="restore"
                :title="t('common.restore')"
                variant="plain"
                size="x-small"
                icon
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-form>

    <!-- Color picker dialog - only for tags -->
    <ColorPicker
      v-if="colorPicker.dialog"
      v-model="colorPicker.dialog"
      :color="colorPicker.color"
      @get-color="setColor"
    />

    <!-- Date picker dialog -->
    <v-dialog v-model="datePicker.dialog" width="300">
      <v-date-picker
        @update:model-value="setDate"
        :model-value="datePicker.value"
        color="primary"
        rounded="xl"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useItemsStore} from '@/stores/items'
import {useDialogsStore} from '@/stores/dialogs'
import {useScraperStore} from '@/stores/scraper'
import {useEventBus} from '@/utils/eventBus'
import {parseCountries, serializeCountries} from '@/utils/country'
import axios from 'axios'
import _ from 'lodash'
import path from 'path-browserify'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ru'
import {usePresetMeta} from '@/composable/ItemPresetMeta'

// Components
import MetaInputArray from '@/components/meta/input/MetaInputArray.vue'
import MetaInputCountry from '@/components/meta/input/MetaInputCountry.vue'
import EditPinnedOverview from '@/components/items/EditPinnedOverview.vue'
import ColorPicker from '@/components/elements/ColorPicker.vue'

// Props - определяем тип редактируемого объекта
const props = defineProps({
  layout: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'hero'].includes(value),
  },
  showOverview: {
    type: Boolean,
    default: true,
  },
  // Для тегов (приоритет из первого файла)
  tag: {
    type: Object,
    default: null
  },
  meta: {
    type: Object,
    default: null
  },
  // Для медиа
  media: {
    type: Object,
    default: null
  },
})

// Emits
const emit = defineEmits(['close'])

// Определяем тип редактируемого объекта (приоритет первому файлу)
const isTag = computed(() => !!props.tag)
const isMedia = computed(() => !props.tag && !!props.media)
const currentItem = computed(() => isTag.value ? props.tag : props.media)
const currentItemId = computed(() => currentItem.value?.id)
const currentItemType = computed(() => isTag.value ? 'tag' : 'media')

// Stores (из первого файла)
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const dialogsStore = useDialogsStore()
const scraperStore = useScraperStore()
const itemsStore = useItemsStore()
const eventBus = useEventBus()
const {t} = useI18n()

// DayJS setup (из первого файла)
const locale = computed(() => settingsStore.locale == 'cn' ? 'zh-cn' : settingsStore.locale)
dayjs.extend(relativeTime)
dayjs.locale(locale.value)

// Refs (из первого файла)
const form = ref(null)
const valid = ref(false)
const vals = ref({})
const old = ref({})
const assignedItems = ref([])
const metaInputRefs = ref({})

// composable for default meta
const presetMetaProps = {
  type: isTag.value ? 'tag' : 'media',
  item: currentItem.value,
  tagPage: false,
  isShowAll: true,
}
const {preset_meta} = usePresetMeta(presetMetaProps)

const colorPicker = ref({
  dialog: false,
  color: null
})

const datePicker = ref({
  dialog: false,
  metaId: null,
  value: null
})

// Computed (из первого файла с дополнениями)
const apiUrl = computed(() => appStore.localhost)
const settings = computed(() => settingsStore)
const showIcons = computed(() => settings.value.showIconsOfMetaInEditingDialog === '1')

const ratingEnabled = computed(() => {
  if (isTag.value) return props.meta?.rating
  if (isMedia.value) return true
  return false
})

const favoriteEnabled = computed(() => {
  if (isTag.value) return props.meta?.favorite
  if (isMedia.value) return true
  return false
})

// Methods (в основном из первого файла)

const nameRules = (value) => {
  if (!value || value.trim().length === 0) {
    return t('validation.name_required')
  }
  return true
}

const getItemKey = (item) => {
  return item.pinnedMetaId || item.metaId
}

const setVal = (val, key) => {
  vals.value[key] = val
}

const setValByKey = (val, key) => {
  setVal(val, key)
}

const pickColor = () => {
  colorPicker.value.color = vals.value.color
  colorPicker.value.dialog = true
}

const setColor = (color) => {
  vals.value.color = color
  colorPicker.value.dialog = false
}

const pickDate = (metaId) => {
  datePicker.value.dialog = true
  datePicker.value.value = vals.value[metaId]
  datePicker.value.metaId = metaId
}

const setDate = (date) => {
  datePicker.value.dialog = false
  if (datePicker.value.metaId) {
    vals.value[datePicker.value.metaId] = dayjs(date).format('YYYY-MM-DD')
  }
}

const equalOld = (metaId, metaType) => {
  const val = vals.value[metaId]
  const oldVal = old.value[metaId]

  if (metaType === 'array') {
    const valCopy = _.cloneDeep(val) || []
    const oldCopy = _.cloneDeep(oldVal) || []
    return _.isEqual(valCopy.sort(), oldCopy.sort())
  } else {
    return val === oldVal
  }
}

const restore = (key) => {
  vals.value[key] = _.cloneDeep(old.value[key])
}

const setMetaInputRef = (el, metaId) => {
  if (el) {
    metaInputRefs.value[metaId] = el
  }
}

// Метод getMetaValues из первого файла, адаптированный для обоих типов
const getMetaValues = async () => {
  try {
    if (!currentItemId.value) return

    let tags = []
    let values = []

    // Выбираем правильные endpoints в зависимости от типа
    if (isTag.value) {
      // Для тегов (из первого файла)
      const tagsResponse = await axios.get(`${apiUrl.value}/api/TagsInTag?tagId=${currentItemId.value}`)
      tags = tagsResponse.data

      const valuesResponse = await axios.get(`${apiUrl.value}/api/ValuesInTag?tagId=${currentItemId.value}`)
      values = valuesResponse.data

      // Получаем закрепленные метаданные (только для тегов)
      const pinnedResponse = await axios.get(`${apiUrl.value}/api/PinnedMeta?metaId=${props.meta.id}`)
      assignedItems.value = pinnedResponse.data
      scraperStore.pinned = assignedItems.value

    } else if (isMedia.value) {
      // Для медиа (адаптировано из второго файла)
      const tagsResponse = await axios.get(`${apiUrl.value}/api/TagsInMedia?mediaId=${currentItemId.value}`)
      tags = tagsResponse.data

      const valuesResponse = await axios.get(`${apiUrl.value}/api/ValuesInMedia?mediaId=${currentItemId.value}`)
      values = valuesResponse.data

      // Используем assigned из store для медиа
      assignedItems.value = itemsStore.assigned || []
    }

    // Инициализируем значения для всех ассоциированных мета
    for (const item of assignedItems.value) {
      setVal(null, getItemKey(item))
    }

    // Заполняем значения из базы
    for (const value of values) {
      const item = assignedItems.value.find(p => getItemKey(p) === value.metaId)
      let val = value.value

      if (item) {
        const type = item.meta?.type
        if (type === 'rating') {
          val = Number(val)
          if (isNaN(val)) val = 0
        }
      }

      setVal(val, value.metaId)
    }

    // Обрабатываем теги
    const parsedTags = {}
    for (const tag of tags) {
      if (!parsedTags[tag.metaId]) {
        parsedTags[tag.metaId] = [tag.tagId]
      } else {
        parsedTags[tag.metaId].push(tag.tagId)
      }
    }

    for (const metaId in parsedTags) {
      setVal(parsedTags[metaId], metaId)
    }

    // Сохраняем старые значения
    old.value = _.cloneDeep(vals.value)

    // Сохраняем текущие значения в store скрапера (только для тегов)
    if (isTag.value) {
      scraperStore.currentValues = vals.value
    }

  } catch (error) {
    console.error('Error getting meta values:', error)
  }
}

const save = async () => {
  if (!valid.value || !form.value) {
    await form.value?.validate()
    return
  }

  const tags = []
  const values = []

  for (const key in vals.value) {
    const isMeta = /\d/.test(key)
    if (!isMeta) continue

    let val = vals.value[key]
    const type = typeof val

    if (type === 'string') {
      val = val.trim()
      if (val.length === 0) val = null
    } else if (type === 'object' && Array.isArray(val)) {
      for (const tagId of val) {
        if (isTag.value) {
          tags.push({
            parentTagId: currentItemId.value,
            tagId: tagId,
            metaId: key
          })
        } else if (isMedia.value) {
          tags.push({
            mediaId: currentItemId.value,
            tagId: tagId,
            metaId: key
          })
        }
      }
    }

    if (isMeta && type !== 'object') {
      if (isTag.value) {
        values.push({
          value: val,
          tagId: currentItemId.value,
          metaId: key
        })
      } else if (isMedia.value) {
        values.push({
          value: val,
          mediaId: currentItemId.value,
          metaId: key
        })
      }
    }
  }

  console.log(tags)
  console.log(values)

  const updateData = _.cloneDeep(vals.value)

  // Обрабатываем страну (только для тегов)
  if (isTag.value && updateData.country && updateData.country.length) {
    updateData.country = serializeCountries(updateData.country)
  } else if (isTag.value) {
    updateData.country = null
  }

  try {
    // Обновляем основной объект
    const endpoint = isTag.value ? 'tag' : 'media'
    await axios.put(`${apiUrl.value}/api/${endpoint}/${currentItemId.value}`, updateData)

    // Удаляем существующие теги
    const tagsEndpoint = isTag.value ? 'TagsInTag' : 'TagsInMedia'
    await axios.delete(`${apiUrl.value}/api/${tagsEndpoint}/${currentItemId.value}`)

    // Добавляем новые теги
    if (tags.length > 0) {
      await axios.post(`${apiUrl.value}/api/${tagsEndpoint}`, tags)
    }

    // Удаляем существующие значения
    const valuesEndpoint = isTag.value ? 'ValuesInTag' : 'ValuesInMedia'
    await axios.delete(`${apiUrl.value}/api/${valuesEndpoint}/${currentItemId.value}`)

    // Добавляем новые значения
    if (values.length > 0) {
      await axios.post(`${apiUrl.value}/api/${valuesEndpoint}`, values)
    }

    emit('close')

    // Эмитируем событие обновления
    eventBus.emit('getItemsFromDb', {
      ids: [currentItemId.value],
      type: currentItemType.value
    })

  } catch (error) {
    console.error('Error saving item:', error)
  }
}

const transferScrapedInfo = async () => {
  // Только для тегов (из первого файла)
  if (!isTag.value) return

  const images = dialogsStore.scraper?.images || []

  if (images.length > 0) {
    // Нужно реализовать загрузку и сохранение изображений
    let imageTypes = ["main", "alt", "custom1", "custom2"]
    let index = 0

    for (let url of images) {
      const imageType = imageTypes[index]
      // Нужно получить dbPath и meta.id, tag.id из текущего контекста
      let imagePath = path.join(
        appStore.dbPath, // нужно получить из store
        "meta",
        `${props.meta.id}`, // текущий meta.id
        `${props.tag.id}_${imageType}.jpg` // текущий tag.id
      )
      ++index
      const ar = props.meta.imageAspectRatio // нужно получить aspect ratio
      const sizes = {width: 300, height: 300 / ar}

      // Вызов функции создания изображения
      const res = await $operable.createImage(url, imagePath, sizes)
      if (res.status != 201) {
        // Показать уведомление об ошибке
        $operable.setNotification({
          type: "error",
          title: t('scraper.error'),
          text: t('scraper.image_cannot_be_obtained'),
        })
      }
    }
    eventBus.emit('scraperGotImages')
    dialogsStore.scraper.images = []
  }

  const fields = scraperStore.fields || []

  for (const field of fields) {
    if (field.isTransfered) {
      if (field.dataType === 'array') {
        const metaId = field.meta.id
        console.log(field)

        if (field.isTagExists) {
          // Получаем теги для данного meta
          const tags = appStore.getTagsByMetaId(metaId)
          const tag = tags.find((i) => i.name === field.valueScraper)

          if (tag) {
            // получаем текуший массив
            let arr = _.cloneDeep(vals.value[metaId] || [])

            // Добавляем ID тега, если его еще нет
            if (!arr.includes(tag.id)) {
              arr.push(tag.id)
              setValByKey(arr, metaId)
            }
          }
        } else {
          const input = metaInputRefs.value[metaId]
          if (input && input.create) {
            input.create(field.valueScraper)
          }
        }
      } else if (field.dataType === 'country') {
        setValByKey(field.valueScraper, 'country')
      } else {
        setValByKey(field.valueScraper, field.meta.id)
      }
    }
  }
}

// Lifecycle (из первого файла с адаптацией)
onMounted(async () => {
  // Инициализация значений
  if (isTag.value) {
    const countries = parseCountries(props.tag.country)
    vals.value = {
      country: countries,
      name: props.tag.name || null,
      color: props.tag.color || '#777',
      synonyms: props.tag.synonyms || null,
      rating: props.tag.rating || 0,
      favorite: props.tag.favorite || 0,
      views: props.tag.views || 0,
      bookmark: props.tag.bookmark || null
    }
  } else if (isMedia.value) {
    vals.value = {
      path: props.media.path || null,
      rating: props.media.rating || 0,
      favorite: props.media.favorite || 0,
      views: props.media.views || 0,
      bookmark: props.media.bookmark || null
    }
  }

  await getMetaValues()

  // Подписываемся на событие передачи данных из скрапера (только для тегов)
  if (isTag.value) {
    eventBus.on('transferScrapedInfo', transferScrapedInfo)
  }
})

onUnmounted(() => {
  if (isTag.value) {
    eventBus.off('transferScrapedInfo', transferScrapedInfo)
  }
})

// Computed properties только для тегов (из первого файла)
const completionStatus = computed(() => {
  let completed = []

  for (const item of assignedItems.value) {
    const val = vals.value[getItemKey(item)]

    if (val === undefined || val === null) {
      completed.push(0)
    } else if (typeof val === 'boolean') {
      completed.push(1)
    } else if (typeof val === 'number') {
      completed.push(val > 0 ? 1 : 0)
    } else {
      completed.push(val.length > 0 ? 1 : 0)
    }
  }

  if (completed.length === 0) return 0

  const completedValue = completed.reduce((sum, value) => sum + value, 0)
  return Math.ceil((completedValue / completed.length) * 100)
})

// Expose methods to parent component
defineExpose({
  save
})
</script>

<style lang="scss">
.fav-btn {
  .v-selection-control,
  .v-checkbox-btn {
    min-height: 24px !important;
  }
}

.restore {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 2;
}
</style>