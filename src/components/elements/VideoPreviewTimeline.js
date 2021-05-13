const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const pathToFfmpeg = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
ffmpeg.setFfmpegPath(pathToFfmpeg)

class VideoPreviewTimeline {
  constructor(opts) {
    this.video = opts.video
    this.pathToUserData = opts.pathToUserData
  }

  async createFrame (timestamp, output) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .addOption('-ss', timestamp)
        .addOption('-i', this.video.path)
        .addOption('-frames:v', '1')
        .addOption('-vf',`scale=-1:180`)
        .save(output)
        .on('end', () => { resolve(output) })
        .on('error', (e) => { reject(e) })
    })
  }

  async generate () {
    let parts = [10, 20, 30, 40, 50, 60, 70, 80, 90]
    let timestamps = parts.map(i=>(new Date(Math.floor(this.video.duration*(i/100)*1000)).toISOString().substr(11, 8))) 
    let framePromises = []

    for (let i = 0; i < timestamps.length; i++) {
      let output = path.join(this.pathToUserData, `/media/timeline/${this.video.id}_${parts[i]}.jpg`)
      framePromises.push(this.createFrame(timestamps[i], output))
    }

    let result = await Promise.all(framePromises);

    return result
  }
}

module.exports = VideoPreviewTimeline