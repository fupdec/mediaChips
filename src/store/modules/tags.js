const {app} = require('electron').remote
const fs = require("fs")
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbSettings = path.join(app.getPath('userData'), 'userfiles/dbs.json')
const pathToDbTags = path.join(app.getPath('userData'), 'userfiles/databases/dbt.json')
const adapterSettings = new FileSync(pathToDbSettings)
const adapterTags = new FileSync(pathToDbTags)
const low = require('lowdb')
const dbs = low(adapterSettings)
const dbt = low(adapterTags)
dbt.defaults({ tags: [] }).write()

const defaultFilters = {
  firstChar: [],
  colors: [],
  favorite: false,
  bookmark: false,
  name: '',
  alternate: false,
  category: [],
  categoryLogic: false,
  sortBy: 'name',
  sortDirection: 'asc',
}

const Tags = {
  state: () => ({
    tagsPerPage: dbs.get('tagsPerPage').value(),
    pageCurrent: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    dialogDeleteTag: false,
    dialogEditTag: false,
    selection: null,
    selectedTags: [],
    updateInfo: {},
    updateImage: {},
    filters: _.cloneDeep(defaultFilters),
    filtersReserved: _.cloneDeep(defaultFilters),
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
    changeTagsPerPage(state, quantity) {
      state.tagsPerPage = quantity
    },
    changeTagsPageTotal(state, quantity) {
      state.pageTotal = quantity
    },
    changeTagsPageCurrent(state, quantity) {
      state.pageCurrent = quantity
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
    changeTagsPerPage({ state, commit, getters}, quantity) {
      commit('updateTags')
      commit('changeTagsPerPage', quantity)
      getters.settings.set('tagsPerPage', quantity).write()
    },
    changeTagsPageTotal({ state, commit}, quantity) {
      commit('updateTags')
      commit('changeTagsPageTotal', quantity)
    },
    changeTagsPageCurrent({ state, commit}, quantity) {
      commit('updateTags')
      commit('changeTagsPageCurrent', quantity)
    },
    deleteTags({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedTags.map(id => {
        let tagName = getters.tags.find({id:id}).value().name
        // remove tag from videos
        getters.videos.each(video=>{
          let index = video.tags.indexOf(tagName);
          if (index !== -1) video.tags.splice(index, 1);
        }).write()
        // remove tag from performers
        getters.performers.each(performer=>{
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
    async filterTags({ state, commit, getters}, stayOnCurrentPage) {
      let tags = getters.tags
      let filteredTags = []
      tags = tags.orderBy(tag=>(tag.name.toLowerCase()), ['asc'])
      if (state.filters.colors) {
        let colors = state.filters.colors
        if (colors.length) {
          tags = tags.filter(tag => (colors.includes(tag.color.toLowerCase())))
          // console.log('tags filtered by color')
        }
      }
      if (state.filters.firstChar) {
        let firstChars = state.filters.firstChar
        let chars = ['0123456789','a','b','c','d','e','f','g','h','i','j','k',
          'l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!$@^&*\'+-_~']
        let allChars = []
        firstChars.forEach( char => { allChars.push(chars[char]) } )
        // console.log(allChars)
        if (allChars.length) {
          tags = tags.filter( tag => {
            let charTag = tag.name.charAt(0).toLowerCase()
            return allChars.includes(charTag)
          })
          // console.log(chars[firstChars])
          // console.log('tags filtered by first character')
        }
      }
      if (state.filters.category) {
        let filteredCategory = JSON.parse(JSON.stringify(state.filters.category))
        if (filteredCategory.length) {
          if (state.filters.categoryLogic) {
            tags = tags.filter({'category': filteredCategory})
          } else {
            tags = tags.filter(tag=>{
              let include = false
              for (let i=0; i<filteredCategory.length;i++) {
                if (tag.category.includes(filteredCategory[i])) include = true
              }
              return include
            })
          }
          // console.log('tags filtered by category')
        }
      }
      if (state.filters.name) {
        let frase = state.filters.name.toLowerCase().trim()
        if (frase.length) {
          if (state.filters.alternate === true) {
            let filteredByNames = await tags.filter(
              tag => (tag.name.toLowerCase().includes(frase))
            ).map('id').value()

            let filteredByAlternate = await tags.filter( tag => {
              let alternates = tag.altNames.map(p=>(p.toLowerCase()))
              let matches = alternates.filter(a=>a.includes(frase))
              if (matches.length>0) {
                return true
              } else { return false } 
            }).map('id').value()

            let mergedIds = _.union(filteredByNames, filteredByAlternate)

            tags = tags.filter(p=>(mergedIds.includes(p.id)))
          } else {
            tags = tags.filter(
              tag => (tag.name.toLowerCase().includes(frase)))
          }
          // console.log(`tags filtered by frase "${frase}" in name`)
        }
      }
      if (state.filters.sortBy) {
        let sort = state.filters.sortBy
        let direction = state.filters.sortDirection
        if (sort === 'name') {
          tags = tags.orderBy(p=>(p.name.toLowerCase()), [direction])
        } else {
          tags = tags.orderBy(sort, [direction])
        }
        // console.log('tags sorted')
        // TODO: add correct sort for collors based on swatches array
      }
      if (state.filters.favorite) {
        tags = tags.filter(tag=>(tag.favorite))
        // console.log('tags with favorite')
      }
      if (state.filters.bookmark) {
        tags = tags.filter(tag=>(tag.bookmark))
        // console.log('tags with bookmark')
      }
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
      commit('filterTags', filteredTags)
      if (!stayOnCurrentPage) {
        commit('changeTagsPageCurrent', 1)
      }
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
    tagsFilters: (state, store) => {
      let filters = []
      if (state.filters.name) {
        filters.push('Name:' + state.filters.name)
      }
      if (state.filters.favorite) {
        filters.push('Fav.')
      }
      if (state.filters.bookmark) {
        filters.push('Book.')
      }
      if (state.filters.firstChar.length) {
        let chars = ['0-9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#']
        chars = state.filters.firstChar.map((c)=>(chars[c]))
        let filterChars = 'Char.:'
        filterChars += chars.join(';')
        filters.push(filterChars)
      }
      if (state.filters.category.length) {
        let filterCategory = 'Cat.:'
        filterCategory += state.filters.category.join(';')
        filters.push(filterCategory)
      }
      if (filters.length) {
        return filters.join(', ')
      } else {
        return 'Tags'
      }
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
    tagsOnPage(state, store) {
      const tags = store.filteredTags.value(),
            tagsCount = store.tagsPerPage
      let l = tags.length,
          c = tagsCount
      state.pageTotal = Math.ceil(l/c)
      if(state.pageCurrent > state.pageTotal) {
        state.pageCurrent = state.pageTotal
      }
      
      const end = state.pageCurrent * tagsCount,
            start = end - tagsCount;
      return tags.slice(start, end)
    },
    tagsPerPage(state) {
      return state.tagsPerPage
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
    tagsCurrentPage(state) {
      return state.pageCurrent
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