const {spawn} = require('child_process')
const {getFfmpegPath} = require('../../utils/ffmpegPaths')
const {isClientAbortError} = require('../../../app/server/fileResolver')

function buildFfmpegLiveArgs({inputPath, startTime = 0, duration = null, audioOnly, maxHeight}) {
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin']

  if (startTime > 0) {
    args.push('-ss', String(startTime))
  }

  args.push('-i', inputPath)

  if (duration != null && duration > 0) {
    args.push('-t', String(duration))
  }

  if (audioOnly) {
    args.push('-vn', '-c:a', 'aac', '-b:a', '192k')
  } else {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '23')
    if (maxHeight) {
      args.push('-vf', `scale='min(${maxHeight},iw)':-2`)
    }
    args.push('-c:a', 'aac', '-b:a', '192k')
  }

  args.push(
    '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
    '-f', 'mp4',
    'pipe:1',
  )

  return args
}

function isIgnorableStreamError(error) {
  if (!error) return true
  if (isClientAbortError(error)) return true

  const code = error.code
  return code === 'ECONNRESET'
    || code === 'EPIPE'
    || code === 'ERR_STREAM_WRITE_AFTER_END'
}

function buildSessionKey(streamKey, startTime, maxHeight = null) {
  const heightPart = maxHeight == null ? 'auto' : String(maxHeight)
  return `${streamKey}@${Number(startTime).toFixed(2)}@${heightPart}`
}

function shouldRejectDuplicateStream(existing, now = Date.now()) {
  if (!existing || existing.stopped) return false
  return (now - (existing.startedAt || 0)) < 5000
}

function createLiveStreamRegistry() {
  const activeStreams = new Map()

  function destroyActiveStream(active) {
    if (!active || active.stopped) return

    active.stopped = true
    activeStreams.delete(active.sessionKey)

    if (active.req && active.onClientAbort) {
      active.req.removeListener('aborted', active.onClientAbort)
    }

    if (active.req?.socket && active.onSocketClose) {
      active.req.socket.removeListener('close', active.onSocketClose)
    }

    if (active.res && active.onResponseError) {
      active.res.removeListener('error', active.onResponseError)
      active.res.removeListener('close', active.onResponseClose)
    }

    if (active.proc?.stdout && active.res) {
      try {
        active.proc.stdout.unpipe(active.res)
      } catch {
        // ignore
      }
    }

    if (active.pipe) {
      try {
        active.pipe.destroy()
      } catch {
        // ignore
      }
    }

    try {
      active.proc?.stdout?.destroy()
      active.proc?.stderr?.destroy()
    } catch {
      // ignore
    }

    try {
      active.proc?.kill('SIGKILL')
    } catch {
      // ignore
    }

    if (active.res && !active.res.writableEnded && !active.res.destroyed) {
      try {
        active.res.destroy()
      } catch {
        // ignore
      }
    }
  }

  function stopStreamsForFile(streamKey, exceptSessionKey = null) {
    for (const [key, active] of activeStreams) {
      if (key.startsWith(`${streamKey}@`) && key !== exceptSessionKey) {
        destroyActiveStream(active)
      }
    }
  }

  function stopStream(streamKey) {
    stopStreamsForFile(streamKey)
  }

  function pipeLiveTranscode(req, res, {
    streamKey,
    inputPath,
    startTime = 0,
    duration = null,
    audioOnly = false,
    maxHeight = null,
  }) {
    const sessionKey = buildSessionKey(streamKey, startTime, maxHeight)
    const existing = activeStreams.get(sessionKey)

    if (existing && !existing.stopped) {
      if (shouldRejectDuplicateStream(existing)) {
        res.status(409).end()
        return
      }
      destroyActiveStream(existing)
    }

    stopStreamsForFile(streamKey, sessionKey)

    res.status(200)
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Accept-Ranges', 'none')

    const args = buildFfmpegLiveArgs({
      inputPath,
      startTime,
      duration,
      audioOnly,
      maxHeight,
    })

    const proc = spawn(getFfmpegPath(), args, {stdio: ['ignore', 'pipe', 'pipe']})
    let stderr = ''

    const active = {
      sessionKey,
      streamKey,
      startedAt: Date.now(),
      proc,
      res,
      req,
      pipe: null,
      stopped: false,
      onClientAbort: null,
      onSocketClose: null,
      onResponseError: null,
      onResponseClose: null,
    }

    activeStreams.set(sessionKey, active)

    const cleanup = () => destroyActiveStream(active)

    active.onResponseClose = () => {
      if (active.stopped) return
      if (!res.writableFinished && !res.writableEnded) {
        cleanup()
      }
    }

    active.onResponseError = (error) => {
      if (!isIgnorableStreamError(error)) {
        console.error('Live transcode response error:', error)
      }
      cleanup()
    }

    active.onClientAbort = cleanup

    res.on('error', active.onResponseError)
    res.on('close', active.onResponseClose)
    req.on('aborted', active.onClientAbort)

    if (req.socket) {
      active.onSocketClose = () => {
        if (active.stopped || res.writableFinished || res.writableEnded) return
        cleanup()
      }
      req.socket.on('close', active.onSocketClose)
    }

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.stdout.on('error', (error) => {
      if (!isIgnorableStreamError(error)) {
        console.error('Live transcode stdout error:', error)
      }
      cleanup()
    })

    active.pipe = proc.stdout.pipe(res, {end: true})
    active.pipe.on('error', (error) => {
      if (!isIgnorableStreamError(error)) {
        console.error('Live transcode pipe error:', error)
      }
      cleanup()
    })

    proc.on('error', (error) => {
      console.error('Live transcode process error:', error)
      cleanup()
      if (!res.headersSent) {
        res.status(500).json({message: error.message})
      }
    })

    proc.on('close', (code) => {
      if (active.stopped) return

      if (code !== 0 && !res.writableEnded && stderr) {
        console.error('Live transcode failed:', stderr.trim())
      }

      destroyActiveStream(active)
    })
  }

  function stopAll() {
    for (const active of [...activeStreams.values()]) {
      destroyActiveStream(active)
    }
  }

  return {
    pipeLiveTranscode,
    stopStream,
    stopAll,
  }
}

module.exports = {
  buildFfmpegLiveArgs,
  buildSessionKey,
  shouldRejectDuplicateStream,
  createLiveStreamRegistry,
  isIgnorableStreamError,
}
