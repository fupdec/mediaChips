<template>
  <div class="mx-4">
    <div class="d-flex">
      <div>
        <div>{{ t('aboutApp.version', {version: appVersion}) }}</div>
        <div>{{ t('aboutApp.contributors') }}</div>
        <v-btn
          @click="dialogs.versions = true"
          class="px-5 mt-2 mr-2"
          color="primary"
          rounded
          variant="flat"
          dark
        >
          <v-icon start>mdi-text</v-icon>
          {{ t('aboutApp.version_history') }}
        </v-btn>
        <v-btn
          @click="openLink('https://mediachips.app/')"
          class="px-5 mt-2 mr-2"
          color="#7059b7"
          rounded
          variant="flat"
          dark
        >
          <v-icon start>mdi-web</v-icon>
          {{ t('aboutApp.website') }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <div class="text-center d-flex flex-column">
        <img :src="logoPath" alt="MediaChips" width="64" height="64"/>
        <span>{{ currentYear }}</span>
      </div>
    </div>

    <v-divider class="my-4"></v-divider>

    <div class="d-flex flex-column">
      <div class="mb-4">
        {{ t('aboutApp.libraries_thanks') }}
      </div>
      <div class="d-flex flex-wrap">
        <span
          v-for="lib in libraries"
          :key="lib.name"
          :title="`${lib.name}@${lib.version}`"
          @click="openLink(lib.url)"
          class="mr-2 link"
        >
          {{ lib.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useDialogsStore} from '@/stores/dialogs'
import {getProjectDependencies} from '@/utils/projectDependencies'

const {t} = useI18n()
const appStore = useAppStore()
const dialogsStore = useDialogsStore()

const libraries = getProjectDependencies()
const appVersion = computed(() => appStore.appVersion)
const dialogs = computed(() => dialogsStore)
const currentYear = new Date().getFullYear()

const logoPath = computed(() => {
  try {
    return new URL('/icons/icon.png', import.meta.url).href
  } catch {
    return '/icons/icon.png'
  }
})

const openLink = (link) => {
  window.open(link, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.link {
  margin-right: 5px;
  cursor: pointer;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.link:hover {
  color: rgb(var(--v-primary-darken-2));
}
</style>
