import { createI18n } from 'vue-i18n'
import type { createVuetify } from 'vuetify'
import { en } from 'vuetify/locale'
import en_custom from '@/i18n/en'

type AppLocale = 'en' | 'cn' | 'es' | 'ru'
type NonEnglishLocale = Exclude<AppLocale, 'en'>
type VuetifyInstance = ReturnType<typeof createVuetify>
type LocaleMessages = Record<string, unknown>

const loadedLocales = new Set<AppLocale>(['en'])
let vuetifyInstance: VuetifyInstance | null = null

const customLocaleLoaders: Record<NonEnglishLocale, () => Promise<{ default: Record<string, unknown> }>> = {
  cn: () => import('@/i18n/cn'),
  es: () => import('@/i18n/es'),
  ru: () => import('@/i18n/ru'),
}

const vuetifyLocaleLoaders: Record<NonEnglishLocale, () => Promise<LocaleMessages>> = {
  cn: () => import('vuetify/locale').then((m) => m.zhHans),
  es: () => import('vuetify/locale').then((m) => m.es),
  ru: () => import('vuetify/locale').then((m) => m.ru),
}

function normalizeLocale(locale: string): AppLocale {
  if (locale === 'cn' || locale === 'es' || locale === 'ru') return locale
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      $vuetify: {...en},
      ...en_custom,
    },
  },
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false,
})

export function registerVuetifyForLocales(vuetify: VuetifyInstance): void {
  vuetifyInstance = vuetify
}

export function isLocaleLoaded(locale: string): boolean {
  return loadedLocales.has(normalizeLocale(locale))
}

export async function loadLocale(locale: string): Promise<AppLocale> {
  const code = normalizeLocale(locale)
  if (loadedLocales.has(code)) return code

  const loaderCode = code as NonEnglishLocale
  const [customModule, vuetifyLocale] = await Promise.all([
    customLocaleLoaders[loaderCode](),
    vuetifyLocaleLoaders[loaderCode](),
  ])

  const messages = {
    $vuetify: {...vuetifyLocale},
    ...customModule.default,
  }

  i18n.global.setLocaleMessage(code, messages as (typeof i18n.global.messages.value)['en'])
  if (vuetifyInstance) {
    const vuetifyMessages = vuetifyInstance.locale.messages.value as Record<string, Record<string, unknown>>
    vuetifyMessages[code] = {
      ...vuetifyLocale,
      ...customModule.default,
    }
  }
  loadedLocales.add(code)

  return code
}

export type { AppLocale }
