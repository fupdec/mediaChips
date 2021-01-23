const {app} = require('electron').remote
const fs = require("fs")
const path = require("path");
const FileSync = require('@/components/elements/LowDbAdapter')
const pathToDbVideos = path.join(app.getPath('userData'), 'userfiles/databases/dbv.json')
const adapterVideos = new FileSync(pathToDbVideos)
const low = require('lowdb')
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
  tree: [],
  page: 1,
}

const Videos = {
  state: () => ({
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
    dialogErrorPlayVideo: false,
    dialogFolderTree: false,
    errorPlayVideoPath: '',
    deleteFile: false,
    rating: 0,
    menuCard: false,
    updateCard: 1,
  }),
  mutations: {
    updateVideos (state) {
      console.log(':::::::videos UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    changeVideosPageTotal(state, number) {
      state.pageTotal = number
    },
    changeVideosPageCurrent(state, number) {
      state.pageCurrent = number
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
    changeVideosPerPage({ state, commit, getters, dispatch}, number) {
      // commit('updateVideos')
      commit('resetLoading')
      dispatch('updateSettingsState', {key:'videosPerPage', value:number})
    },
    changeVideosPageTotal({ state, commit}, number) {
      // commit('updateVideos')
      commit('changeVideosPageTotal', number)
    },
    changeVideosPageCurrent({ state, commit}, number) {
      // commit('updateVideos')
      commit('resetLoading')
      commit('changeVideosPageCurrent', number)
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
      if (state.filters.tree) {
        let tree = state.filters.tree
        if (tree.length) {
          videos = videos.filter(video => {
            let include = false
            for (let i=0; i<tree.length; i++) {
              if (video.path.includes(tree[i])) {
                include = true
              }
            }
            return include
          })
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
          videos = videos.filter(video=>{
            let width = +video.resolution.match(/\d*/)[0]
            let height = +video.resolution.match(/\x(.*)/)[1]
            if (quality.includes('4K')) {
              return width>height && height>1800
            }
            if (quality.includes('1080')) {
              return width>height && height>720 && height<=1080
            }
            if (quality.includes('720')) {
              return width>height && height>480 && height<=720
            }
            if (quality.includes('480')) {
              return width>height && height<=480
            }
            if (quality.includes('vert')) {
              return width<height
            }
          })
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
      commit('resetLoading')
      commit('filterVideos', filteredVideos)
      if (!stayOnCurrentPage) {
        state.filters.page = 1
        commit('changeVideosPageCurrent', 1)
      }
    },
    deleteVideos({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedVideos.map(id => {
        if (getters.tabsDb.find({id: id}).value()) {
          dispatch('closeTab', id)
        }
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
        // remove video from playlists
        getters.playlists.filter({'videos': [id]}).each(playlist=>{
          playlist.videos = playlist.videos.filter(video=>(video !== id))
        }).write()
        // remove thumb, grid and preview of video
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
        let gridPath = path.join(getters.getPathToUserData, `/media/previews/${id}.jpg`)
        fs.unlink(gridPath, (err) => {
          if (err) {
            console.log("failed to delete grid:"+err)
          } else {
            console.log('successfully deleted grid')
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
    videosOnPage(state, store, rootState) {
      const videos = store.filteredVideos.value(), 
            videosCount = rootState.Settings.videosPerPage
      // console.log(videos)
      let l = videos.length,
          c = videosCount
      state.pageTotal = Math.ceil(l/c)
      // console.log(state.pageTotal)
      if(state.filters.page) {
        state.pageCurrent = state.filters.page
      }
      if(state.pageCurrent > state.pageTotal) {
        state.pageCurrent = state.pageTotal
      }
      
      const end = state.pageCurrent * videosCount,
            start = end - videosCount;
      return videos.slice(start, end)
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
}

export default Videos