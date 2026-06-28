const {spawn} = require('child_process')
const {getFfmpegPath, getFfprobePath} = require('./ffmpegPaths')

interface FfprobeStream {
  codec_type?: string
  codec_name?: string
  nb_frames?: number | string
  [key: string]: unknown
}

interface FfprobePayload {
  format?: {
    duration?: number | string
    bit_rate?: number | string
    [key: string]: unknown
  }
  streams?: FfprobeStream[]
}

function runProcess(binary: string, args: string[]): Promise<{stdout: string; stderr: string}> {
  return new Promise((resolve, reject) => {
    const proc = spawn(binary, args, {stdio: ['ignore', 'pipe', 'pipe']})
    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString()
    })
    proc.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString()
    })
    proc.on('error', reject)
    proc.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({stdout, stderr})
        return
      }

      reject(new Error(stderr.trim() || `${binary} exited with code ${code}`))
    })
  })
}

function normalizeFfprobePayload(data: FfprobePayload) {
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

async function ffprobe(filePath: string) {
  const {stdout} = await runProcess(getFfprobePath(), [
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    filePath,
  ])

  return normalizeFfprobePayload(JSON.parse(stdout) as FfprobePayload)
}

async function runFfmpeg(args: string[]) {
  return runProcess(getFfmpegPath(), args)
}

async function extractVideoFrame({
  input,
  output,
  timestamp,
  vf,
}: {
  input: string
  output: string
  timestamp?: string
  vf?: string
}) {
  const args: string[] = []

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

function resolveThumbnailSeekSeconds(duration: number | string | null | undefined, seekRatio = 0.5) {
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

async function extractVideoThumbnail({
  input,
  outputPath,
  height = 320,
  seekRatio = 0.5,
}: {
  input: string
  outputPath: string
  height?: number
  seekRatio?: number
}) {
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

async function combineVideoFrames({
  inputs,
  filterComplex,
  output,
  mapLabel = '[scaled]',
}: {
  inputs: string[]
  filterComplex: string
  output: string
  mapLabel?: string
}) {
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
