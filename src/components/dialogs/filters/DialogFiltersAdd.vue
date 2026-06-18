<template>
  <v-dialog
    v-if="dialog"
    @update:model-value="close"
    :model-value="dialog"
    :fullscreen="xs"
    scrollable
    width="800"
  >
    <v-card>
      <DialogHeader
        @close="close"
        :header="t('filters.adding_filter')"
        :buttons="[
          {
            icon: 'plus',
            text: t('common.add_count', { count: selected.length }),
            disabled: !selected.length,
            color: 'success',
            outlined: false,
            function: add,
          },
        ]"
        closable
      />

      <v-card-text class="mt-6">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="search"
              :placeholder="t('common.quick_search_placeholder')"
              append-icon="mdi-magnify"
              hide-details
              autofocus
              rounded
              filled
              dense
              focused
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="filtered_type"
              :items="metaTypes"
              :placeholder="t('filters.show_filter_with_data_type')"
              hide-details
              rounded
              filled
              dense
              clearable
            >
              <template v-slot:selection="{ item }">
                <v-icon left> {{ item.icon }}</v-icon>
                <span class="body-2">{{ item.text }}</span>
              </template>
              <template v-slot:item="{ item }">
                <v-icon left> {{ item.icon }}</v-icon>
                <span class="body-2">{{ item.text }}</span>
              </template>
            </v-select>
          </v-col>
        </v-row>

        <v-chip-group v-model="selected" class="mt-5" column multiple>
          <v-card
            v-for="(group, param) in groups"
            :key="param"
            class="group mb-4 pa-4 rounded-xl"
            color="rgb(120 120 120 / 5%)"
            flat
          >
            <div class="subtitle-2 text--secondary mb-4">
              <v-icon color="grey" left>{{ getGroupIcon(param).icon }}</v-icon>
              <span>{{ getGroupText(param) }}</span>
            </div>

            <v-chip
              v-for="(i, x) in group"
              :key="i.id"
              :class="{found:(search||filtered_type)&&!i.found}"
              :color="selected.includes(i.id) ? 'primary' : ''"
              :value="i.id"
            >
              <v-icon size="20" left>mdi-{{ i.icon }}</v-icon>
              <span v-html="getNameHighlighted(i.text)"/>
              <v-icon right small>{{ getIcon(i.type) }}</v-icon>
            </v-chip>
          </v-card>
        </v-chip-group>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'
import _ from 'lodash'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import MetaTypes from '@/assets/MetaTypes.js'

const props = defineProps({
  dialog: Boolean,
  params: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add', 'close'])

const {xs} = useDisplay()
const {t} = useI18n()

// Refs
const selected = ref([])
const search = ref("")
const filtered_type = ref(null)
const metaTypes = ref(MetaTypes || [])

// Computed
const groups = computed(() => {
  const searchVal = search.value
  const filteredTypeVal = filtered_type.value
  let params = props.params.map((i, index) => {
    const item = {...i, id: index}

    if (searchVal && !filteredTypeVal) {
      item.found = i.text?.toLowerCase().includes(searchVal.toLowerCase()) || false
    } else if (!searchVal && filteredTypeVal) {
      item.found = i.type === filteredTypeVal
    } else if (searchVal && filteredTypeVal) {
      item.found = i.type === filteredTypeVal &&
        i.text?.toLowerCase().includes(searchVal.toLowerCase())
    } else {
      item.found = true
    }
    return item
  })

  params = _.orderBy(params, ["text", "group"])
  return _.groupBy(params, "group")
})

// Methods
const add = () => {
  let params = props.params.filter((i, x) => selected.value.includes(x))
  emit("add", params)
}

const close = () => {
  search.value = ""
  emit("close")
}

const getIcon = (type) => {
  return $readable.getIconDataType(type)
}

const getNameHighlighted = (name) => {
  return $readable.highlightChars(name, search.value, true)
}

const getGroupIcon = (type) => {
  const arr = [
    {
      text: "Tag",
      icon: "mdi-tag",
    },
    {
      text: "File",
      icon: "mdi-file",
    },
    {
      text: "Video",
      icon: "mdi-video",
    },
    {
      text: "Preset meta",
      icon: "mdi-shape",
    },
    {
      text: "Pinned meta",
      icon: "mdi-shape-outline",
    },
  ]
  return arr.find(i => i.text === type) || {icon: 'mdi-help-circle'}
}

const getGroupText = (group) =>
  t(`filters.groups.${group}`, group || '')
</script>

<style lang="scss" scoped>
.group {
  width: 100%;
}

.found {
  opacity: 0.5;
  transition: 0.1s all;
}
</style>