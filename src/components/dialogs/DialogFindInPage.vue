<template>
  <v-dialog
    :model-value="dialogsStore.findInPage.show"
    width="420"
    @update:model-value="dialogsStore.findInPage.show = $event"
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center px-6 py-4">
        <v-icon
          class="mr-2"
          size="24"
        >
          mdi-magnify
        </v-icon>
        {{ t('systemBar.find') }}
        <v-spacer/>
        <v-btn
          icon
          variant="text"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider/>

      <v-card-text class="pa-6">
        <v-text-field
          ref="queryField"
          v-model="query"
          :label="t('systemBar.find_placeholder')"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          autofocus
          @keydown.enter.prevent="findNext"
        />

        <div
          v-if="resultText"
          class="text-caption text-medium-emphasis mt-3"
        >
          {{ resultText }}
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer/>
        <v-btn
          variant="text"
          @click="close"
        >
          {{ t('common.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded
          :disabled="!query.trim()"
          @click="findNext"
        >
          {{ t('systemBar.find_next') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDialogsStore} from '@/stores/dialogs'

const {t} = useI18n()
const dialogsStore = useDialogsStore()

const query = ref('')
const queryField = ref<{ focus: () => void } | null>(null)
const activeMatch = ref(0)
const totalMatches = ref(0)

const resultText = computed(() => {
  if (!query.value.trim() || totalMatches.value === 0) {
    return query.value.trim() ? t('systemBar.find_no_matches') : ''
  }

  return t('systemBar.find_matches', {
    current: activeMatch.value,
    total: totalMatches.value,
  })
})

function close() {
  dialogsStore.findInPage.show = false
  window.electronAPI?.invoke?.('stopFindInPage')
}

async function findNext() {
  const text = query.value.trim()
  if (!text || !window.electronAPI?.invoke) return

  const result = await window.electronAPI.invoke('findInPage', {
    text,
    forward: true,
    findNext: totalMatches.value > 0,
  }) as { activeMatchOrdinal?: number; matches?: number } | null

  activeMatch.value = result?.activeMatchOrdinal || 0
  totalMatches.value = result?.matches || 0
}

watch(
  () => dialogsStore.findInPage.show,
  async (visible) => {
    if (!visible) {
      query.value = ''
      activeMatch.value = 0
      totalMatches.value = 0
      window.electronAPI?.invoke?.('stopFindInPage')
      return
    }

    await nextTick()
    queryField.value?.focus()
  },
)
</script>
