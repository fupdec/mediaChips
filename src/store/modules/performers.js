const {app} = require('electron').remote
const fs = require("fs")
const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const pathToDbSettings = path.join(app.getPath('userData'), 'userfiles/dbs.json')
const pathToDbPerformers = path.join(app.getPath('userData'), 'userfiles/databases/dbp.json')
const adapterSettings = new FileSync(pathToDbSettings)
const adapterPerformers = new FileSync(pathToDbPerformers)
const low = require('lowdb')
const dbs = low(adapterSettings)
const dbp = low(adapterPerformers)
dbp.defaults({ performers: [] }).write()

const defaultFilters = {
  favorite: false,
  bookmark: false,
  firstChar: [],
  tags: [],
  tagsLogic: false,
  name: '',
  aliases: false,
  category: [],
  categoryLogic: false,
  ratingActive: false,
  rating: [0, 5],
  ageActive: false,
  age: [18, 99],
  careerActive: false,
  career: [1980, new Date().getFullYear()],
  careerEnded: false,
  heightActive: false,
  height: [100, 220],
  weightActive: false,
  weight: [20, 220],
  braActive: false,
  bra: [20, 60],
  waistActive: false,
  waist: [20, 60],
  hipActive: false,
  hip: [20, 60],
  nation: [],
  ethnicity: [],
  ethnicityLogic: false,
  hair: [],
  hairLogic: false,
  eyes: [],
  eyesLogic: false,
  cup: [],
  boobs: [],
  body: [],
  bodyLogic: false,
  pussy: [],
  pussyLips: [],
  pussyHair: [],
  pussyHairLogic: false,
  sortBy: 'name',
  sortDirection: 'asc',
}

