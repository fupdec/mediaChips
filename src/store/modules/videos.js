const {app} = require('electron').remote
const fs = require("fs")
const path = require("path");
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbVideos = path.join(app.getPath('userData'), 'userfiles/databases/dbv.json')
const adapterVideos = new FileSync(pathToDbVideos)
const low = require('lowdb')
const dbv = low(adapterVideos)

import router from '@/router'

dbv.defaults({ videos: [] }).write()

const Videos = {
  state: () => ({
    pageTotal: 1,
    lastChanged: Date.now(),
    filteredVideos: [],
    filteredEmpty: false,
    selection: null,
    selectedVideos: [],
    dialogDeleteVideo: false,
    dialogEditVideoInfo: false,
    dialogErrorPlayVideo: false,
    dialogFolderTree: false,
    dialogFilterVideos: false,
    errorPlayVideoPath: '',
    deleteFile: false,
    rating: 0,
    menuCard: false,
    updateCardIds: [],
    tree: [],
  }),
  mutations: {
    updateVideos (state, ids) {
      console.log(':::::::videos UPDATED:::::::')
      state.lastChanged = Date.now()
      if (ids === undefined) state.updateCardIds = []
      else state.updateCardIds = ids
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
    filterVideos({ state, commit, dispatch, getters, rootState}, stayOnCurrentPage) {
      let videos = getters.videos
      videos = videos.orderBy(video=>(path.basename(video.path)), ['asc'])

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
        
        if (type === 'boolean') {
          if (cond === 'yes') {
            videos = videos.filter(video => video[param] === true)
          } else videos = videos.filter(video => video[param] ===  false)
        }
        
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
      if (rootState.Settings.videoSortBy === 'name') {
        videos = videos.orderBy(video=>(path.basename(video.path)), [rootState.Settings.videoSortDirection])
      } else {
        videos = videos.orderBy(rootState.Settings.videoSortBy, [rootState.Settings.videoSortDirection])
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
        rootState.Settings.videoPage = 1
      }
      dispatch('saveFiltersOfVideos')
    },
    saveFiltersOfVideos({state, commit, getters, rootState}) {
      const route = router.currentRoute
      const newFilters = _.cloneDeep(rootState.Settings.videoFilters)
      const sortDirection = rootState.Settings.videoSortDirection
      const sortBy = rootState.Settings.videoSortBy
      const page = rootState.Settings.videoPage
      const pagesWithVideos = ['/performer/:','/website/:']

      if (route.path.includes('/videos/:')) {
        if (route.query.tabId === 'default') {
          getters.settings.set('videoFilters', newFilters).write()
          getters.settings.set('videoSortDirection', sortDirection).write()
          getters.settings.set('videoSortBy', sortBy).write()
          getters.settings.set('videoPage', page).write()
        } else {
          getters.tabsDb.find({id: +route.query.tabId}).assign({
            name: getters.videoFiltersForTabName,
            filters: newFilters,
            sortBy: sortBy,
            sortDirection: sortDirection,
            page: page,
          }).write()
          commit('getTabsFromDb')
        }
      } else if (pagesWithVideos.some(page => route.path.includes(page))) {
        if (route.query.tabId !== 'default') {
          getters.tabsDb.find({id: route.query.tabId}).assign({
            filters: newFilters,
            sortBy: sortBy,
            sortDirection: sortDirection,
            page: page,
          }).write()
          commit('getTabsFromDb')
        }
      }
    },
    deleteVideos({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedVideos.map(id => {
        if (getters.tabsDb.find({id: id}).value()) {
          dispatch('closeTab', id)
        }
        const video = getters.videos.find({'id':id}).value()
        let fileName = path.basename(video.path)
        let videoName = path.parse(video.path).name
        // remove video file
        if (state.deleteFile) {
          let filePath = getters.videos.find({ 'id': id }).value().path
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) {
                commit('addLog',{type:'error',text:err})
              } else {
                commit('addLog',{type:'info',text:`File ${fileName} was deleted successfully.`})
              }
            })
          } else {
            commit('addLog',{
              type:'error',
              text:`Unable to delete ${fileName}. The file does not exist in the path: "${video.path}".`
            })
          }
        }
        // remove video from database
        getters.videos.remove({ 'id': id }).write()
        // remove video from playlists
        getters.playlists.filter({'videos': [id]}).each(playlist=>{
          playlist.videos = playlist.videos.filter(video=>(video !== id))
        }).write()
        // remove marker from DB and image of marker
        let markers = getters.markers.filter({videoId: id}).value()
        for (let m=0;m<markers.length; m++) {
          let imgPath = path.join(getters.getPathToUserData, `/media/markers/${markers[m].id}.jpg`)
          fs.unlink(imgPath, (err) => {
            if (err) {
              // console.log(`failed to delete image of marker "${markers[m].id}", "${markers[m].name}". ${err}`);
            } else {
              // console.log(`successfully deleted image of marker "${markers[m].id}", "${markers[m].name}"`);                                
            }
          })
        }
        if (markers.length) getters.markers.remove({videoId: id}).write()
        // remove thumb, grid and preview of video
        let thumbPath = path.join(getters.getPathToUserData, `/media/thumbs/${id}.jpg`)
        fs.unlink(thumbPath, (err) => {
          if (err) {
            // console.log("failed to delete thumb:"+err)
          } else {
            // console.log('successfully deleted thumb')
          }
        })
        let gridPath = path.join(getters.getPathToUserData, `/media/previews/${id}.jpg`)
        fs.unlink(gridPath, (err) => {
          if (err) {
            // console.log("failed to delete grid:"+err)
          } else {
            // console.log('successfully deleted grid')
          }
        })
        commit('addLog', {type:'info',text:`📹 Video "${videoName}" has been removed from DB 🗑️`})
      })
      commit('updateSelectedVideos', [])
      commit('updateVideos')
      dispatch('filterVideos', true)
      rootState.updateFoldersData = Date.now()
    },
  },
  getters: {
    dbv(state) {
      return state.lastChanged, dbv
    },
    videos(state, store) {
      return store.dbv.get('videos')
    },
    videosDatabase(state, store) {
      return store.dbv
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

        if (flag === 'lostVideos') return 'Lost Videos'
        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array') {
          let arr = `"${param}" ${cond}`
          arr = `${arr} "${val.join(',')}"` 
          filters.push(arr)
        } else {
          filters.push(`"${param}" ${cond} "${val}"`)
        }
      }
      return 'Videos' + (filters.length ? ' with ': ' ') + filters.join('; ')
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
      if(rootState.Settings.videoPage > state.pageTotal) {
        rootState.Settings.videoPage = state.pageTotal
      }
      
      const end = rootState.Settings.videoPage * videosCount,
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