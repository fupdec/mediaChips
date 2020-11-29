const {app} = require('electron').remote
const fs = require("fs")
const path = require("path");
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbSettings = path.join(app.getPath('userData'), 'userfiles/dbs.json')
const pathToDbVideos = path.join(app.getPath('userData'), 'userfiles/databases/dbv.json')
const adapterSettings = new FileSync(pathToDbSettings)
const adapterVideos = new FileSync(pathToDbVideos)
const low = require('lowdb')
const dbs = low(adapterSettings)
const dbv = low(adapterVideos)
dbv.defaults({ videos: [] }).write()

const defaultFilters = {
  favorite: false,
  bookmark: false,
  quality: [],
  performers: [],
  performersLogic: false,
  tags: [],
  tagsLogic: false,
  websites: [],
  path: '',
  durationActive: false,
  duration: [0,1],
  sizeActive: false,
  size: [0,20000],
  sortBy: 'name',
  sortDirection: 'asc',
}

const Videos = {
  state: () => ({
    videosPerPage: dbs.get('videosPerPage').value(),
    pageCurrent: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    defaultFilters: _.cloneDeep(defaultFilters),
    filters: _.cloneDeep(defaultFilters),
    filtersReserved: _.cloneDeep(defaultFilters),
    filteredVideos: [],
    filteredEmpty: false,
    selection: null,
    selectedVideos: [],
    dialogDeleteVideo: false,
    dialogEditVideoInfo: false,
    dialogCreatePreview: false,
    deleteFile: false,
    rating: 0,
    videoChipsColored: dbs.get('videoChipsColored').value(),
    videoEditBtnHidden: dbs.get('videoEditBtnHidden').value(),
    videoFileNameHidden: dbs.get('videoFileNameHidden').value(),
    videoFileInfoHidden: dbs.get('videoFileInfoHidden').value(),
    videoRatingHidden: dbs.get('videoRatingHidden').value(),
    videoFavoriteHidden: dbs.get('videoFavoriteHidden').value(),
    videoQualityLabelHidden: dbs.get('videoQualityLabelHidden').value(),
    videoDurationHidden: dbs.get('videoDurationHidden').value(),
    videoPerformersHidden: dbs.get('videoPerformersHidden').value(),
    videoTagsHidden: dbs.get('videoTagsHidden').value(),
    videoWebsiteHidden: dbs.get('videoWebsiteHidden').value(),
    videoEditPerformersSortBy: dbs.get('videoEditPerformersSortBy').value(),
    videoEditTagsSortBy: dbs.get('videoEditTagsSortBy').value(),
    videoEditWebsitesSortBy: dbs.get('videoEditWebsitesSortBy').value(),
    menuCard: false,
  }),
  mutations: {
    updateVideos (state) {
      console.log(':::::::videos UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    changeVideosPerPage(state, quantity) {
      state.videosPerPage = quantity
    },
    changeVideosPageTotal(state, quantity) {
      state.pageTotal = quantity
    },
    changeVideosPageCurrent(state, quantity) {
      state.pageCurrent = quantity
    },
    updateFiltersOfVideos(state, {key, value}) {
      state.filters[key] = value
      // console.log(state.filters)
    },
    filterVideos(state, filteredVideos) {
      state.filteredVideos = filteredVideos
    },
    resetFilteredVideos(state) {
      state.filters = _.cloneDeep(defaultFilters)
    },
    updateSelectedVideos(state, ids) {
      state.selectedVideos = ids
    },
  },
  actions: {
    changeVideosPerPage({ state, commit, getters}, quantity) {
      // commit('updateVideos')
      commit('changeVideosPerPage', quantity)
      getters.settings.set('videosPerPage', quantity).write()
    },
    changeVideosPageTotal({ state, commit}, quantity) {
      // commit('updateVideos')
      commit('changeVideosPageTotal', quantity)
    },
    changeVideosPageCurrent({ state, commit}, quantity) {
      // commit('updateVideos')
      commit('changeVideosPageCurrent', quantity)
    },
    filterVideos({ state, commit, getters}, stayOnCurrentPage) {
      // console.log(state.filters.performers)
      let videos = getters.videos
      // console.log(videos)
      let filteredVideos = []
      videos = videos.orderBy(video=>(path.basename(video.path)), ['asc'])
      if (state.filters.performers) {
        let filteredPerformers = state.filters.performers
        if (filteredPerformers.length) {
          if (state.filters.performersLogic) {
            videos = videos.filter({'performers': filteredPerformers})
          } else {
            videos = videos.filter(video=>{
              let include = false
              for (let i=0; i<filteredPerformers.length;i++) {
                if (video.performers.includes(filteredPerformers[i])) {
                  include = true
                }
              }
              return include
            })
          }
          // console.log(filteredPerformers)
          // console.log('videos filtered by performers')
        }
      }
      if (state.filters.tags) {
        let filteredTags = state.filters.tags
        if (filteredTags.length) {
          if (state.filters.tagsLogic) {
            videos = videos.filter({'tags': filteredTags})
          } else {
            videos = videos.filter(video=>{
              let include = false
              for (let i=0; i<filteredTags.length;i++) {
                if (video.tags.includes(filteredTags[i])) {
                  include = true
                }
              }
              return include
            })
          }
          // console.log('videos filtered by tags')
        }
      }
      if (state.filters.websites) {
        let filteredwebsites = state.filters.websites
        if (filteredwebsites.length) {
          videos = videos.filter(video=>(filteredwebsites.includes(video.website)))
          // console.log(`videos filtered by websites "${filteredwebsites}"`)
        }
      }
      if (state.filters.path) {
        let frase = state.filters.path.toLowerCase().trim()
        if (frase.length) {
          videos = videos.filter(
            video => (video.path.toLowerCase().includes(frase)))
          // console.log(`videos filtered by frase "${frase}" in path`)
        }
      }
      if (state.filters.durationActive) {
        let dur = state.filters.duration
        videos = videos.filter(video => {
          let videoDur = Math.ceil(video.duration/60)
          if (videoDur >= dur[0] && videoDur <= dur[1]) {
            return true
          } else {return false}
        })
        // console.log(`videos filtered by duration`)
      }
      if (state.filters.sizeActive) {
        let size = state.filters.size
        videos = videos.filter(video => {
          let sizeMb = (video.size/1024/1024-0.01).toFixed(0)
          if (sizeMb >= size[0]*1000 && sizeMb <= size[1]*1000) {
            return true
          } else {return false}
        })
        // console.log('videos filtered by size')
        // console.log(size)
      }
      if (state.filters.quality) {
        let quality = state.filters.quality
        if (quality.length) {
          videos = videos.filter(video=>(quality.includes(video.height)))
          // console.log('videos filtered by quality')
        }
      }
      if (state.filters.sortBy) {
        let sort = state.filters.sortBy
        let direction = state.filters.sortDirection
        if (sort === 'name') {
          videos = videos.orderBy(video=>(path.basename(video.path)), [direction])
        } else {
          videos = videos.orderBy(sort, [direction])
        }
        // console.log('videos sorted')
      }
      if (state.filters.favorite) {
        videos = videos.filter(video=>(video.favorite))
        // console.log('favorite videos')
      }
      if (state.filters.bookmark) {
        videos = videos.filter(video=>(video.bookmark))
        // console.log('videos with bookmark')
      }
      if (videos != getters.videos) {
        if (videos.value().length == 0) {
          state.filteredEmpty = true
          filteredVideos = videos
        } else {
          state.filteredEmpty = false
          filteredVideos = videos
        }
      }
      // console.log(filteredVideos)
      commit('filterVideos', filteredVideos)
      if (!stayOnCurrentPage) {
        commit('changeVideosPageCurrent', 1)
      }
    },
    updateVideoChipsColored({state, getters}, value) {
      getters.settings.set('videoChipsColored', value).write()
      state.videoChipsColored = value
    },
    updateVideoEditBtnHidden({state, getters}, value) {
      getters.settings.set('videoEditBtnHidden', value).write()
      state.videoEditBtnHidden = value
    },
    updateVideoFileNameHidden({state, getters}, value) {
      getters.settings.set('videoFileNameHidden', value).write()
      state.videoFileNameHidden = value
    },
    updateVideoFileInfoHidden({state, getters}, value) {
      getters.settings.set('videoFileInfoHidden', value).write()
      state.videoFileInfoHidden = value
    },
    updateVideoRatingHidden({state, getters}, value) {
      getters.settings.set('videoRatingHidden', value).write()
      state.videoRatingHidden = value
    },
    updateVideoFavoriteHidden({state, getters}, value) {
      getters.settings.set('videoFavoriteHidden', value).write()
      state.videoFavoriteHidden = value
    },
    updateVideoQualityLabelHidden({state, getters}, value) {
      getters.settings.set('videoQualityLabelHidden', value).write()
      state.videoQualityLabelHidden = value
    },
    updateVideoDurationHidden({state, getters}, value) {
      getters.settings.set('videoDurationHidden', value).write()
      state.videoDurationHidden = value
    },
    updateVideoPerformersHidden({state, getters}, value) {
      getters.settings.set('videoPerformersHidden', value).write()
      state.videoPerformersHidden = value
    },
    updateVideoTagsHidden({state, getters}, value) {
      getters.settings.set('videoTagsHidden', value).write()
      state.videoTagsHidden = value
    },
    updateVideoWebsiteHidden({state, getters}, value) {
      getters.settings.set('videoWebsiteHidden', value).write()
      state.videoWebsiteHidden = value
    },
    updateVideoEditPerformersSortBy({state, getters}, value) {
      getters.settings.set('videoEditPerformersSortBy', value).write()
      state.videoEditPerformersSortBy = value
    },
    updateVideoEditTagsSortBy({state, getters}, value) {
      getters.settings.set('videoEditTagsSortBy', value).write()
      state.videoEditTagsSortBy = value
    },
    updateVideoEditWebsitesSortBy({state, getters}, value) {
      getters.settings.set('videoEditWebsitesSortBy', value).write()
      state.videoEditWebsitesSortBy = value
    },
    deleteVideos({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedVideos.map(id => {
        let videoName = getters.videos.find({'id':id}).value().path.split("\\").pop()
        // remove video file
        if (state.deleteFile) {
          let filePath = getters.videos.find({ 'id': id }).value().path
          console.log(filePath)
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log("failed to delete file:"+err)
              commit('setNotification', {
                type: 'error',
                text: `Failed to delete file. ${err}`
              })
            } else {
              console.log('successfully deleted file')
              commit('setNotification', {
                type: 'success',
                text: `File ${filePath} deleted!`
              })
            }
          })
        }
        // remove video from database
        getters.videos.remove({ 'id': id }).write()
        // remove thumb and preview of video
        let thumbPath = path.join(getters.getPathToUserData, `/media/thumbs/${id}.jpg`)
        fs.unlink(thumbPath, (err) => {
          if (err) {
            console.log("failed to delete thumb:"+err)
          } else {
            console.log('successfully deleted thumb')
          }
        })
        let previewPath = path.join(getters.getPathToUserData, `/media/previews/${id}.mp4`)
        fs.unlink(previewPath, (err) => {
          if (err) {
            console.log("failed to delete preview:"+err)
          } else {
            console.log('successfully deleted preview')
          }
        })
        commit('setNotification', {
          type: 'success',
          text: `Video ${videoName} deleted from database!`
        })
      })
      commit('updateSelectedVideos', [])
      commit('updateVideos')
      dispatch('filterVideos', true)
    },
  },
  getters: {
    dbv(state) {
      return state.lastChanged, dbv
    },
    videosDataBase(state, store) {
      return store.dbv
    },
    videos(state, store) {
      return store.dbv.get('videos')
    },
    filteredVideos(state, store) {
      let videos 
      if (state.filteredVideos.length===0) {
        videos = store.videos
        // console.log('get videos from db')
      } else {
        videos = state.filteredVideos
        // console.log('get filtered videos')
      }
      // console.log(state.filteredVideos.length)
      // console.log(state.filteredVideos)
      return videos
    },
    videosFilters: (state, store) => {
      let filters = []
      if (state.filters.path) {
        filters.push('Search:' + state.filters.path)
      }
      if (state.filters.performers.length) {
        let filterPerformers = 'Perf.:'
        filterPerformers += state.filters.performers.join(';')
        filters.push(filterPerformers)
      }
      if (state.filters.tags.length) {
        let filterTags = 'Tags:'
        filterTags += state.filters.tags.join(';')
        filters.push(filterTags)
      }
      if (state.filters.websites.length) {
        let filterwebsites = 'Web.:'
        filterwebsites += state.filters.websites.join(';')
        filters.push(filterwebsites)
      }
      if (state.filters.favorite) {
        filters.push('Fav.')
      }
      if (state.filters.bookmark) {
        filters.push('Book.')
      }
      if (state.filters.quality.length) {
        let quality = 'Qual.:'
        if (state.filters.quality.includes(2160)) {
          quality += '4K;'
        }
        if (state.filters.quality.includes(1080)) {
          quality += '1080p;'
        }
        if (state.filters.quality.includes(720)) {
          quality += '720p;'
        }
        if (state.filters.quality.includes(480)) {
          quality += '480p;'
        }
        filters.push(quality)
      }
      if (state.filters.durationActive) {
        filters.push(`Dur.:${state.filters.duration[0]}-${state.filters.duration[1]}min`)
      }
      if (state.filters.sizeActive) {
        filters.push(`Size:${state.filters.size[0]}-${state.filters.size[1]}GB`)
      }
      if (filters.length) {
        return filters.join(', ')
      } else {
        return 'Videos'
      }
    },
    videosTotal: (state, store) => {
      return store.videos.value().length
    },
    filteredVideosTotal(state, store) {
      if (state.filteredVideos.length==0) {
        // console.log(state.filteredVideos.length)
        return state.filteredVideos.length
      } else {
        // console.log(state.filteredVideos.value().length)
        return state.filteredVideos.value().length
      }
    },
    videosTotalSize: (state, store) => {
      let sizes = store.videos.map('size').value()
      let total = 0
      for (let i=0; i<sizes.length; i++) {
        total += sizes[i]
      }
      if (total > 1000000000000) {
        total = (total/1024/1024/1024/1024-0.01).toFixed(2) + ' TB'
      } else if (total > 1000000000) {
        total = (total/1024/1024/1024-0.01).toFixed(2) + ' GB'
      } else if (total > 1000000) {
        total = (total/1024/1024-0.01).toFixed(2) + ' MB'
      } else if (total > 1000) {
        total = (total/1024-0.01).toFixed(2) + ' KB'
      } else {
        total += ' B'
      }
      return total
    },
    videosOnPage(state, store) {
      const videos = store.filteredVideos.value(), 
            videosCount = store.videosPerPage
      // console.log(videos)
      let l = videos.length,
          c = videosCount
      state.pageTotal = Math.ceil(l/c)
      // console.log(state.pageTotal)
      if(state.pageCurrent > state.pageTotal) {
        state.pageCurrent = state.pageTotal
      }
      
      const end = state.pageCurrent * videosCount,
            start = end - videosCount;
      return videos.slice(start, end)
    },
    videosPerPage(state) {
      return state.videosPerPage
    },
    videosPagesSum(state) {
      return state.pageTotal
    },
    videosPages(state, store) {
      let pages = []
      for (let i = 0; i < store.videosPagesSum; i++) {
        pages.push(i+1)
      }
      return pages
    },
    videosCurrentPage(state) {
      return state.pageCurrent
    },
    getSelectedVideos(state) {
      return state.selectedVideos
    },
  }
};

export default Videos