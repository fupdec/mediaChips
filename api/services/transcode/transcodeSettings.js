const DEFAULTS = {
  transcodeUnsupportedFormats: '1',
  transcodeMaxHeight: '1080',
  transcodeCacheMaxGb: '5',
}

async function getTranscodeSettings(db) {
  const settings = {...DEFAULTS}

  if (!db?.Setting) {
    return settings
  }

  try {
    const rows = await db.Setting.findAll({
      where: {option: Object.keys(DEFAULTS)},
      raw: true,
    })

    for (const row of rows) {
      settings[row.option] = String(row.value)
    }
  } catch (error) {
    console.error('Failed to load transcode settings:', error)
  }

  return settings
}

function isTranscodeEnabled(settings) {
  return String(settings.transcodeUnsupportedFormats) === '1'
}

function getMaxHeight(settings) {
  const value = Number(settings.transcodeMaxHeight)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

module.exports = {
  DEFAULTS,
  getTranscodeSettings,
  isTranscodeEnabled,
  getMaxHeight,
}