const Performers = {
  state: () => ({
    performersPerPage: dbs.get('performersPerPage').value(),
    pageCurrent: 1,
    pageTotal: 1,
    lastChanged: Date.now(),
    showMoreFilters: false,
    defaultFilters: _.cloneDeep(defaultFilters),
    filters: _.cloneDeep(defaultFilters),
    filtersReserved: _.cloneDeep(defaultFilters),
    filteredPerformers: [],
    filteredEmpty: false,
    selection: null,
    selectedPerformers: [],
    dialogDeletePerformer: false,
    dialogEditPerformerInfo: false,
    dialogEditPerformerImages: false,
    updateImages: {},
    updateInfo: {},
    rating: 0,
    performerChipsColored: dbs.get('performerChipsColored').value(),
    performerEditBtnHidden: dbs.get('performerEditBtnHidden').value(),
    performerMeterHidden: dbs.get('performerMeterHidden').value(),
    performerNameHidden: dbs.get('performerNameHidden').value(),
    performerRatingHidden: dbs.get('performerRatingHidden').value(),
    performerNationalityHidden: dbs.get('performerNationalityHidden').value(),
    performerFavoriteHidden: dbs.get('performerFavoriteHidden').value(),
    performerProfileProgressHidden: dbs.get('performerProfileProgressHidden').value(),
    performerAliasesHidden: dbs.get('performerAliasesHidden').value(),
    performerCareerStatusHidden: dbs.get('performerCareerStatusHidden').value(),
    performerTagsHidden: dbs.get('performerTagsHidden').value(),
    performerVideoTagsHidden: dbs.get('performerVideoTagsHidden').value(),
    menuCard: false,
  }),
  mutations: {
    updatePerformers (state) {
      console.log(':::::::performers UPDATED:::::::')
      state.lastChanged = Date.now()
    },
    changePerformersPerPage(state, quantity) {
      state.performersPerPage = quantity
    },
    changePerformersPageTotal(state, quantity) {
      state.pageTotal = quantity
    },
    changePerformersPageCurrent(state, quantity) {
      state.pageCurrent = quantity
    },
    updateFiltersOfPerformers(state, {key, value}) {
      state.filters[key] = value
      // console.log(state.filters)
    },
    filterPerformers(state, filteredPerformers) {
      state.filteredPerformers = filteredPerformers
    },
    resetFilteredPerformers(state) {
      state.filters = _.cloneDeep(defaultFilters)
    },
    updateSelectedPerformers(state, ids) {
      state.selectedPerformers = ids
    },
  },
  actions: {
    changePerformersPerPage({ state, commit, getters}, quantity) {
      commit('updatePerformers')
      commit('changePerformersPerPage', quantity)
      getters.settings.set('performersPerPage', quantity).write()
    },
    changePerformersPageTotal({ state, commit}, quantity) {
      commit('updatePerformers')
      commit('changePerformersPageTotal', quantity)
    },
    changePerformersPageCurrent({ state, commit}, quantity) {
      commit('updatePerformers')
      commit('changePerformersPageCurrent', quantity)
    },
    async filterPerformers({ state, commit, getters}, stayOnCurrentPage) {
      let performers = getters.performers
      let filteredPerformers = []
      performers = performers.orderBy(p=>(p.name.toLowerCase()), ['asc'])
      if (state.filters.firstChar) {
        let firstChars = state.filters.firstChar
        let chars = ['0123456789','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!$@^&*\'+-_~']
        let allChars = []
        firstChars.forEach( char => { allChars.push(chars[char]) } )
        // console.log(allChars)
        if (allChars.length) {
          performers = performers.filter( performer => {
            let charPerformer = performer.name.charAt(0).toLowerCase()
            return allChars.includes(charPerformer)
          })
          // console.log(chars[firstChars])
          // console.log('performers filtered by first character')
        }
      }
      if (state.filters.tags) {
        let filteredTags = state.filters.tags
        if (filteredTags.length) {
          if (state.filters.tagsLogic) {
            performers = performers.filter({'tags': filteredTags})
          } else {
            performers = performers.filter(performer=>{
              let include = false
              for (let i=0; i<filteredTags.length;i++) {
                if (performer.tags.includes(filteredTags[i])) {
                  include = true
                }
              }
              return include
            })
          }
          // console.log('performers filtered by tags')
        }
      }
      if (state.filters.category) {
        let filteredCategory = JSON.parse(JSON.stringify(state.filters.category))
        if (filteredCategory.length) {
          if (state.filters.categoryLogic) {
            performers = performers.filter({'category': filteredCategory})
          } else {
            if (filteredCategory.includes('None')) {
              console.log('performers filtered by category')
              performers = performers.filter(performer=>(!performer.category.length))
            } else {
              performers = performers.filter(performer=>{
                let include = false
                for (let i=0; i<filteredCategory.length;i++) {
                  if (performer.category.includes(filteredCategory[i])) {
                    include = true
                  }
                }
                return include
              })
            }
          }
          // console.log('performers filtered by category')
        }
      }
      if (state.filters.ratingActive) {
        let r = state.filters.rating
        performers = performers.filter(p => (p.rating>=r[0] && p.rating<=r[1]))
        // console.log('performers filtered by rating')
        // console.log(r)
      }
      if (state.filters.ageActive) {
        let a = state.filters.age
        let year = new Date().getFullYear()
        performers = performers.filter(p => {
          if (p.birthday === '') {
            return false
          } else {
            let age = year - (+p.birthday.match(/\d{4}$/i)[0])
            return age>=a[0] && age<=a[1]
          }
        })
        // console.log('performers filtered by age')
        // console.log(a)
      }
      if (state.filters.careerActive) {
        let c = state.filters.career
        if (state.filters.careerEnded) {
          performers = performers.filter(p => (p.start>=c[0] && p.end<=c[1] && p.end!==""))
        } else {
          performers = performers.filter(p => (p.start>=c[0] && p.end===""))
        }
        // console.log('performers filtered by career years')
        // console.log(c)
      }
      if (state.filters.heightActive) {
        let h = state.filters.height
        performers = performers.filter(p => (p.height>=h[0] && p.height<=h[1]))
        // console.log('performers filtered by height')
        // console.log(h)
      }
      if (state.filters.weightActive) {
        let w = state.filters.weight
        performers = performers.filter(p => (p.weight>=w[0] && p.weight<=w[1]))
        // console.log('performers filtered by weight')
        // console.log(w)
      }
      if (state.filters.braActive) {
        let b = state.filters.bra
        performers = performers.filter(p => (p.bra>=b[0] && p.bra<=b[1]))
        // console.log('performers filtered by bra')
        // console.log(b)
      }
      if (state.filters.waistActive) {
        let w = state.filters.waist
        performers = performers.filter(p => (p.waist>=w[0] && p.waist<=w[1]))
        // console.log('performers filtered by waist')
        // console.log(w)
      }
      if (state.filters.hipActive) {
        let h = state.filters.hip
        performers = performers.filter(p => (p.hip>=h[0] && p.hip<=h[1]))
        // console.log('performers filtered by hip')
        // console.log(h)
      }
      if (state.filters.ethnicity) {
        let filteredEthnicity = state.filters.ethnicity
        if (filteredEthnicity.length) {
          if (state.filters.ethnicityLogic) {
            performers = performers.filter({'ethnicity': filteredEthnicity})
          } else {
            if (filteredEthnicity.includes('None')) {
              performers = performers.filter(performer=>(!performer.ethnicity.length))
            } else {
              performers = performers.filter(performer=>{
                let include = false
                for (let i=0; i<filteredEthnicity.length;i++) {
                  if (performer.ethnicity.includes(filteredEthnicity[i])) {
                    include = true
                  }
                }
                return include
              })
            }
          }
          // console.log('performers filtered by ethnicity')
        }
      }
      if (state.filters.hair) {
        let filteredHair = state.filters.hair
        if (filteredHair.length) {
          if (state.filters.hairLogic) {
            performers = performers.filter({'hair': filteredHair})
          } else {
            if (filteredHair.includes('None')) {
              performers = performers.filter(performer=>(!performer.hair.length))
            } else {
              performers = performers.filter(performer=>{
                let include = false
                for (let i=0; i<filteredHair.length;i++) {
                  if (performer.hair.includes(filteredHair[i])) {
                    include = true
                  }
                }
                return include
              })
            }
          }
          // console.log('performers filtered by hair')
        }
      }
      if (state.filters.eyes) {
        let filteredEyes = state.filters.eyes
        if (filteredEyes.length) {
          if (state.filters.eyesLogic) {
            performers = performers.filter({'eyes': filteredEyes})
          } else {
            if (filteredEyes.includes('None')) {
              performers = performers.filter(performer=>(!performer.eyes.length))
            } else {
              performers = performers.filter(performer=>{
                let include = false
                for (let i=0; i<filteredEyes.length;i++) {
                  if (performer.eyes.includes(filteredEyes[i])) {
                    include = true
                  }
                }
                return include
              })
            }
          }
          // console.log('performers filtered by eyes')
        }
      }
      if (state.filters.cup.length) {
        if (state.filters.cup.includes('None')) {
          performers = performers.filter(p=>(p.cup === ''))
        } else {
          performers = performers.filter(p=>(state.filters.cup.includes(p.cup)))
        }
        // console.log('performers filtered by cup')
      }
      if (state.filters.boobs.length) {
        if (state.filters.boobs.includes('None')) {
          performers = performers.filter(p=>(p.boobs === ''))
        } else {
          performers = performers.filter(p=>(state.filters.boobs.includes(p.boobs.charAt(0).toUpperCase()+p.boobs.slice(1))))
        }
        // console.log('performers filtered by boobs')
      }
      if (state.filters.body) {
        let filteredBody = state.filters.body
        if (filteredBody.length) {
          if (state.filters.bodyLogic) {
            performers = performers.filter({'body': filteredBody})
          } else {
            if (filteredBody.includes('None')) {
              performers = performers.filter(performer=>(!performer.body.length))
            } else {
              performers = performers.filter(performer=>{
                let include = false
                for (let i=0; i<filteredBody.length;i++) {
                  if (performer.body.includes(filteredBody[i])) {
                    include = true
                  }
                }
                return include
              })
            }
          }
          // console.log('performers filtered by body')
        }
      }
      if (state.filters.pussy.length) {
        if (state.filters.pussy.includes('None')) {
          performers = performers.filter(p=>(p.pussy === ''))
        } else {
          performers = performers.filter(p=>(state.filters.pussy.includes(p.pussy)))
        }
        // console.log('performers filtered by pussy')
      }
      if (state.filters.pussyLips.length) {
        if (state.filters.pussyLips.includes('None')) {
          performers = performers.filter(p=>(p.pussyLips === ''))
        } else {
          performers = performers.filter(p=>(state.filters.pussyLips.includes(p.pussyLips)))
        }
        // console.log('performers filtered by pussyLips')
      }
      if (state.filters.pussyHair) {
        let filteredPussyHair = state.filters.pussyHair
        if (filteredPussyHair.length) {
          if (state.filters.pussyHairLogic) {
            performers = performers.filter({'pussyHair': filteredPussyHair})
          } else {
            if (filteredPussyHair.includes('None')) {
              performers = performers.filter(performer=>(!performer.pussyHair.length))
            } else {
              performers = performers.filter(performer=>{
                let include = false
                for (let i=0; i<filteredPussyHair.length;i++) {
                  if (performer.pussyHair.includes(filteredPussyHair[i])) {
                    include = true
                  }
                }
                return include
              })
            }
          }
          // console.log('performers filtered by pussyHair')
        }
      }
      if (state.filters.nation.length) {
        if (state.filters.nation.includes('None')) {
          performers = performers.filter(p=>(p.nation === ''))
        } else {
          performers = performers.filter(p=>(state.filters.nation.includes(p.nation)))
        }
        // console.log('performers filtered by nationality')
      }
      if (state.filters.name) {
        let frase = state.filters.name.toLowerCase().trim()
        if (frase.length) {
          if (state.filters.aliases === true) {
            let filteredByNames = await performers.filter(
              perf => (perf.name.toLowerCase().includes(frase))
            ).map('id').value()

            let filteredByAliases = await performers.filter( perf => {
              let aliases = perf.aliases.map(p=>(p.toLowerCase()))
              let matches = aliases.filter(a=>a.includes(frase))
              if (matches.length>0) {
                return true
              } else { return false } 
            }).map('id').value()

            let mergedIds = _.union(filteredByNames, filteredByAliases)

            performers = performers.filter(p=>(mergedIds.includes(p.id)))
          } else {
            performers = performers.filter(
              perf => (perf.name.toLowerCase().includes(frase)))
          }
          // console.log(`performers filtered by frase "${frase}" in name`)
        }
      }
      if (state.filters.sortBy) {
        let sort = state.filters.sortBy
        let direction = state.filters.sortDirection
        if (sort === 'name') {
          performers = performers.orderBy(p=>(p.name.toLowerCase()), [direction])
        } else if (sort === 'video') {
          performers = performers.orderBy(p=>(
            getters.videos.filter({performers: [p.name]}).value().length
          ), [direction])
        } else {
          performers = performers.orderBy(sort, [direction])
        }
        // console.log('performers sorted')
      }
      if (state.filters.favorite) {
        performers = performers.filter(performer=>(performer.favorite))
        // console.log('favorite performers')
      }
      if (state.filters.bookmark) {
        performers = performers.filter(performer=>(performer.bookmark))
        // console.log('performers with bookmark')
      }
      // console.log(performers.value())
      if (performers != getters.performers) {
        if (performers.value().length == 0) {
          state.filteredEmpty = true
          filteredPerformers = performers
        } else {
          state.filteredEmpty = false
          filteredPerformers = performers
        }
      }
      // console.log(filteredPerformers)
      commit('filterPerformers', filteredPerformers)
      if (!stayOnCurrentPage) {
        commit('changePerformersPageCurrent', 1)
      }
    },
    deletePerformers({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedPerformers.map(id => {
        let performerName = getters.performers.find({id:id}).value().name
        // remove performer from videos
        getters.videos.each(video=>{
          let index = video.performers.indexOf(performerName)
          if (index !== -1) video.performers.splice(index, 1)
        }).write()
        // remove perfromer from database
        getters.performers.remove({ 'id': id }).write()
        // remove images of perfromer
        let imageTypes = ['main','alt','custom1','custom2','avatar','header']
        imageTypes.map(img=>{
          let imgPath = path.join(getters.getPathToUserData, `/media/performers/${id}_${img}.jpg`)
          fs.unlink(imgPath, (err) => {
            if (err) {
              console.log("failed to delete local image:"+err)
            } else {
              console.log('successfully deleted local image')
            }
          })
        })
      })
      commit('updateSelectedPerformers', [])
      commit('updatePerformers')
      dispatch('filterPerformers', true)
    },
    updatePerformerChipsColored({state, getters}, value) {
      getters.settings.set('performerChipsColored', value).write()
      state.performerChipsColored = value
    },
    updatePerformerEditBtnHidden({state, getters}, value) {
      getters.settings.set('performerEditBtnHidden', value).write()
      state.performerEditBtnHidden = value
    },
    updatePerformerMeterHidden({state, getters}, value) {
      getters.settings.set('performerMeterHidden', value).write()
      state.performerMeterHidden = value
    },
    updatePerformerNameHidden({state, getters}, value) {
      getters.settings.set('performerNameHidden', value).write()
      state.performerNameHidden = value
    },
    updatePerformerRatingHidden({state, getters}, value) {
      getters.settings.set('performerRatingHidden', value).write()
      state.performerRatingHidden = value
    },
    updatePerformerNationalityHidden({state, getters}, value) {
      getters.settings.set('performerNationalityHidden', value).write()
      state.performerNationalityHidden = value
    },
    updatePerformerFavoriteHidden({state, getters}, value) {
      getters.settings.set('performerFavoriteHidden', value).write()
      state.performerFavoriteHidden = value
    },
    updateProfileProgressHidden({state, getters}, value) {
      getters.settings.set('performerProfileProgressHidden', value).write()
      state.performerProfileProgressHidden = value
    },
    updatePerformerAliasesHidden({state, getters}, value) {
      getters.settings.set('performerAliasesHidden', value).write()
      state.performerAliasesHidden = value
    },
    updatePerformerCareerStatusHidden({state, getters}, value) {
      getters.settings.set('performerCareerStatusHidden', value).write()
      state.performerCareerStatusHidden = value
    },
    updatePerformerTagsHidden({state, getters}, value) {
      getters.settings.set('performerTagsHidden', value).write()
      state.performerTagsHidden = value
    },
    updatePerformerVideoTagsHidden({state, getters}, value) {
      getters.settings.set('performerVideoTagsHidden', value).write()
      state.performerVideoTagsHidden = value
    },
  },
  getters: {
    dbp(state) {
      return state.lastChanged, dbp
    },
    performers(state, store) {
      return store.dbp.get('performers')
    },
    performersNames(state, store) {
      return store.dbp.get('performers').map('name').value()
    },
    performersNamesLower(state, store) {
      return store.dbp.get('performers').map(p=>p.name.toLowerCase()).value()
    },
    performersFilters: (state, store) => {
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
      if (state.filters.tags.length) {
        let filterTags = 'Tags:'
        filterTags += state.filters.tags.join(';')
        filters.push(filterTags)
      }
      if (state.filters.category.length) {
        let filterCategory = 'Cat.:'
        filterCategory += state.filters.category.join(';')
        filters.push(filterCategory)
      }
      if (state.filters.nation.length) {
        let filterNation = 'Nat.:'
        filterNation += state.filters.nation.join(';')
        filters.push(filterNation)
      }
      if (state.filters.ageActive) {
        filters.push(`Age:${state.filters.age[0]}-${state.filters.age[1]}`)
      }
      if (state.filters.careerActive) {
        filters.push(`Car.:${state.filters.career[0]}-${state.filters.career[1]}`)
      }
      if (state.filters.heightActive) {
        filters.push(`Hgt:${state.filters.height[0]}-${state.filters.height[1]}cm`)
      }
      if (state.filters.weightActive) {
        filters.push(`Wgt:${state.filters.weight[0]}-${state.filters.weight[1]}kg`)
      }
      if (state.filters.braActive) {
        filters.push(`Bra:${state.filters.bra[0]}-${state.filters.bra[1]}`)
      }
      if (state.filters.waistActive) {
        filters.push(`Wst:${state.filters.waist[0]}-${state.filters.waist[1]}`)
      }
      if (state.filters.hipActive) {
        filters.push(`Hip:${state.filters.hip[0]}-${state.filters.hip[1]}`)
      }
      if (state.filters.ethnicity.length) {
        let filterEthnicity = 'Eth.:'
        filterEthnicity += state.filters.ethnicity.join(';')
        filters.push(filterEthnicity)
      }
      if (state.filters.hair.length) {
        let filterHair = 'Hair:'
        filterHair += state.filters.hair.join(';')
        filters.push(filterHair)
      }
      if (state.filters.eyes.length) {
        let filterEyes = 'Eyes:'
        filterEyes += state.filters.eyes.join(';')
        filters.push(filterEyes)
      }
      if (state.filters.cup.length) {
        let filterCup = 'Cup:'
        filterCup += state.filters.cup.join(';')
        filters.push(filterCup)
      }
      if (state.filters.boobs.length) {
        let filterBoobs = 'Boobs:'
        filterBoobs += state.filters.boobs.join(';')
        filters.push(filterBoobs)
      }
      if (state.filters.body.length) {
        let filterBody = 'Body:'
        filterBody += state.filters.body.join(';')
        filters.push(filterBody)
      }
      if (state.filters.pussy.length) {
        let filterPus = 'Pus.:'
        filterPus += state.filters.pussy.join(';')
        filters.push(filterPus)
      }
      if (state.filters.pussy.length) {
        let filterPussy = 'Pus.:'
        filterPussy += state.filters.pussy.join(';')
        filters.push(filterPussy)
      }
      if (state.filters.pussyLips.length) {
        let filterPussyLips = 'PL:'
        filterPussyLips += state.filters.pussyLips.join(';')
        filters.push(filterPussyLips)
      }
      if (state.filters.pussyHair.length) {
        let filterPussyHair = 'PH:'
        filterPussyHair += state.filters.pussyHair.join(';')
        filters.push(filterPussyHair)
      }
      if (filters.length) {
        return filters.join(', ')
      } else {
        return 'Performers'
      }
    },
    filteredPerformers(state, store) {
      // console.log(state.filteredPerformers.length)
      // console.log(state.filteredPerformers)
      let performers 
      if (state.filteredPerformers.length===0) {
        performers = store.performers
        console.log('get performers from db')
      }
      if (state.filteredPerformers.length!==0) {
        performers = state.filteredPerformers
        console.log('get filtered performers')
      }
      return performers
    },
    filteredPerformersTotal(state, store) {
      if (state.filteredPerformers.length==0) {
        // console.log(state.filteredPerformers.length)
        return state.filteredPerformers.length
      } else {
        // console.log(state.filteredPerformers.value().length)
        return state.filteredPerformers.value().length
      }
    },
    performersDataBase(state, store) {
      return store.dbp
    },
    performersTotal: (state, store) => {
      return store.performers.value().length;
    },
    performersOnPage(state, store) {
      const performers = store.filteredPerformers.value(),
            performersCount = store.performersPerPage
      // console.log(performers)
      let l = performers.length,
          c = performersCount;
      state.pageTotal = Math.ceil(l/c);
       // console.log(state.pageTotal)
      if(state.pageCurrent > state.pageTotal) {
        state.pageCurrent = state.pageTotal
      }
      
      const end = state.pageCurrent * performersCount,
            start = end - performersCount;
      return performers.slice(start, end)
    },
    performersPerPage(state) {
      return state.performersPerPage
    },
    performersPagesSum(state) {
      return state.pageTotal
    },
    performersPages(state, store) {
      let pages = []
      for (let i = 0; i < store.performersPagesSum; i++) {
        pages.push(i+1)
      }
      return pages
    },
    performersCurrentPage(state) {
      return state.pageCurrent
    },
    getSelectedPerformers(state) {
      return state.selectedPerformers
    },
  }
};

export default Performers