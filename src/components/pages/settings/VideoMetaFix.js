const path = require('path')
import store from '@/store/index.js'

const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(path.join(store.getters.getPathToUserData, '/ffmpeg/ffmpeg.exe')) 
ffmpeg.setFfprobePath(path.join(store.getters.getPathToUserData, '/ffmpeg/ffprobe.exe'))


// get meta from file
function getVideoMetadata (pathToFile) {
  return new Promise((resolve, reject) => {
    return ffmpeg.ffprobe(pathToFile, (error, info) => {
      if (error) {
        return reject(error)
      } else return resolve(info)
    })
  })
}


var scanMeta = async function(pathToFile) {
  let resolution 
  await getVideoMetadata(pathToFile)
    .then(meta=>{
      for(let i = 0; i < meta.streams.length; i++) {
        if (meta.streams[i].codec_type === 'video') {
          resolution = meta.streams[i].width + 'x' + meta.streams[i].height
        } 
      }
    })
    .catch((err) => { 
      resolution = 'error'
      console.log(err)
    })
  return resolution
}

export default scanMeta