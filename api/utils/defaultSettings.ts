import Settings from '../../app/configs/default-settings'

interface DefaultSettingEntry {
  option: string
  value: unknown
}

function loadDefaultSettingsList(): DefaultSettingEntry[] {
  if (!Array.isArray(Settings)) return []
  return Settings as DefaultSettingEntry[]
}

export { loadDefaultSettingsList }
