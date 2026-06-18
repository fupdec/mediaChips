<template>
  <div>
    <div class="tool-row">
      <v-btn
        @click="openSuggestedTags"
        :loading="loading"
        color="primary"
        rounded
        variant="flat"
      >
        <v-icon
          icon="mdi-tag-plus-outline"
          start
        />
        {{ t('media.adding.add_suggested_tags') }}
      </v-btn>

      <v-tooltip :text="t('settings_labels.tools.analyze_paths_tooltip')">
        <template #activator="{ props }">
          <v-icon
            v-bind="props"
            class="ml-3 text-medium-emphasis"
            icon="mdi-help-circle-outline"
          />
        </template>
      </v-tooltip>
    </div>

    <v-alert
      v-if="message"
      :type="messageType"
      class="mt-3 mb-4"
      density="compact"
      rounded="xl"
      variant="tonal"
    >
      {{ message }}
    </v-alert>

    <TagsAdd :button="false"/>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useEventBus} from '@/utils/eventBus'
import TagsAdd from '@/components/app/appbar/elements/TagsAdd.vue'

const appStore = useAppStore()
const eventBus = useEventBus()
const {t} = useI18n()

const loading = ref(false)
const message = ref('')
const messageType = ref('info')

const apiUrl = computed(() => appStore.localhost)

async function openSuggestedTags() {
  loading.value = true
  message.value = ''

  try {
    const res = await axios.post(`${apiUrl.value}/api/Task/suggestTagsFromPaths`, {
      limit: 150,
      maxWords: 3,
      excludeExisting: true,
    })

    const names = (res.data?.suggestions || [])
      .map(item => item.word)
      .filter(Boolean)
      .slice(0, 150)

    if (names.length === 0) {
      messageType.value = 'info'
      message.value = t('notifications_text.suggested_tags_not_found')
      return
    }

    eventBus.emit('openTagsAddWithNames', {
      names,
      title: t('notifications_text.suggested_tags_title'),
    })

    messageType.value = 'success'
    message.value = t('notifications_text.found_suggested_tags', {count: names.length})
  } catch (error) {
    console.error(error)
    messageType.value = 'error'
    message.value = t('notifications_text.suggest_tags_failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.tool-row {
  display: flex;
  align-items: center;
}
</style>
