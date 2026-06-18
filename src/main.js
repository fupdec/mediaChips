import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'

// Internationalization
import { createI18n } from 'vue-i18n'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { en, es, zhHans, ru } from 'vuetify/locale'

// Custom translations
import en_custom from '@/i18n/en.js'
import cn_custom from '@/i18n/cn.js'
import es_custom from '@/i18n/es.js'
import ru_custom from '@/i18n/ru.js'

// ============ I18N SETUP ============
const messages = {
  en: {
    $vuetify: {
      ...en,
    },
    // Your app messages for English
    ...en_custom
  },
  cn: {
    $vuetify: {
      ...zhHans,
    },
    ...cn_custom,
  },
  es: {
    $vuetify: {
      ...es,
    },
    ...es_custom,
  },
  ru: {
    $vuetify: {
      ...ru,
    },
    ...ru_custom,
  }
}

const i18n = createI18n({
  legacy: false, // Vuetify 3 requires legacy: false
  locale: 'en',
  fallbackLocale: 'en',
  messages,
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false
})

// ============ VUETIFY SETUP ============
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
// Создаем Vuetify после i18n
import { createVuetify } from 'vuetify'
import { useI18n } from 'vue-i18n' // Импортируем useI18n здесь

const vuetify = createVuetify({
  // Locale configuration with adapter
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
    messages: {
      en: { ...en, ...en_custom },
      cn: { ...zhHans, ...cn_custom },
      es: { ...es, ...es_custom },
      ru: { ...ru, ...ru_custom }
    }
  },

  defaults: {
    VProgress: {
      color: 'primary',
    },
    VCheckbox: {
      color: 'primary',
    },
    VSwitch: {
      color: 'primary',
    },
    VTextField: {
      color: 'primary',
    },
    VSelect: {
      color: 'primary',
    },
    VAutocomplete: {
      color: 'primary',
    },
    VSlider: {
      color: 'primary',
    },
  },

  // Theme configuration
  theme: {
    defaultTheme: 'light',
    options: {
      customProperties: true,
    },
    icons: {
      iconfont: 'mdi', // default - only for display purposes
    },
    themes: {
      light: {
        colors: {
          error: '#f24343', // Цвет ошибки
        }
      },
      dark: {
        colors: {
          error: '#f24343', // Цвет ошибки
        }
      },
    },
  },
})

// ============ GLOBAL EVENTS ============
import eventBus from '@/utils/eventBus'

// ============ PINIA STORE ============
import { useAppStore } from '@/stores/app'
import { useItemsStore } from '@/stores/items'

// ============ PLUGINS ============
import operable from '@/plugins/operable'
import readable from '@/plugins/readable'

// ============ CREATE APP ============
const app = createApp(App)
const pinia = createPinia()

// Use plugins in correct order
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(vuetify)

// Provide eventBus
app.provide('eventBus', eventBus)

// Initialize app store
const store = useAppStore()
const itemsStore = useItemsStore()

router.beforeEach((to, from, next) => {
  // сброс перед каждым переходом по руту
  itemsStore.isSelect = false
  itemsStore.selection = []
  itemsStore.selected_last = null
  itemsStore.type = ''
  itemsStore.itemsOnPage = [];
  itemsStore.find_duplicates = false;
  next()
})

// Use custom plugins
app.use(operable, { router, store })
app.use(readable, { router, store })

// Mount app
app.mount('#app')