import en from '@/i18n/en.js'
import ru from '@/i18n/ru.js'
import cn from '@/i18n/cn.js'
import es from '@/i18n/es.js'

const catalogs = { en, ru, cn, es }

function getByPath(obj, keyPath) {
  return keyPath.split('.').reduce((value, key) => value?.[key], obj)
}

export function translate(key, params = {}, locale = 'en') {
  let text = getByPath(catalogs[locale], key) || getByPath(catalogs.en, key) || key

  for (const [name, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
  }

  return text
}

export default translate
