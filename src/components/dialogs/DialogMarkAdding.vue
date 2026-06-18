<template>
  <v-dialog
    v-model="markAdding.show"
    :attach="playerStore.fullscreen ? '#player' : false"
    content-class="dialog-overflow-visible dialog-position-start"
    hide-overlay
    width="500"
    scrollable
    persistent
    no-click-animation
    :scrim="false"
  >
    <v-card>
      <DialogHeader
        @close="markAdding.show = false"
        :header="t('player.mark_dialog.adding_marker')"
        :buttons="buttons"
        closable
      />

      <v-card-text class="pa-2 pa-sm-4 mark-adding">
        <v-row>
          <v-col cols="12"
            md="4">
            <v-select
              v-model="markAdding.type"
              @update:model-value="changeType"
              :items="mark_types"
              :label="t('player.mark_dialog.mark_type')"
              :menu-props="{attach:'.mark-adding'}"
            >
              <template v-slot:selection="{ item }">
                <v-icon size="16"
                  class="mr-1">
                  mdi-{{ item.raw.icon }}
                </v-icon>
                <span class="text-body-2">{{ getMarkTypeText(item.raw) }}</span>
              </template>

              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :prepend-icon="'mdi-'+item.raw.icon"
                  :title="getMarkTypeText(item.raw)"
                  density="compact"
                ></v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12"
            md="8">
            <MetaInputArray
              v-if="is_meta"
              :key="markAdding.meta.id"
              @update:model-value="setVal"
              :model-value="val"
              :meta-id="markAdding.meta.id"
              :multiple="false"
              :autofocus="true"
              :return-object="false"
              :menu-props="{attach:'.mark-adding',contentClass: 'custom-list'}"
              :attach="playerStore.fullscreen ? '.mark-adding' : false"
              :label="t('player.mark_dialog.selected_tag')"
            />
          </v-col>
        </v-row>

        <v-form v-if="is_bookmark"
          ref="form"
          v-model="valid"
          class="mb-4">
          <v-textarea
            v-model="text"
            :rules="[(v) => !!v || t('validation.value_required')]"
            :label="t('common.text')"
            rows="1"
            required
            auto-grow
            autofocus
            filled
          />
        </v-form>

        <!--        <div v-if="markAdding.is_end_time_active"-->
        <!--          class="mb-4">-->
        <!--          <v-chip variant="outlined"-->
        <!--            v-text="msToTime(markAdding.time)"/>-->
        <!--          <span class="mx-4">—</span>-->
        <!--          <v-chip variant="outlined"-->
        <!--            v-text="msToTime(markAdding.end)"/>-->
        <!--        </div>-->

        <v-card class="rounded-xl mb-4"
          variant="tonal"
          color="primary">

          <v-card-text
            class="d-flex align-center justify-space-between py-2 px-3">
            <div class="text-caption mr-4">{{ t('player.mark_dialog.start_time') }}</div>

            <div class="d-flex align-center">
              <v-number-input
                v-model=" markAdding.time"
                @update:model-value="changeEndTime"
                :min="0"
                :max="player.duration"
                :step="1"
                density="compact"
                variant="outlined"
                width="150"
                rounded="xl"
                hide-details
              ></v-number-input>

              <v-btn
                @click="getCurrentTime('time')"
                size="x-small"
                variant="outlined"
                class="ml-2"
                :title="t('player.mark_dialog.sync_with_player')"
                icon>
                <v-icon>mdi-sync</v-icon>
              </v-btn>
              <v-btn
                @click="jumpTo(markAdding.time)"
                size="x-small"
                class="ml-2"
                variant="outlined"
                :title="t('player.mark_dialog.jump_to_time')"
                icon>
                <v-icon>mdi-redo</v-icon>
              </v-btn>
            </div>

            <!--            <v-chip v-if="!markAdding.is_end_time_active"-->
            <!--              variant="outlined"-->
            <!--              size="small"-->
            <!--              v-text="msToTime(markAdding.time)"/>-->
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl"
          :variant="markAdding.is_end_time_active ? 'tonal' : 'text'"
          color="primary">

          <v-card-text :class="{'pa-0':!markAdding.is_end_time_active}"
            class="d-flex align-center justify-space-between py-2 px-3">

            <div class="d-flex align-center">
              <div class="text-caption mr-4">{{ t('player.mark_dialog.end_time') }}</div>
              <v-switch v-model="markAdding.is_end_time_active"
                @update:model-value="changeEndTime"
                density="compact"
                hide-details
                inset
              ></v-switch>
            </div>

            <div v-if="markAdding.is_end_time_active"
              class="d-flex align-center justify-center">
              <v-number-input
                v-model="markAdding.end"
                :min="dialogsStore.markAdding.start"
                :max="player.duration"
                :step="1"
                density="compact"
                variant="outlined"
                rounded="xl"
                width="150"
                hide-details
              ></v-number-input>

              <v-btn
                @click="getCurrentTime('end')"
                size="x-small"
                class="ml-2"
                variant="outlined"
                icon>
                <v-icon>mdi-sync</v-icon>
              </v-btn>
              <v-btn
                @click="jumpTo(markAdding.end)"
                size="x-small"
                class="ml-2"
                variant="outlined"
                icon>
                <v-icon>mdi-redo</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-alert v-if="markAdding.is_end_time_active && markAdding.end - markAdding.time < 0"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4 text-caption"
          rounded="xl"
        > {{ t('player.mark_dialog.end_time_must_be_greater') }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useDialogsStore} from '@/stores/dialogs'
