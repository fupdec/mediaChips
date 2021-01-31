const {app} = require('electron').remote
const fs = require("fs")
const path = require("path");
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbVideos = path.join(app.getPath('userData'), 'userfiles/databases/dbv.json')
const adapterVideos = new FileSync(pathToDbVideos)
const low = require('lowdb')
const dbv = low(adapterVideos)
dbv.defaults({ videos: [] }).write()

// const defaultFilters = {
//   favorite: false,
//   bookmark: false,
//   quality: [],
//   performers: [],
//   performersLogic: false,
//   tags: [],
//   tagsLogic: false,
//   websites: [],
//   path: '',
//   durationActive: false,
//   duration: [0,1],
//   sizeActive: false,
//   size: [0,20000],
//   sortBy: 'name',
//   sortDirection: 'asc',
//   tree: [],
//   page: 1,
// }

const Videos = {
  state: () => ({
    page: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    filteredVideos: [],
    filteredEmpty: false,
    selection: null,
    selectedVideos: [],
    dialogDeleteVideo: false,
    dialogEditVideoInfo: false,
    dialogCreatePreview: false,
    dialogErrorPlayVideo: false,
    dialogFolderTree: false,
    dialogFilterVideos: false,
    errorPlayVideoPath: '',
    deleteFile: false,
    rating: 0,
    menuCard: false,
    updateCard: 1,
    sortBy: 'name',
    sortDirection: 'asc',
    tree: [],
    showFavorites: false,
    showBookmarks: false,
  }),
  mutations: {
    updateVideos (state) {
      console.log(':::::::videos UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    updateFiltersOfVideos(state, {key, value}) {
      state.filters[key] = value
      // console.log(state.filters)
    },
    filterVideos(state, filteredVideos) {
      state.filteredVideos = filteredVideos
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
    filterVideos({ state, commit, getters, rootState}, stayOnCurrentPage) {
      let videos = getters.videos
      videos = videos.orderBy(video=>(path.basename(video.path)), ['asc'])

      if (state.showFavorites) {
        videos = videos.filter(video=>video.favorite)
      }
      if (state.showBookmarks) {
        videos = videos.filter(video=>video.bookmark)
      }
      // filter by folder tree
      if (state.tree.length) {
        videos = videos.filter(video => {
          let include = false
          for (let i = 0; i < state.tree.length; i++) {
            if (video.path.includes(state.tree[i])) {
              include = true
            }
          }
          return include
        })
      }

      function compare(sign, a, b) {
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      for (let filter in rootState.Settings.videoFilters) {
        let param = rootState.Settings.videoFilters[filter].param
        let cond = rootState.Settings.videoFilters[filter].cond
        let val = rootState.Settings.videoFilters[filter].val
        let type = rootState.Settings.videoFilters[filter].type
        let flag = rootState.Settings.videoFilters[filter].flag
        
        if (val === null || val.length === 0) continue
        
        if (type === 'number' || type === 'date') {
          if (type === 'number') val = +val

          if (param === 'height') {
            videos = videos.filter(video=>{
              let height = +video.resolution.match(/\x(.*)/)[1]
              return compare(cond, val, height)
            })
          } else if (param === 'width') {
            videos = videos.filter(video=>{
              let width = +video.resolution.match(/\d*/)[0]
              return compare(cond, val, width)
            })
          } else {
            if (param === 'date' || param === 'edit') val = new Date(val).getTime()
            videos = videos.filter(video => compare(cond, val, video[param]))
          } 
        }
        
        if (type === 'string') {
          let string = val.toLowerCase().trim()
          if (string.length) {
            if (cond === 'includes') {
              videos = videos.filter(video => video[param].toLowerCase().includes(string))
            } else videos = videos.filter(v => !v[param].toLowerCase().includes(string))
          }
        }

        if (type === 'array') {
          if (cond === 'all') {
            videos = videos.filter({[param]: val})
          } else if (cond === 'one of') {
            videos = videos.filter(video=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( video[param].includes(val[i]) ) include = true
              }
              return include
            })
          } else if (cond === 'not') {
            videos = videos.filter(video=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( video[param].includes(val[i]) ) include = true
              }
              return !include
            })
          }
        }

        if (type === 'select') {
          if (cond === 'includes') {
            videos = videos.filter(video=>val.includes(video[param]))
          } else videos = videos.filter(video=>!val.includes(video[param]))
        }
      }
      // sort videos
      if (state.sortBy === 'name') {
        videos = videos.orderBy(video=>(path.basename(video.path)), [state.sortDirection])
      } else {
        videos = videos.orderBy(state.sortBy, [state.sortDirection])
      }
      // if (state.filters.durationActive) {
      //   let dur = state.filters.duration
      //   videos = videos.filter(video => {
      //     let videoDur = Math.ceil(video.duration/60)
      //     if (videoDur >= dur[0] && videoDur <= dur[1]) {
      //       return true
      //     } else {return false}
      //   })
      //   // console.log(`videos filtered by duration`)
      // }
      // if (state.filters.sizeActive) {
      //   let size = state.filters.size
      //   videos = videos.filter(video => {
      //     let sizeMb = (video.size/1024/1024-0.01).toFixed(0)
      //     if (sizeMb >= size[0]*1000 && sizeMb <= size[1]*1000) {
      //       return true
      //     } else {return false}
      //   })
      //   // console.log('videos filtered by size')
      //   // console.log(size)
      // }
      // if (state.filters.quality) {
      //   let quality = state.filters.quality
      //   if (quality.length) {
      //     videos = videos.filter(video=>{
      //       let width = +video.resolution.match(/\d*/)[0]
      //       let height = +video.resolution.match(/\x(.*)/)[1]
      //       if (quality.includes('4K')) {
      //         return width>height && height>1800
      //       }
      //       if (quality.includes('1080')) {
      //         return width>height && height>720 && height<=1080
      //       }
      //       if (quality.includes('720')) {
      //         return width>height && height>480 && height<=720
      //       }
      //       if (quality.includes('480')) {
      //         return width>height && height<=480
      //       }
      //       if (quality.includes('vert')) {
      //         return width<height
      //       }
      //     })
      //     // console.log('videos filtered by quality')
      //   }
      // }
      let filteredVideos = []
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
        state.page = 1
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
    videoFiltersForTabName: (state, store, rootState) => {
      let filters = []
      let equals = ['equal', 'including', 'all', 'one of']
      let notEquals = ['not equal', 'not', 'excluding']
      
      for (let filter in rootState.Settings.videoFilters) {
        let param = rootState.Settings.videoFilters[filter].param
        let cond = rootState.Settings.videoFilters[filter].cond
        let val = rootState.Settings.videoFilters[filter].val
        let type = rootState.Settings.videoFilters[filter].type
        let flag = rootState.Settings.videoFilters[filter].flag

        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array') {
          let arr = param+' '+cond+' '
          arr += val.join(';')
          filters.push(arr)
        } else {
          filters.push(param+' '+cond+' '+val)
        }
      }
      return 'Videos' + (filters.length ? ' with ': ' ') + filters.join(', ')
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
      if(state.page > state.pageTotal) {
        state.page = state.pageTotal
      }
      
      const end = state.page * videosCount,
            start = end - videosCount;
      return videos.slice(start, end)
    },
    videosPages(state) {
      let pages = []
      for (let i = 0; i < state.pageTotal; i++) {
        pages.push(i+1)
      }
      return pages
    },
    getSelectedVideos(state) {
      return state.selectedVideos
    },
  }
}

export default Videos