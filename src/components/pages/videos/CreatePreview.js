const fs = require('fs')
const path = require('path')

import store from '@/store/index.js'

const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(path.join(store.getters.getPathToUserData, '/ffmpeg/ffmpeg.exe')) 
ffmpeg.setFfprobePath(path.join(store.getters.getPathToUserData, '/ffmpeg/ffprobe.exe'))

const tempPath = path.join(store.getters.getPathToUserData, '/media/temp/')
const previewsPath = path.join(store.getters.getPathToUserData, '/media/previews/')

const cachePath = path.join(store.getters.getPathToUserData, '/media/temp/parts')

function clearCache(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) throw err
  
    for (const file of files) {
      fs.unlink(path.join(directory, file), err => {
        if (err) throw err
      })
    }
  })
}

function move(oldPath, newPath, callback) {
  fs.rename(oldPath, newPath, function (err) {
      if (err) {
          if (err.code === 'EXDEV') {
              copy()
          } else {
              callback(err)
          }
          return;
      }
      callback()
  });

  function copy() {
      var readStream = fs.createReadStream(oldPath)
      var writeStream = fs.createWriteStream(newPath)
      readStream.on('error', callback)
      writeStream.on('error', callback)
      readStream.on('close', function () {
          fs.unlink(oldPath, callback)
      })
      readStream.pipe(writeStream)
  }
}

function getCurrentTime() {
  let time = new Date()
  let currentTime
  currentTime = time.getDate()+"/"+(time.getMonth()+1) +"/"+time.getFullYear()
  currentTime += " @ "+time.getHours()+":"+time.getMinutes()+":"+time.getSeconds()
  return currentTime
}

function convertVideo(pathToFile, fileId, previewQuality) {
  return new Promise((resolve, reject) => {
    return ffmpeg(pathToFile)
      .output(`${tempPath + fileId}.mp4`)
      .noAudio()
      .size('?x' + previewQuality)
      .on('start', function(commandLine) {
        console.log(`spawned Ffmpeg with command: ${commandLine}`)
        console.log(`start time: ${getCurrentTime()}`)
      })
      .on('end', () => {
        console.log(`preview created`)
        console.log(`end time: ${getCurrentTime()}`)
        return resolve()
      })
      .on('error', (err) => {
        console.log('An error occurred: ' + err.message)
        return reject(err.message)
      })
      .run()
  })
}

let fileInfo = {}

// get meta from file
function getVideoMetadata (pathToFile) {
  return new Promise((resolve, reject) => {
    return ffmpeg.ffprobe(pathToFile, (error, info) => {
      if (error) {
        return reject(error)
      }
      fileInfo.meta = info
      return resolve()
    })
  })
}

function cutPartVideo(index, fileId, previewQuality) {
  return new Promise((resolve, reject) => {
    let duration = Math.floor(fileInfo.meta.format.duration)
    let positions = {}
    positions.a = Math.floor(duration*0.1)
    positions.b = Math.floor(duration*0.3)
    positions.c = Math.floor(duration*0.5)
    positions.d = Math.floor(duration*0.7)
    positions.e = Math.floor(duration*0.9)

    // let filePath = fileInfo.meta.format.filename
    // ffmpeg(filePath)
    ffmpeg(`${tempPath + fileId}.mp4`)
      .output(`${tempPath + '/parts/' + fileId}_${index}.mp4`)
      .noAudio()
      .seek(positions[index])
      .duration(2)
      .size('?x' + previewQuality)
      .on('start', function(commandLine) {
        console.log(`spawned Ffmpeg with command: ${commandLine}`)
      })
      .on('end', () => {
        console.log(`the ${index} part of preview created at time: ${getCurrentTime()}`)
        resolve()
      })
      .on('error', (err) => {
        console.log('An error occurred: ' + err.message)
        reject(err.message)
      })
      .run()
  })
}

function mergePreviews(fileId) {
  return new Promise((resolve, reject) => {
    ffmpeg(`${tempPath}/parts/${fileId}_a.mp4`)
      .input(`${tempPath}/parts/${fileId}_b.mp4`)
      .input(`${tempPath}/parts/${fileId}_c.mp4`)
      .input(`${tempPath}/parts/${fileId}_d.mp4`)
      .input(`${tempPath}/parts/${fileId}_e.mp4`)
      .on('error', function(err) {
        console.log('An error occurred: ' + err.message)
        reject(err.message)
      })
      .on('end', function() {
        console.log('Merging finished !')
        resolve()
      })
      .mergeToFile(`${tempPath + fileId}.mp4`, `${tempPath}/merging/`)
  })
}

var createPreview = async function(file, fileId, previewQuality) {
  console.warn(`process start at time: ${getCurrentTime()}`)
  clearCache(cachePath)
  console.log('1) start getting meta')
  await getVideoMetadata(file).catch((err) => { 
    console.log(err)
  })

  console.log('2.0) converting video')
  await convertVideo(file, fileId, previewQuality).catch((err) => { 
    console.log(err)
  })

   
  console.log('2.1) generating part "a" of preview')

  await cutPartVideo('a', fileId, previewQuality)
  .then(async () => {
    console.log('2.2) generating part "b" of preview')
    return await cutPartVideo('b', fileId, previewQuality)
  })
  .then(async () => {
    console.log('2.3) generating part "c" of preview')
    return await cutPartVideo('c', fileId, previewQuality)
  })
  .then(async () => {
    console.log('2.4) generating part "d" of preview')
    return await cutPartVideo('d', fileId, previewQuality)
  })
  .then(async () => {
    console.log('2.5) generating part "e" of preview')
    return await cutPartVideo('e', fileId, previewQuality)
  })
  .then(async () => {
    console.log('3) merging parts of preview')
    return await mergePreviews(fileId)
  })
  .then(async () => {
    move(`${tempPath+fileId}.mp4`,`${previewsPath+fileId}.mp4`, console.log)
    console.log('preview was moved to previews folder')
    console.warn(`preview creating process finished at time: ${getCurrentTime()}`)
  })
}

export default createPreview