import {useItemsStore} from '@/stores/items'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import MetaInputArray from '@/components/meta/input/MetaInputArray.vue'

const props = defineProps({
  dialog: Boolean,
  meta: Object,
})

const emit = defineEmits(['togglePause', 'addMark'])

// Stores
const appStore = useAppStore()
const playerStore = usePlayerStore()
const dialogsStore = useDialogsStore()
const itemsStore = useItemsStore()
const {t} = useI18n()

// Refs
const form = ref(null)
const val = ref(null)
const text = ref(null)
const valid = ref(false)
const buttons = ref([])

const mark_types = ref([
  {
    value: 'favorite',
    textKey: 'meta.default_names.favorite',
    icon: 'heart',
  },
  {
    value: 'bookmark',
    textKey: 'meta.default_names.bookmark',
    icon: 'bookmark',
  },
])

// Computed
const player = computed(() => playerStore.player)
const markAdding = computed(() => dialogsStore.markAdding)

const is_bookmark = computed(() => {
  return markAdding.value.type === 'bookmark'
})

const is_meta = computed(() => {
  return typeof markAdding.value.type === 'number'
})

// Methods
const initButtons = () => {
  buttons.value = [{
    icon: "plus",
    text: t('common.add'),
    color: "success",
    outlined: false,
    action: add,
  }]
}

const initMarkTypes = () => {
  let pinned = itemsStore.assigned || []
  pinned = pinned.filter((i) => i.meta?.marks)
  pinned = pinned.map((i) => ({
    value: i.meta.id,
    text: i.meta.name,
    icon: i.meta.icon,
  }))

  mark_types.value = [...mark_types.value, ...pinned]
}

const getMarkTypeText = (item) => item.textKey ? t(item.textKey) : item.text

const changeType = (type) => {
  getSliderColor()
  if (typeof type === 'number') {
    const found = (itemsStore.assigned || []).find(i => i.metaId === type)
    if (found) {
      dialogsStore.markAdding.meta = found.meta
    }
  }
}

const getSliderColor = () => {
  const type = dialogsStore.markAdding.type
  if (type == 'favorite') {
    dialogsStore.markAdding.color = '#e91e63'
  } else if (type == 'bookmark') {
    dialogsStore.markAdding.color = '#f44336'
  } else {
    dialogsStore.markAdding.color = '#fff'
  }
}

const changeEndTime = () => {
  if (dialogsStore.markAdding.end < dialogsStore.markAdding.time) {
    dialogsStore.markAdding.end = markAdding.value.time
  }
}

const getCurrentTime = (type) => {
  if (type === 'time') {
    dialogsStore.markAdding.time = player.value.currentTime
  } else if (type === 'end') {
    dialogsStore.markAdding.end = player.value.currentTime
  }
}

const jumpTo = (seconds) => {
  let time = seconds || 0
  if (playerStore.player) {
    playerStore.player.currentTime = time
  }
}

const setVal = (newVal) => {
  val.value = newVal
  const tag = appStore.getTagById(newVal)
  dialogsStore.markAdding.color = tag?.color || '#fff'
}

const add = () => {
  if (is_bookmark.value) {
    if (!form.value) return
    form.value.validate()
    if (!valid.value) return
  } else if (is_meta.value && !val.value) return

  // если время конца отметки меньше время начала
  if (markAdding.value.is_end_time_active) {
    if (markAdding.value.end - markAdding.value.time < 0) return
  }

  let data = {}
  if (markAdding.value.is_end_time_active === false) {
    dialogsStore.markAdding.end = null
  }

  if (is_bookmark.value) {
    data.text = text.value
  } else if (is_meta.value) {
    dialogsStore.markAdding.type = 'meta'
    data.tagId = val.value
  }

  emit("addMark", data)
  dialogsStore.markAdding.show = false
}

// Lifecycle
onMounted(() => {
  initButtons()
  initMarkTypes()
  getSliderColor()
})
</script>