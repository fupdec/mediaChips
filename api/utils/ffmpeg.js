const {spawn} = require('child_process')
const {getFfmpegPath, getFfprobePath} = require('./ffmpegPaths')

function runProcess(binary, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(binary, args, {stdio: ['ignore', 'pipe', 'pipe']})
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    proc.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({stdout, stderr})
        return
      }

      reject(new Error(stderr.trim() || `${binary} exited with code ${code}`))
    })
  })
}

function normalizeFfprobePayload(data) {
  const format = {
    ...(data.format || {}),
    duration: Number(data.format?.duration || 0),
    bit_rate: data.format?.bit_rate,
  }

  const streams = (data.streams || []).map((stream) => ({
    ...stream,
    nb_frames: stream.nb_frames != null ? Number(stream.nb_frames) : undefined,
  }))

  return {format, streams}
}

async function ffprobe(filePath) {
  const {stdout} = await runProcess(getFfprobePath(), [
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    filePath,
  ])

  return normalizeFfprobePayload(JSON.parse(stdout))
}

async function runFfmpeg(args) {
  return runProcess(getFfmpegPath(), args)
}

async function extractVideoFrame({input, output, timestamp, vf}) {
  const args = []

  if (timestamp) {
    args.push('-ss', timestamp)
  }

  args.push('-i', input, '-frames:v', '1')

  if (vf) {
    args.push('-vf', vf)
  }

  args.push('-y', output)
  await runFfmpeg(args)
  return output
}

function resolveThumbnailSeekSeconds(duration, seekRatio = 0.5) {
  const normalizedDuration = Number(duration || 0)

  if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0.1) {
    return 1
  }

  const seekSeconds = normalizedDuration * seekRatio
  return Math.min(
    Math.max(seekSeconds, 0),
    Math.max(normalizedDuration - 0.1, 0),
  )
}

async function extractVideoThumbnail({input, outputPath, height = 320, seekRatio = 0.5}) {
  let seekSeconds = 1

  try {
    const {format} = await ffprobe(input)
    seekSeconds = resolveThumbnailSeekSeconds(format.duration, seekRatio)
  } catch {
    // Skip the common all-black first frame when metadata is unavailable.
  }

  await runFfmpeg([
    '-ss',
    String(seekSeconds),
    '-i',
    input,
    '-vf',
    `scale=-1:${height}`,
    '-frames:v',
    '1',
    '-y',
    outputPath,
  ])
  return outputPath
}

async function combineVideoFrames({inputs, filterComplex, output, mapLabel = '[scaled]'}) {
  const args = ['-y']

  for (const input of inputs) {
    args.push('-i', input)
  }

  args.push('-filter_complex', filterComplex, '-map', mapLabel, output)
  await runFfmpeg(args)
}

module.exports = {
  ffprobe,
  runFfmpeg,
  extractVideoFrame,
  extractVideoThumbnail,
  combineVideoFrames,
  resolveThumbnailSeekSeconds,
}
