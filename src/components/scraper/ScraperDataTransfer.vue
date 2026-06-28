<template>
  <v-alert
    type="warning"
    :model-value="metas.length == 0"
    class="mt-4 caption"
    density="compact"
    variant="text"
  >
    {{ t('settings_labels.tools.scraper_no_meta_warning') }} <br/>
    {{ t('settings_labels.tools.scraper_configure_hint') }}
  </v-alert>

  <v-card-actions class="px-0">
    <v-btn @click="restoreAll" color="primary" class="px-4" rounded variant="flat">
      <v-icon icon="mdi-restore" start></v-icon>
      {{ t('common.restore_all') }}
    </v-btn>
    <v-spacer></v-spacer>
    <v-btn
      @click="transferAll"
      color="primary"
      class="px-4"
      rounded
      variant="flat"
    >
      <v-icon icon="mdi-transfer-left" start></v-icon>
      {{ t('common.transfer_all') }}
    </v-btn>
  </v-card-actions>
  <v-table class="transfer-table" density="compact">
    <thead>
    <tr>
      <th class="pl-8" style="width: 20%">{{ t('common.meta') }}</th>
      <th style="width: 10%">{{ t('filters.parameter') }}</th>
      <th class="text-right pr-12" style="width: 35%">{{ t('common.current') }}</th>
      <th style="width: 35%">{{ t('common.found') }}</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="(item, index) in fields" :key="index">
      <td class="pl-12">
        <v-btn
          @click="restore(item)"
          :disabled="!item.isTransfered"
          class="restore-btn"
          color="primary"
          size="small"
          variant="text"
          icon
        >
          <v-icon>mdi-restore</v-icon>
        </v-btn>
        <v-icon size="20"> mdi-{{ item.meta.icon }}</v-icon>
        {{ getMetaName(item.meta, t) }}
      </td>

      <!-- Параметр -->
      <td>{{ getScraperFieldName(item.key) }}</td>

      <!-- Текущее значение -->
      <td class="text-right pr-12">
        <span> {{ item.valueCurrent }} </span>
        <v-btn
          @click="transfer(item)"
          :disabled="item.isTransfered || item.isAlreadyContain"
          class="transfer-btn"
          color="primary"
          size="small"
          variant="text"
          icon
        >
          <v-icon>mdi-transfer-left</v-icon>
        </v-btn>
      </td>

      <!-- найденное значение -->
      <td>{{ item.valueScraper }}</td>
    </tr>
    </tbody>
  </v-table>

  <!-- Выбор изображений для импорта - inline реализация -->
  <ScraperSelectImages :selected="selected"></ScraperSelectImages>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useScraperStore} from '@/stores/scraper'
import {useAppStore} from '@/stores/app'
import Countries from "@/assets/Countries"
import {cloneDeep} from 'lodash'
import ScraperSelectImages from "@/components/scraper/ScraperSelectImages.vue";
import {getMetaName} from "@/utils/metaI18n";

const props = defineProps({
  selected: Object
})

const scraperStore = useScraperStore()
const appStore = useAppStore()
const {t} = useI18n()

const selectedImages = ref([])

// Компьютеды через Pinia stores
const fields = computed(() => scraperStore.fields)
const pinned = computed(() => scraperStore.pinned)
const metas = computed(() => pinned.value.filter(i => i.scraper))
const currentValues = computed(() => scraperStore.currentValues)

const getScraperFieldName = (key) => t(`scraper.fields.${key}`, key)

function toggleImage(img) {
  const index = selectedImages.value.indexOf(img)
  if (index > -1) {
    selectedImages.value.splice(index, 1)
  } else {
    selectedImages.value.push(img)
  }
}

async function getData() {
  const values = props.selected?.extras // получаем данные из скрапера
  if (!values) return // проверка на отсутствие данных

  const clearVal = (value, regexp) => {
    if (value) {
      let val = cloneDeep(value.match(regexp))
      if (val) return val[0]
    } else return value
  }

  values["bra"] = clearVal(values["cupsize"], /\d+/) // оставить только цифры
  values["cupsize"] = clearVal(values["cupsize"], /\D+/) // оставить все кроме цифр
  values["height"] = clearVal(values["height"], /\d+/)
  values["weight"] = clearVal(values["weight"], /\d+/)
  if (values["fake_boobs"] || values["fake_boobs"] === false) {
    values["fake_boobs"] = values["fake_boobs"] ? "Fake" : "Real"
  }

  let data = []
  let tagsAll = appStore.tags || []

  // для страны, тип данных строка
  const cc = values.birthplace_code
  const found_cc = Countries.find(i => i.code === cc)
  if (found_cc) {
    const currentCountry = currentValues.value.country || []
    data.push({
      dataType: 'country',
      valueCurrent: currentCountry,
      valueReserved: cloneDeep(currentCountry),
      valueScraper: [found_cc.name],
      isTagExists: false,
      key: 'country',
      meta: {icon: 'flag'},
      isTransfered: false,
      isAlreadyContain: currentCountry.includes(found_cc.name),
    })
  }

  // для остальных медиа, которые прикреплены
  metas.value.forEach((meta) => {
    const valueScraper = values[meta.scraper] // значение поля полученное по api
    if (!!valueScraper) {
      let val = currentValues.value[meta.pinnedMetaId] || null
      let isTagExists
      if (meta.meta.type === "array") {
        if (val && val.length) {
          // получаем массив с именами вместо айдишников
          val = val.map((id) => {
            const tag = appStore.getTagById(id)
            return tag ? tag.name : id
          })
        } else {
          val = []
        }
        // ищем есть ли уже тэг с таким именем
        isTagExists =
          tagsAll
            .filter(tag => tag.metaId === meta.meta.id)
            .findIndex(
              tag => tag.name.toLowerCase() === valueScraper.toLowerCase()
            ) > -1
      }

      let isAlreadyContain = false
      if (val && val.length) {
        isAlreadyContain = val.includes(valueScraper)
      }
      data.push({
        dataType: meta.meta.type,
        valueCurrent: cloneDeep(val),
        valueReserved: cloneDeep(val),
        valueScraper,
        isTagExists: isTagExists,
        key: meta.scraper,
        meta: cloneDeep(meta.meta),
        isTransfered: false,
        isAlreadyContain,
      })
    }
  })
  fields.value = data
}

function restore(item) {
  item.valueCurrent = cloneDeep(item.valueReserved)
  item.isTransfered = false
  fields.value = [...fields.value]
}

function transfer(item) {
  if (item.isTransfered) return // если уже перенесен
  if (item.dataType === "array") {
    if (!item.isAlreadyContain) {
      item.valueCurrent.push(item.valueScraper)
    }
  } else {
    item.valueCurrent = item.valueScraper
  }
  item.isTransfered = true
}

function restoreAll() {
  fields.value
    .filter(i => i.isTransfered)
    .forEach(item => {
      restore(item)
    })
}

function transferAll() {
  fields.value
    .filter(i => !i.isAlreadyContain)
    .forEach(item => {
      transfer(item)
    })
}

onMounted(() => {
  getData()
})

watch(() => props.selected, () => {
  getData()
})
</script>

<style>
.transfer-table {
  .v-table__wrapper {
    overflow: hidden;
  }

  td {
    position: relative;
  }

  .restore-btn,
  .transfer-btn {
    position: absolute;
    top: 0;
    bottom: 0;
    margin: auto;
  }

  .restore-btn {
    left: 0;
  }

  .transfer-btn {
    right: 0;
  }
}
</style>