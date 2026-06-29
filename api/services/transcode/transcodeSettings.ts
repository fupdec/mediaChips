import { createSettingsRepository } from '../../db/repositories/settings'

const DEFAULTS = {
  transcodeUnsupportedFormats: '1',
  transcodeMaxHeight: '1080',
  transcodeCacheMaxGb: '5',
} as const

type TranscodeSettingKey = keyof typeof DEFAULTS
type TranscodeSettings = Record<TranscodeSettingKey, string>

interface TranscodeDb {
  drizzle?: import('../../db/client').DrizzleClient
}

async function getTranscodeSettings(db: TranscodeDb | null | undefined): Promise<TranscodeSettings> {
  const settings: TranscodeSettings = {...DEFAULTS}

  if (!db?.drizzle) {
    return settings
  }

  try {
    const rows = createSettingsRepository(db.drizzle)
      .findByOptions(Object.keys(DEFAULTS))

    for (const row of rows) {
      const key = row.option as TranscodeSettingKey
      if (key in settings) {
        settings[key] = String(row.value)
      }
    }
  } catch (error) {
    console.error('Failed to load transcode settings:', error)
  }

  return settings
}

function isTranscodeEnabled(settings: TranscodeSettings): boolean {
  return String(settings.transcodeUnsupportedFormats) === '1'
}

function getMaxHeight(settings: TranscodeSettings): number | null {
  const value = Number(settings.transcodeMaxHeight)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

function parseMaxHeightOverride(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = Number(value)
  if (!Number.isFinite(num)) return undefined
  if (num <= 0) return null
  return num
}

module.exports = {
  DEFAULTS,
  getTranscodeSettings,
  isTranscodeEnabled,
  getMaxHeight,
  parseMaxHeightOverride,
}

export {
  DEFAULTS,
  getTranscodeSettings,
  isTranscodeEnabled,
  getMaxHeight,
  parseMaxHeightOverride,
}
