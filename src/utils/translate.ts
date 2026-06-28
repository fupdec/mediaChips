import en from '@/i18n/en'
import ru from '@/i18n/ru'
import cn from '@/i18n/cn'
import es from '@/i18n/es'

type Locale = 'en' | 'ru' | 'cn' | 'es'

export type { Locale }

const catalogs: Record<Locale, Record<string, unknown>> = { en, ru, cn, es }

function getByPath(obj: Record<string, unknown> | undefined, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

export function translate(
  key: string,
  params: Record<string, string | number> = {},
  locale: Locale = 'en',
): string {
  let text = getByPath(catalogs[locale], key) || getByPath(catalogs.en, key) || key

  for (const [name, value] of Object.entries(params)) {
    text = String(text).replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
  }

  return String(text)
}

export default translate
