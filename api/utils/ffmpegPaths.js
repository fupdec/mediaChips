const fs = require('fs')

function resolveBundledBinary(modulePath) {
  if (!modulePath) return modulePath

  const candidates = [modulePath]

  if (modulePath.includes('app.asar')) {
    candidates.unshift(modulePath.replace('app.asar', 'app.asar.unpacked'))
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return modulePath
}

function getFfmpegPath() {
  return resolveBundledBinary(require('ffmpeg-static'))
}

function getFfprobePath() {
  return resolveBundledBinary(require('ffprobe-static').path)
}

module.exports = {
  getFfmpegPath,
  getFfprobePath,
  resolveBundledBinary,
}
