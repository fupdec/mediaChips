const path = require('path')
const shortid = require('shortid')

import store from '@/store/index.js'

const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(path.join(store.getters.getPathToUserData, '/ffmpeg/ffmpeg.exe')) 
ffmpeg.setFfprobePath(path.join(store.getters.getPathToUserData, '/ffmpeg/ffprobe.exe'))


let fileInfo = {}

// get meta from file
function getVideoMetadata (pathToFile) {
  return new Promise((resolve, reject) => {
    return ffmpeg.ffprobe(pathToFile, (error, info) => {
      if (error) {
        return reject(error)
      }
      // console.log(`getVideoMetadata: ` + JSON.stringify(videoInfo.format))
      fileInfo.meta = info
      return resolve()
    })
  })
}

// create info of videofile, generating thumb.jpg and return object with videofile info
function createInfoForDb() {
	return new Promise ((resolve, reject) => {
    let duration = Math.floor(fileInfo.meta.format.duration)
    
    let resolution
    for(let i = 0; i < fileInfo.meta.streams.length; i++) {
      if (fileInfo.meta.streams[i].codec_type === 'video') {
        resolution = fileInfo.meta.streams[i].width + 'x' + fileInfo.meta.streams[i].height
      } 
    }

    let pathToFile = fileInfo.meta.format.filename
    // parse file path for contains performer name or website
    let names = checkPathContainsNames(pathToFile)
    let performers = []
    if (names.performer) {
      performers.push(names.performer)
    }
    let websites = []
    if (names.website) {
      websites.push(names.website)
    }
        
    // get file info 
    let videoMetadata = {
      id: fileInfo.id,
      path: pathToFile,
      duration: duration,
      size: fileInfo.meta.format.size,
      resolution: resolution,
      tags: names.tags,
      performers: performers,
      websites: websites,
      rating: 0,
      favorite: false,
      bookmark: false,
      date: Date.now(),
      edit: Date.now(),
      viewed: 0,
    }
    
    let outputPathThumbs = path.join(store.getters.getPathToUserData, '/media/thumbs/')
    // creating the thumb of the video
    ffmpeg()
      .input(pathToFile)
      .screenshots({
        count: 1, 
        filename: `${outputPathThumbs + fileInfo.id}.jpg`,
        size: '?x320' 
      })
      .on('end', () => {
        console.log(`thumb created: ${outputPathThumbs + fileInfo.id}.jpg`)
        resolve(videoMetadata)
      })
      .on('error', (err) => {
        reject(err.message)
      })
  })
}

function checkPathContainsNames(filePath) {
  let folders = filePath.split('\\')
  let names = {}

  // search for performer name and website name
  for (let i=0; i<folders.length; i++) {
    let dirName = folders[i].toLowerCase()
    if (store.getters.performersNamesLower.includes(dirName)) {
      names.performer = dirName
    }
    if (store.getters.websitesNamesLower.includes(dirName)) {
      names.website = dirName
    }
  }

  // search for tag names
  let foundTags = []
  if (store.getters.getSearchTagsInFileName) {
    let fileName = folders[folders.length-1].toLowerCase()
    for (let i=0; i<store.getters.tagsNamesLowerVideos.length; i++) {
      let tag = store.getters.tagsNamesLowerVideos[i]
      if (fileName.includes(tag)) {
        foundTags.push(tag)
      }
    }
  }
  // TODO if duplicated item in path than remove duplicates
  // create more powerful search in string
  // maybe remove all spaces, split by ,.-_

  // add performer if found 
  if (names.performer) {
    names.performer = store.getters.performers.find(p=>
      p.name.toLowerCase()===names.performer).value().name
  }
  // add website if found 
  if (names.website) {
    names.website = store.getters.websites.find(w=>
      w.name.toLowerCase()===names.website).value().name
  }
  // add tags if found or return empty array
  names.tags = []
  if (foundTags.length) {
    for (let i=0; i<foundTags.length; i++) {
      let tag = store.getters.tags.find(t=>(t.name.toLowerCase()===foundTags[i])).value().name
      names.tags.push(tag)
    }
  }

  return names
}

var fileScanProc = async function(file) {
  let fileProcResult = {}
  // check for duplicates in database
  let duplicate = store.getters.videos.find(video => video.path.toLowerCase() == file.toLowerCase()).value()
  if (duplicate) {
    console.warn(`file ${JSON.stringify(duplicate.path)} already in DB`)
    fileProcResult.duplicate = file
    fileProcResult.success = false
    return fileProcResult
  }

  fileInfo.id = shortid.generate() 

  console.log('1) start getting meta')
  await getVideoMetadata(file)
    .catch((err) => { 
      console.log(err)
      fileProcResult.errorVideo = file
    })
  if (fileProcResult.errorVideo) {
    return fileProcResult
  }

  // add videoinfo to DB
  await createInfoForDb()
    .then(async (videoMetadata)=>{
      await store.getters.videos.push(videoMetadata).write()
      console.log(`2) video added`)
      fileProcResult.duplicate = false
      fileProcResult.success = videoMetadata
      return(fileProcResult)
    })
    .catch(err => {
      console.log(err)
      fileProcResult.errorVideo = file
    })
  return fileProcResult
}

export default fileScanProc