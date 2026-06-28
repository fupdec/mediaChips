const fs = require('fs')
const {isClientAbortError} = require('../../../app/server/fileResolver')

function streamVideoFile(req, res, filePath, contentType = 'video/mp4') {
  const videoStat = fs.statSync(filePath)
  const fileSize = videoStat.size
  const videoRange = req.headers.range

  if (videoRange) {
    const parts = videoRange.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = (end - start) + 1
    const file = fs.createReadStream(filePath, {start, end})

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    }

    res.writeHead(206, head)
    file.on('error', (streamErr) => {
      if (!isClientAbortError(streamErr)) {
        console.error('Video stream error:', streamErr)
      }
      file.destroy()
    })
    req.on('close', () => file.destroy())
    file.pipe(res)
    return
  }

  const head = {
    'Content-Length': fileSize,
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
  }

  res.writeHead(200, head)
  const file = fs.createReadStream(filePath)
  file.on('error', (streamErr) => {
    if (!isClientAbortError(streamErr)) {
      console.error('Video stream error:', streamErr)
    }
    file.destroy()
  })
  req.on('close', () => file.destroy())
  file.pipe(res)
}

module.exports = {
  streamVideoFile,
}
