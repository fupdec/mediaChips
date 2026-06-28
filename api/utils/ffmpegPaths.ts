const fs = require('fs')

function resolveBundledBinary(modulePath: string | null | undefined): string {
  if (!modulePath) return modulePath as string

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

function getFfmpegPath(): string {
  return resolveBundledBinary(require('ffmpeg-static'))
}

function getFfprobePath(): string {
  return resolveBundledBinary(require('ffprobe-static').path)
}

module.exports = {
  getFfmpegPath,
  getFfprobePath,
  resolveBundledBinary,
}
