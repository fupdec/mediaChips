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
        .on('end', () => {
          setTimeout(() => {
            resolve(output)
          }, 500)
        })
        .on('error', (e) => { reject(e) })
    })
  }

  async generate () {
    let parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
    let timestamps = parts.map(i=>(new Date(Math.floor(this.video.duration*(i/100)*1000)).toISOString().substr(11, 8))) 
    let framePromises = []
    
    const timelinesPath = path.join(this.pathToUserData, `/media/timelines/`)
    for (let i = 0; i < timestamps.length; i++) {
      let output = path.join(timelinesPath, `${this.video.id}_${parts[i]}.jpg`)
      framePromises.push(this.createFrame(timestamps[i], output))
    }

    await Promise.all(framePromises)
      .catch(err=>{
        // console.log(err)
      })
  }
}

module.exports = VideoPreviewTimeline