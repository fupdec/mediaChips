interface DefaultSettingEntry {
  option: string
  value: unknown
}

function loadDefaultSettingsList(): DefaultSettingEntry[] {
  const Settings = require('../../app/configs/default-settings')

  if (Array.isArray(Settings)) {
    if (Settings[0] && typeof Settings[0] === 'object' && Settings[0] !== null && 'option' in Settings[0]) {
      return Settings as DefaultSettingEntry[]
    }
    if (Array.isArray(Settings[1])) {
      return Settings[1] as DefaultSettingEntry[]
    }
  }

  const values = Object.values(Settings as Record<string, unknown>)
  const nested = values.find((value): value is DefaultSettingEntry[] => Array.isArray(value))
  if (Array.isArray(nested)) {
    return nested
  }

  return Array.isArray(values[0]) ? values[0] as DefaultSettingEntry[] : []
}

module.exports = {
  loadDefaultSettingsList,
}
