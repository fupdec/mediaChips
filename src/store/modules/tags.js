const {app} = require('electron').remote
const fs = require("fs")
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbTags = path.join(app.getPath('userData'), 'userfiles/databases/dbt.json')
const adapterTags = new FileSync(pathToDbTags)
const low = require('lowdb')
const dbt = low(adapterTags)

import router from '@/router'

dbt.defaults({ 
  tags: [{
    id: "2222222222222222",
    name: "Anal",
    category: [
      "video"
    ],
    color: "#FF9800",
    value: 5,
    bookmark: false,
    altNames: [],
    date: Date.now(),
    edit: Date.now(),
    favorite: true
  },] 
}).write()

const Tags = {
  state: () => ({
    pageTotal: 1,
    lastChanged: Date.now(),
    dialogDeleteTag: false,
    dialogEditTag: false,
    dialogFilterTags: false,
    selection: null,
    selectedTags: [],
    updateInfo: {},
    updateImage: {},
    filteredTags: [],
    filteredEmpty: false,
    menuCard: false,
    activeTab: null,
  }),
  mutations: {
    updateTags (state) {
      console.log(':::::::tags UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    filterTags(state, filteredTags) {
      state.filteredTags = filteredTags
    },
    resetFilteredTags(state) {
      state.filters = _.cloneDeep(defaultFilters)
    },
    updateFiltersOfTags(state, {key, value}) {
      state.filters[key] = value
      // console.log(state.filters)
    },
    updateSelectedTags(state, ids) {
      state.selectedTags = ids
    },
  },
  actions: {
    changeTagsPerPage({ state, commit, getters, dispatch}, number) {
      // commit('updateTags')
      commit('resetLoading')
      dispatch('updateSettingsState', {key:'tagsPerPage', value:number})
    },
    async filterTags({ state, commit, dispatch, getters, rootState}, stayOnCurrentPage) {
      let tags = getters.tags
      tags = tags.orderBy(tag => tag.name.toLowerCase(), ['asc'])

      if (rootState.Settings.tagColor.length) { // filter by color
        tags = tags.filter(tag => rootState.Settings.tagColor.includes(tag.color.toLowerCase()))
      }

      if (rootState.Settings.tagFirstChar.length) { // filter by first character
        let chars = ['0123456789','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!$@^&*\'+-_~']
        let allChars = []
        rootState.Settings.tagFirstChar.forEach( char => { allChars.push(chars[char]) } )
        if (allChars.length) {
          tags = tags.filter( tag => {
            let charTag = tag.name.charAt(0).toLowerCase()
            return allChars.includes(charTag)
          })
        }
      }

      function compare(sign, a, b) {
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      
      for (let filter in rootState.Settings.tagFilters) {
        let param = rootState.Settings.tagFilters[filter].param
        let cond = rootState.Settings.tagFilters[filter].cond
        let val = rootState.Settings.tagFilters[filter].val
        let type = rootState.Settings.tagFilters[filter].type
        let flag = rootState.Settings.tagFilters[filter].flag
        
        if (type === 'boolean') {
          if (cond === 'yes') {
            tags = tags.filter(tag=>tag[param]===true)
          } else tags = tags.filter(tag=>tag[param]===false)
        }
        
        if (val === null || val.length === 0) continue
        
        if (type === 'number' || type === 'date') {
          if (type === 'number') val = +val
          if (param === 'date' || param === 'edit') val = new Date(val).getTime()
          tags = tags.filter(tag => compare(cond, val, tag[param]))
        }
        
        if (type === 'string') {
          let string = val.toLowerCase().trim()
          if (string.length) {
            if (param === 'name' && flag === true) {
              let filteredByNames = await tags.filter(tag => {
                if (cond === 'includes') {
                  return tag.name.toLowerCase().includes(string)
                } else return !tag.name.toLowerCase().includes(string)
              }).map('id').value()
  
              let filteredByAltNames = await tags.filter( tag => {
                let altNames = tag.altNames.map(p=>p.toLowerCase())
                let matches = altNames.filter(a=>{
                  if (cond === 'includes') {
                    return a.includes(string)
                  } else return !a.includes(string)
                })
                if (matches.length>0) {
                  return true
                } else { return false } 
              }).map('id').value()
  
              let mergedIds = _.union(filteredByNames, filteredByAltNames)
  
              tags = tags.filter(p=>(mergedIds.includes(p.id)))
            } else {
              if (cond === 'includes') {
                tags = tags.filter(tag => tag[param].toLowerCase().includes(string))
              } else tags = tags.filter(v => !v[param].toLowerCase().includes(string))
            }
          }
        }

        if (type === 'array') {
          if (cond === 'all') {
            tags = tags.filter({[param]: val})
          } else if (cond === 'one of') {
            tags = tags.filter(tag=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( tag[param].includes(val[i]) ) include = true
              }
              return include
            })
          } else if (cond === 'not') {
            tags = tags.filter(tag=>{
              let include = false
              for (let i=0; i<val.length;i++) {
                if ( tag[param].includes(val[i]) ) include = true
              }
              return !include
            })
          }
        }

        if (type === 'select') {
          if (cond === 'includes') {
            tags = tags.filter(tag=>val.includes(tag[param]))
          } else tags = tags.filter(tag=>!val.includes(tag[param]))
        }
      }
  
      // sort tags
      if (rootState.Settings.tagSortBy === 'name') {
        tags = tags.orderBy(tag=>tag.name.toLowerCase(), [rootState.Settings.tagSortDirection])
      } else {
        // TODO add correct sort for colors based on swatches array
        tags = tags.orderBy(rootState.Settings.tagSortBy, [rootState.Settings.tagSortDirection])
      }
      
      let filteredTags = []
      if (tags != getters.tags) {
        if (tags.value().length == 0) {
          state.filteredEmpty = true
          filteredTags = tags
        } else {
          state.filteredEmpty = false
          filteredTags = tags
        }
      }
      // console.log(filteredTags)
      commit('resetLoading')
      commit('filterTags', filteredTags)
      if (!stayOnCurrentPage) {
        rootState.Settings.tagPage = 1
      }
      dispatch('saveFiltersOfTags')
    },
    saveFiltersOfTags({state, commit, getters, rootState}) {
      const route = router.currentRoute
      const newFilters = _.cloneDeep(rootState.Settings.tagFilters)
      const sortBy = rootState.Settings.tagSortBy
      const sortDirection = rootState.Settings.tagSortDirection
      const page = rootState.Settings.tagPage
      const firstChar = rootState.Settings.tagFirstChar
      const color = rootState.Settings.tagColor

      if (route.query.tabId === 'default') { // for tags page (not for tab)
        getters.settings.set('tagFilters', newFilters).write()
        getters.settings.set('tagSortBy', sortBy).write()
        getters.settings.set('tagSortDirection', sortDirection).write()
        getters.settings.set('tagPage', page).write()
        getters.settings.set('tagFirstChar', firstChar).write()
        getters.settings.set('tagColor', color).write()
      } else {  // for tab with tags 
        getters.tabsDb.find({id: route.query.tabId}).assign({
          name: getters.tagFiltersForTabName,
          filters: newFilters,
          sortBy: sortBy,
          sortDirection: sortDirection,
          page: page,
          firstChar: firstChar,
          color: color,
        }).write()
        commit('getTabsFromDb')
      }
    },
    deleteTags({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedTags.map(id => {
        let tagName = getters.tags.find({id:id}).value().name
        // remove tag from videos
        getters.videos.filter({'tags': [tagName]}).each(video=>{
          let index = video.tags.indexOf(tagName);
          if (index !== -1) video.tags.splice(index, 1);
        }).write()
        // remove tag from performers
        getters.performers.filter({'tags': [tagName]}).each(performer=>{
          let index = performer.tags.indexOf(tagName);
          if (index !== -1) performer.tags.splice(index, 1);
        }).write()
        // remove tag from database
        getters.tags.remove({ 'id': id }).write()
        // remove images of tag
        let imgPath = path.join(getters.getPathToUserData, `/media/tags/${id}_.jpg`)
        fs.unlink(imgPath, (err) => {
          if (err) {
            console.log(`failed to delete image of tag "${tagName}". ${err}`);
          } else {
            console.log(`successfully deleted image of tag "${tagName}"`);                                
          }
        })
      })
      state.selectedTags = []
      commit('updateTags')
      dispatch('filterTags', true)
    },
  },
  getters: {
    dbt(state) {
      return state.lastChanged, dbt
    },
    tagsDataBase(state, store) {
      return store.dbt
    },
    tags(state, store) {
      return store.dbt.get('tags')
    },
    tagsNames(state, store) {
      return store.dbt.get('tags').map('name').value()
    },
    tagsNamesLower(state, store) {
      return store.dbt.get('tags').map(p=>p.name.toLowerCase()).value()
    },
    tagsNamesLowerVideos(state, store) {
      return store.dbt.get('tags').filter(t=>{
        return t.category.includes('video')
      }).map(p=>p.name.toLowerCase()).value()
    },
    tagFiltersForTabName: (state, store, rootState) => {
      let filters = []
      let equals = ['equal', 'including', 'all', 'one of']
      let notEquals = ['not equal', 'not', 'excluding']
      
      for (let filter in rootState.Settings.tagFilters) {
        let param = rootState.Settings.tagFilters[filter].param
        let cond = rootState.Settings.tagFilters[filter].cond
        let val = rootState.Settings.tagFilters[filter].val
        let type = rootState.Settings.tagFilters[filter].type
        let flag = rootState.Settings.tagFilters[filter].flag

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
      // TODO show first char and color in tab name
      return 'Tags' + (filters.length ? ' with ': ' ') + filters.join(', ')
    },
    filteredTags(state, store) {
      let tags 
      if (state.filteredTags.length===0) {
        tags = store.tags
        console.log('get tags from db')
      }
      if (state.filteredTags.length!==0) {
        tags = state.filteredTags
        console.log('get filtered tags')
      }
      return tags
    },
    filteredTagsTotal(state, store) {
      if (state.filteredTags.length==0) {
        // console.log(state.filteredPerformers.length)
        return state.filteredTags.length
      } else {
        // console.log(state.filteredPerformers.value().length)
        return state.filteredTags.value().length
      }
    },
    tagsTotal: (state, store) => {
      return store.tags.value().length;
    },
    tagsOnPage(state, store, rootState) {
      const tags = store.filteredTags.value(),
            tagsCount = rootState.Settings.tagsPerPage
      let l = tags.length,
          c = tagsCount
      state.pageTotal = Math.ceil(l/c)
      if(rootState.Settings.tagPage > state.pageTotal) {
        rootState.Settings.tagPage = state.pageTotal
      }
      
      const end = rootState.Settings.tagPage * tagsCount,
            start = end - tagsCount
      return tags.slice(start, end)
    },
    tagsPagesSum(state) {
      return state.pageTotal
    },
    tagsPages(state, store) {
      let pages = []
      for (let i = 0; i < store.tagsPagesSum; i++) {
        pages.push(i+1)
      }
      return pages
    },
    getSelectedTags(state) {
      return state.selectedTags
    },
    sumOfTagsValue(state, store) {
      let values = store.tags.map('value').value().filter(e=>(e>0))
      return values.reduce((a, b) => a + b, 0)
    },
  }
};

export default Tags