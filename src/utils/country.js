import { Countries } from '../assets/Countries.js'

export const COUNTRY_DELIMITER = '\x1E'

const countryNames = new Set(Countries.map((country) => country.name))

export function parseCountries(stored) {
  if (!stored) return []

  if (stored.includes(COUNTRY_DELIMITER)) {
    return stored.split(COUNTRY_DELIMITER).filter(Boolean)
  }

  const namesByLength = [...countryNames].sort((a, b) => b.length - a.length)
  const result = []
  let remaining = stored

  while (remaining.length > 0) {
    if (remaining.startsWith(',')) {
      remaining = remaining.slice(1)
      continue
    }

    let matched = false

    for (const name of namesByLength) {
      if (remaining === name || remaining.startsWith(`${name},`)) {
        result.push(name)
        remaining = remaining.slice(name.length)
        if (remaining.startsWith(',')) remaining = remaining.slice(1)
        matched = true
        break
      }
    }

    if (!matched) {
      const commaIndex = remaining.indexOf(',')
      if (commaIndex === -1) {
        result.push(remaining)
        break
      }
      result.push(remaining.slice(0, commaIndex))
      remaining = remaining.slice(commaIndex + 1)
    }
  }

  return result.filter(Boolean)
}

export function serializeCountries(countries) {
  if (!countries || !countries.length) return null
  return countries.join(COUNTRY_DELIMITER)
}

export function getCountryCode(name) {
  const country = Countries.find((item) => item.name === name)
  return country ? country.code : ''
}
