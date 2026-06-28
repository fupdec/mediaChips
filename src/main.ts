import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'

// Internationalization
import { createI18n } from 'vue-i18n'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { en, es, zhHans, ru } from 'vuetify/locale'

// Custom translations
import en_custom from '@/i18n/en'
import cn_custom from '@/i18n/cn'
import es_custom from '@/i18n/es'
import ru_custom from '@/i18n/ru'

// ============ I18N SETUP ============
const messages = {
  en: {
    $vuetify: {
      ...en,
    },
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
  legacy: false,
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
import { createVuetify } from 'vuetify'
import { useI18n } from 'vue-i18n'

const vuetify = createVuetify({
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

  theme: {
    defaultTheme: 'light',
    options: {
      customProperties: true,
    },
    icons: {
      iconfont: 'mdi',
    },
    themes: {
      light: {
        colors: {
          error: '#f24343',
        }
      },
      dark: {
        colors: {
          error: '#f24343',
        }
      },
    },
  },
} as Parameters<typeof createVuetify>[0])

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

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(vuetify)

app.provide('eventBus', eventBus)

const store = useAppStore()
const itemsStore = useItemsStore()

router.beforeEach((_to, _from, next) => {
  itemsStore.isSelect = false
  itemsStore.selection = []
  itemsStore.selected_last = null
  itemsStore.type = ''
  itemsStore.find_duplicates = false
  next()
})

app.use(operable, { router, store })
app.use(readable, { router, store, i18n })

router.isReady().then(() => {
  app.mount('#app')
})
