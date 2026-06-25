const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')

let configured = false

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

function configureFfmpeg() {
  if (configured) return

  const ffmpegPath = resolveBundledBinary(require('ffmpeg-static'))
  const ffprobePath = resolveBundledBinary(require('ffprobe-static').path)

  ffmpeg.setFfmpegPath(ffmpegPath)
  ffmpeg.setFfprobePath(ffprobePath)
  configured = true
}

module.exports = {
  configureFfmpeg,
  resolveBundledBinary,
}
