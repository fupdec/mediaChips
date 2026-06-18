<template>
  <div class="mx-4">
    <settings-category-divider
      :title="$t('settings_labels.tools.adult_features')"
      icon="fruit-cherries"
    >
      <template #actions>
        <button-documentation id="data_scraper"></button-documentation>
      </template>
    </settings-category-divider>

    <settings-switch
      :title="$t('settings_labels.tools.data_scraper')"
      :hint="$t('settings_labels.tools.data_scraper_hint')"
      option="showAdultContent"
    ></settings-switch>

    <v-card v-if="settingsStore.showAdultContent == '1'"
      color="rgb(150 150 150 / 9%)"
      variant="flat">
      <v-row>
        <v-col cols="12"
          sm="6">
          <v-autocomplete
            :model-value="selected_meta"
            @update:model-value="updateSettings"
            :items="meta_tags"
            item-value="id"
            item-text="name"
            :label="$t('settings_labels.tools.performers_meta')"
            :placeholder="$t('settings_labels.tools.select_meta')"
            return-object
            variant="filled"
          >
            <template v-slot:selection="{ item }">
              <v-icon start>mdi-{{ item.raw.icon }}</v-icon>
              <span>{{ item.raw.name }}</span>
            </template>
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template #title>
                  <v-icon start>mdi-{{ item.raw.icon }}</v-icon>
                  <span>{{ item.raw.name }}</span>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12"
          sm="6">
          <v-btn
            @click="dialogsStore.scraperConfig.show = true"
            :disabled="!selected_meta"
            class="mb-4"
            color="primary"
            rounded
            variant="flat"
          >
            <DialogScraperConfig
              :meta="selected_meta"
            ></DialogScraperConfig>

            <v-icon start>mdi-search-web</v-icon>
            {{ $t('settings_labels.tools.configure_scraper') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, defineAsyncComponent} from 'vue'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import axios from 'axios'
import _ from 'lodash'
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue";
import SettingsCategoryDivider
  from "@/components/ui/SettingsCategoryDivider.vue";
import SettingsSwitch from "@/components/ui/SettingsSwitch.vue";
import {useEventBus} from "@/utils/eventBus";

const DialogScraperConfig = defineAsyncComponent(() => import("@/components/dialogs/DialogScraperConfig.vue"))

const store = useAppStore()
const settingsStore = useSettingsStore()
const dialogsStore = useDialogsStore()

const eventBus = useEventBus()

const selected_meta = ref(null)

const apiUrl = computed(() => store.localhost)

const meta_tags = computed(() => {
  const metas = store.meta?.filter(i => i.type === 'array') || []
  return _.sortBy(metas, 'name')
})

async function updateSettings(meta) {
  if (!meta) return

  // Сбросить scraper для всех мета
  const allMeta = store.meta || []
  for (let i of allMeta) {
    try {
      await axios({
        method: "put",
        url: `${apiUrl.value}/api/Meta/${i.id}`,
        data: {scraper: false}
      })
    } catch (error) {
      console.error('Error updating meta setting:', error)
    }
  }

  // Установить scraper для выбранной мета
  try {
    await axios({
      method: "put",
      url: `${apiUrl.value}/api/Meta/${meta.id}`,
      data: {scraper: true}
    })

    eventBus.emit('getMeta')
  } catch (error) {
    console.error('Error updating selected meta:', error)
  }
}

onMounted(() => {
  if (meta_tags.value) {
    selected_meta.value = meta_tags.value.find(i => i.scraper)
  }
})
</script>