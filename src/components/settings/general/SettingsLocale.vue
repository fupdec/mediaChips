<template>
  <div class="language-switcher">
    <v-select
      :model-value="settingsStore.locale"
      @update:modelValue="value => changeLanguage(value)"
      :items="locales"
      :label="t('settings_labels.general.language')"
      rounded="xl"
      variant="outlined"
      density="comfortable"
      width="300"
    >
      <template #selection="{ item }">
        <country-flag :country="selectedLocale.flag" size="big" class="lang-flag"/>
        <span class="pl-2">{{ t(selectedLocale.nameKey) }}</span>
        <span class="pl-2">({{ selectedLocale.nativeName }})</span>
      </template>
      <template #item="{ item }">
        <v-list-item @click="changeLanguage(item.raw.code)" color="primary">
          <template #prepend>
            <country-flag :country="item.raw.flag" size="big" class="lang-flag mr-2"/>
          </template>

          <v-list-item-title>
            <div class="d-flex align-center justify-space-between">
              <div>
                <span class="text-body-1 text-high-emphasis">{{ t(item.raw.nameKey) }}</span>
                <div class="text-caption text-medium-emphasis">
                  {{ item.raw.nativeName }}
                </div>
              </div>
            </div>
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-select>

    <!--    <v-menu location="bottom end">-->
    <!--      <template #activator="{ props }">-->
    <!--        <v-btn-->
    <!--          v-bind="props"-->
    <!--          variant="text"-->
    <!--          class="language-button"-->
    <!--          size="small"-->
    <!--        >-->
    <!--          <country-flag :country="currentLocale.flag" size="big" class="lang-flag mr-2"/>-->
    <!--          <span class="language-code">{{ currentLocale.code.toUpperCase() }}</span>-->
    <!--          <v-icon end size="small">mdi-chevron-down</v-icon>-->
    <!--        </v-btn>-->
    <!--      </template>-->

    <!--      <v-card width="280">-->
    <!--        <v-list density="compact">-->
    <!--          <v-list-subheader>{{ $t('language.select') }}</v-list-subheader>-->

    <!--          -->
    <!--        </v-list>-->
    <!--      </v-card>-->
    <!--    </v-menu>-->
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import CountryFlag from 'vue-country-flag-next'
import {useSettingsStore} from '@/stores/settings'
import {setOption} from '@/services/settingsService'

const settingsStore = useSettingsStore()

const {locale, t} = useI18n()

// Флаги (можно использовать emoji или изображения)
const locales = [
  {
    code: 'en',
    nameKey: 'settings_labels.general.languages.en',
    nativeName: 'English',
    flag: 'us',
  },
  {
    code: 'es',
    nameKey: 'settings_labels.general.languages.es',
    nativeName: 'Español',
    flag: 'es',
  },
  {
    code: 'cn',
    nameKey: 'settings_labels.general.languages.cn',
    nativeName: '中文',
    flag: 'cn',
  },
  {
    code: 'ru',
    nameKey: 'settings_labels.general.languages.ru',
    nativeName: 'Русский',
    flag: 'ru',
  },
]

const selectedLocale = computed(() => locales.find(i => i.code === settingsStore.locale))

const changeLanguage = (langCode) => {
  locale.value = langCode

  setOption(langCode, "locale")

  document.documentElement.lang = langCode
}
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
}

.quick-toggle {
  display: flex;
  gap: 4px;
  align-items: center;
}

.language-button {
  text-transform: none;
  font-weight: 500;
}

.language-code {
  font-size: 0.875rem;
  font-weight: 600;
}

.active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
}
</style>