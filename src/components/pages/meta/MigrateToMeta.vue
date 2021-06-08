<template>
  <v-dialog v-model="dialog" persistent max-width="600">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Migration to the new meta system</div>
      </v-toolbar>
      <v-card-text v-if="isMigrationRunning" class="text-center">
        <h3 class="py-4">Migration in progress...</h3>
        <v-icon x-large class="loading-animation">mdi-loading</v-icon>
      </v-card-text>
      <v-card-text v-else class="text-center">
        <v-alert color="success" text class="mt-4">Migration finished!</v-alert>
      </v-card-text>
      <v-card-text>
        <div>Creating performers... {{status.performers}} of {{performers.length}}</div>
        <div>Creating tags... {{status.tags}} of {{tags.length}}</div>
        <div>Creating websites... {{status.websites}} of {{websites.length}}</div>
      </v-card-text>
      <v-card-actions v-if="!isMigrationRunning">
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog" color="success" class="ma-4"><v-icon left>mdi-check</v-icon>ok</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")
// TODO add hint setting to meta
export default {
  name: 'MigrateToMeta',
  props: {
    dialog: Boolean,
  },
  components: {
  },
  mounted() {
    this.$nextTick(function () {
      setTimeout(() => { this.migrate() }, 500)
    })
  },
  data: () => ({
    isMigrationRunning: true,
    status: {
      performers: 0,
      tags: 0,
      websites: 0,
    }
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    performers() { return this.$store.getters.performers.value() },
    tags() { return this.$store.getters.tags.value() },
    websites() { return this.$store.getters.websites.value() },
  },
  methods: {
    async migrate() {
      let performersId = shortid.generate()
      let tagsId = shortid.generate()
      let websitesId = shortid.generate()
      await this.createPerformers(performersId, tagsId)
      await this.createTags(tagsId)
      await this.createWebsites(websitesId)
      this.parseTagsForPerformers(performersId, tagsId)
      this.isMigrationRunning = false

      // TODO close all tabs, update meta in player window, add migration state to settings
      
      //-add meta to video meta in card settings
      this.$store.getters.settings.get('videoMetaInCard')
        .push({ id: performersId, type: 'complex' })
        .push({ id: tagsId, type: 'complex' })
        .push({ id: websitesId, type: 'complex' })
        .write()
      this.$store.state.Settings.videoMetaInCard = this.$store.getters.settings.get('videoMetaInCard').value()
    
      this.moveImages(performersId, tagsId, websitesId)
    },
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) },
    parseItems(items) { return items.map(i=>{ if (i.length) return{ id:shortid.generate(), name:i } }) },
    async createPerformers(performersId, tagsId) {
      return new Promise(resolve => {
        let customParams = this.$store.state.Settings.customParametersPerformer
        let newMetaArr = []
        newMetaArr.push(
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'date',
          scraperField: 'birthday',
          settings: { 
            name: 'Birthday', 
            icon: 'cake-variant',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'career_start',
          settings: { 
            name: 'Career start', 
            icon: 'calendar',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'career_end',
          settings: { 
            name: 'Career end', 
            icon: 'calendar',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'height',
          settings: { 
            name: 'Height', 
            icon: 'human-male-height',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'weight',
          settings: { 
            name: 'Weight', 
            icon: 'weight',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'bra',
          settings: { 
            name: 'Bra', 
            icon: 'tape-measure',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'waist',
          settings: { 
            name: 'Waist', 
            icon: 'tape-measure',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'hip',
          settings: { 
            name: 'Hip', 
            icon: 'tape-measure',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'ethnicity',
          settings: { 
            name: 'Ethnicity', 
            icon: 'account-group',
            items: this.parseItems(this.$store.state.Settings.performerInfoEthnicity),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'hair',
          settings: { 
            name: 'Hair', 
            icon: 'face-woman-shimmer-outline',
            items: this.parseItems(this.$store.state.Settings.performerInfoHair),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'eyes',
          settings: { 
            name: 'Eyes', 
            icon: 'eye',
            items: this.parseItems(this.$store.state.Settings.performerInfoEyes),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'cups',
          settings: { 
            name: 'Cups', 
            icon: 'coffee',
            items: this.parseItems(this.$store.state.Settings.performerInfoCups),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'boobs',
          settings: { 
            name: 'Boobs',
            icon: 'circle',
            items: this.parseItems(this.$store.state.Settings.performerInfoBoobs),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'category',
          settings: { 
            name: 'Category', 
            icon: 'shape',
            items: this.parseItems(this.$store.state.Settings.performerInfoCategory),
          },
        },
      )

        //-parsing custom parameters of performers
        for (let i = 0; i < customParams.length; i++) {
          const cp = customParams[i]
          let nMeta = {
            id: shortid.generate(),
            type: 'simple',
            dataType: cp.type,
            settings: {
              name: cp.name,
              icon: 'shape',
            }
          }
          if (cp.type == 'array') nMeta.settings.items = this.parseItems(cp.items || [])
          newMetaArr.push(nMeta)
        }
        resolve(newMetaArr)
      })
      .then(newMetaArr=>{
        //-parsing meta in card
        let metaInCardForPerformers = [{ id: tagsId, type: 'complex' }]

        for (let i = 0; i < newMetaArr.length; i++) {
          const e = newMetaArr[i]
          let mc = {id: e.id, type: 'simple'}
          if (e.scraperField) {
            mc.scraperField = e.scraperField
            delete e.scraperField
          }
          metaInCardForPerformers.push(mc)
          this.$store.dispatch('addSimpleMeta', e)
        }
        
        let complexMetaPerformers = {
          id: performersId,
          type: 'complex',
          settings: { 
            name: 'Performers',
            nameSingular: 'Performer',
            icon: 'account-outline',
            images: true,
            imageAspectRatio: 0.625,
            imageTypes: [ 'main', 'alt', 'custom1', 'custom2', 'avatar', 'header' ],
            chipLabel: false,
            chipOutlined: false,
            color: false,
            synonyms: true,
            rating: true,
            favorite: true,
            country: true,
            scraper: true,
            bookmark: true,
            nested: false,
            metaInCard: _.cloneDeep(metaInCardForPerformers),
          },
          state: {
            visibility: {
              name: true,
              cardSize: 3,
            },
          },
        }
        this.$store.dispatch('addComplexMeta', complexMetaPerformers)
        return newMetaArr
      })
      .then(async (newMetaArr)=>{
        //-CARDS
        let presetValues = { //-metaName: performerKey
          Birthday: 'birthday',
          ['Career start']: 'start',
          ['Career end']: 'end',
          Height: 'height',
          Weight: 'weight',
          Bra: 'bra',
          Waist: 'waist',
          Hip: 'hip',
          Ethnicity: 'ethnicity',
          Hair: 'hair',
          Eyes: 'eyes',
          Cups: 'cups',
          Boobs: 'boobs',
          Category: 'category',
        }

        let metaForParsingPerformer = newMetaArr.map(e=>{
          const field = presetValues[e.settings.name]
          let item = {id:e.id, type:e.dataType}
          if (e.dataType=='array') item.items = _.cloneDeep(e.settings.items)
          if (field) item.name = field
          else item.name = e.settings.name
          return item
        })

        const bookmarks = this.$store.getters.bookmarks.get('performers')
        function parsePerformerForMeta(p) {
          let bookmark = ''
          if (p.bookmark) bookmark = bookmarks.find({itemId:p.id}).value().text
          
          let specificMeta = {
            name: p.name,
            synonyms: p.aliases || [],
            favorite: p.favorite || false,
            rating: p.rating || 0,
            bookmark: bookmark,
            country: p.nations || [],
          }

          let otherMeta = {}
          for (const e of metaForParsingPerformer) {
            if (e.type == 'number') {
              let val = Number(p[e.name])
              if (val) otherMeta[e.id] = val
              else otherMeta[e.id] = 0
            }
            else if (e.type == 'array') {
              let arr = p[e.name].filter(j => {if (j) return j})
              let arrVal = []
              for (const j of arr) {
                let el = _.find(e.items,{name:j})
                if (el) arrVal.push(el.id)
              }
              otherMeta[e.id] = arrVal
            }
            else {
              let val = p[e.name]
              if (val) otherMeta[e.id] = val
              else otherMeta[e.id] = ''
            }
          }

          return {...specificMeta, ...otherMeta}
        }

        let performers = this.$store.getters.performers.value()
        for (const performer of performers) {
          let resultForMeta = parsePerformerForMeta(performer)

          let card = {
            id: performer.id,
            metaId: performersId,
            date: performer.date,
            edit: performer.edit,
            views: 0,
            meta: resultForMeta,
          }
          
          this.$store.dispatch('addMetaCard', card)
          
          await this.sleep(1)
          ++this.status.performers
        }

        //-update performers in videos db
        let cards = this.$store.getters.metaCards.filter({metaId:performersId})
        this.$store.getters.videos.each(video=>{
          video[performersId] = video.performers.map(performer=>{
            let card = cards.find(card=>card.meta.name===performer).value()
            if (card) return card.id
          })
          video.performers = undefined
        }).write()
      })
    },
    async createTags(tagsId) {
      return new Promise(async resolve => {
        let tags = this.$store.getters.tags.value()
        let simpleMetaCategoryId = shortid.generate()

        //-complex meta
        let complexMetaTags = {
          id: tagsId,
          type: 'complex',
          settings: { 
            name: 'Tags',
            nameSingular: 'Tag',
            icon: 'tag-outline',
            images: true,
            imageAspectRatio: 1,
            imageTypes: ['main'],
            chipLabel: false,
            chipOutlined: true,
            color: true,
            synonyms: true,
            rating: false,
            favorite: true,
            country: false,
            scraper: false,
            bookmark: true,
            nested: false,
            metaInCard: [
              {
                id: simpleMetaCategoryId,
                type: 'simple'
              },
            ],
          },
          state: {
            visibility: {
              name: true,
              cardSize: 3,
            },
          },
        }
        this.$store.dispatch('addComplexMeta', complexMetaTags)

        //-simple meta
        let tagCategories = this.$store.state.Settings.tagInfoCategory || []
        for (let i = 0; i < tags.length; i++) {
          let el = tags[i].category
          if (el!==undefined&&el.length) tagCategories = _.union(tagCategories, el)
        }
        let tagCategoriesItems = tagCategories.map(i=>{return{id:shortid.generate(),name:i}})

        let simpleMetaCategory = {
          id: simpleMetaCategoryId,
          type: 'simple',
          dataType: 'array',
          settings: { 
            name: 'Category', 
            icon: 'shape',
            items: tagCategoriesItems,
          },
        }
        this.$store.dispatch('addSimpleMeta', simpleMetaCategory)

        //-cards
        for (const tag of tags) {
          let bookmark = ''
          if (tag.bookmark) bookmark = this.$store.getters.bookmarks.get('tags').find({itemId:tag.id}).value().text
          
          let card = {
            id: tag.id,
            metaId: tagsId,
            date: tag.date,
            edit: tag.edit,
            views: 0,
            meta: {
              name: tag.name,
              synonyms: tag.altNames || [],
              favorite: tag.favorite || false,
              color: tag.color || '#777777',
              bookmark: bookmark,
              [simpleMetaCategoryId]: tag.category.map(i=>_.find(tagCategoriesItems ,{name:i}).id),
            },
          }

          this.$store.dispatch('addMetaCard', card)
          
          await this.sleep(1)
          ++this.status.tags
        }
        //-update tags in videos db
        let cards = this.$store.getters.metaCards.filter({metaId:tagsId})
        this.$store.getters.videos.each(video=>{
          video[tagsId] = video.tags.map(tag=>{
            let card = cards.find(card=>card.meta.name===tag).value()
            if (card) return card.id
          })
          video.tags = undefined
        }).write()
        resolve()
      })
    },
    async createWebsites(websitesId) {
      return new Promise(async resolve => {
        let websites = this.$store.getters.websites.value()
        let simpleMetaUrlId = shortid.generate() 

        //-complex meta
        let complexMetaWebsites = {
          id: websitesId,
          type: 'complex',
          settings: { 
            name: 'Websites',
            nameSingular: 'Website',
            icon: 'web',
            images: true,
            imageAspectRatio: 1,
            imageTypes: ['main'],
            chipLabel: true,
            chipOutlined: true,
            color: true,
            synonyms: true,
            rating: false,
            favorite: true,
            country: false,
            scraper: false,
            bookmark: true,
            nested: true,
            metaInCard: [
              {
                id: simpleMetaUrlId,
                type: 'simple'
              },
            ],
          },
          state: {
            visibility: {
              name: true,
              cardSize: 3,
            },
          },
        }
        this.$store.dispatch('addComplexMeta', complexMetaWebsites)

        //-simple meta
        let simpleMetaUrl = {
          id: simpleMetaUrlId,
          type: 'simple',
          dataType: 'string',
          settings: {
            name: 'URL',
            icon: 'link',
          },
        }
        this.$store.dispatch('addSimpleMeta', simpleMetaUrl)

        //-cards
        for (const web of websites) {
          let bookmark = ''
          if (web.bookmark) bookmark = this.$store.getters.bookmarks.get('websites').find({itemId:web.id}).value().text
          
          let card = {
            id: web.id,
            metaId: websitesId,
            date: web.date,
            edit: web.edit,
            views: web.views,
            meta: {
              name: web.name,
              synonyms: web.altNames || [],
              favorite: web.favorite || false,
              color: web.color || '#777777',
              bookmark: bookmark,
              [simpleMetaUrlId]: web.url || '',
            },
          }

          this.$store.dispatch('addMetaCard', card)

          await this.sleep(1)
          ++this.status.websites
        }

        let cards = this.$store.getters.metaCards.filter({metaId:websitesId})
        let result = []
        for (let i = 0; i < websites.length; i++) {
          const web = websites[i]
          if (!web.network) { result.push({id:web.id, nested:[]}); continue }
          let nested = web.childWebsites.map(child=>{
            let websiteCard = cards.find(card=>card.meta.name.toLowerCase()===child.toLowerCase()).value()
            if (websiteCard) return { id: websiteCard.id, nested: []}
          })
          result.push({id:web.id, nested})
        }
        this.$store.getters.meta.find({id:websitesId}).set('state.nested',result).write()
        //-update websites in videos db
        this.$store.getters.videos.each(video=>{
          video[websitesId] = video.websites.map(web=>{
            let card = cards.find(card=>card.meta.name===web).value()
            if (card) return card.id
          })
          video.websites = undefined
        }).write()
        resolve()
      })
    },
    parseTagsForPerformers(performersId, tagsId) {
      let tagCards = this.$store.getters.metaCards.filter({metaId:tagsId})
      let performerCards = this.$store.getters.metaCards.filter({metaId:performersId})
      let performers = this.$store.getters.performers
      
      performerCards.each(i=>{
        let perf = performers.find({id:i.id}).value()
        if (perf) {
          let foundTags = []
          for (const tag of perf.tags) {
            let ft = tagCards.find(j=>tag===j.meta.name).value()
            if (ft) foundTags.push(ft.id)
          }
          i.meta[tagsId] = foundTags
        }
      }).write()
    },
    moveImages(performersId, tagsId, websitesId) {
      //-operations with images
      const currPathPerformers  = path.join(this.pathToUserData, `/media/performers`)
      const newPathPerformers  = path.join(this.pathToUserData, `/media/meta/${performersId}`)
      try {
        fs.renameSync(currPathPerformers, newPathPerformers)
        console.log("Successfully renamed performers directory.")
      } catch(err) {
        console.log(err)
      } 

      const currPathTags  = path.join(this.pathToUserData, `/media/tags`)
      const newPathTags  = path.join(this.pathToUserData, `/media/meta/${tagsId}`)
      //-rename tag images to tag_main.jpg
      for (const oldFile of fs.readdirSync(currPathTags)) {
        const extension = path.extname(oldFile)
        const name = path.basename(oldFile, extension)
        const oldFileName = path.join(currPathTags, oldFile)
        const newFileName = path.join(currPathTags, `${name}main${extension}`)
        fs.renameSync(oldFileName, newFileName)
      }
      //-move folder with tag images
      try {
        fs.renameSync(currPathTags, newPathTags)
        console.log("Successfully renamed tags directory.")
      } catch(err) {
        console.log(err)
      }
      
      const currPathWebsites  = path.join(this.pathToUserData, `/media/websites`)
      const newPathWebsites  = path.join(this.pathToUserData, `/media/meta/${websitesId}`)
      //-rename website images to website_main.jpg
      for (const oldFile of fs.readdirSync(currPathWebsites)) {
        const extension = path.extname(oldFile)
        const name = path.basename(oldFile, extension)
        const oldFileName = path.join(currPathWebsites, oldFile)
        const newFileName = path.join(currPathWebsites, `${name}main${extension}`)
        fs.renameSync(oldFileName, newFileName)
      }
      //-move folder with website images
      try {
        fs.renameSync(currPathWebsites, newPathWebsites)
        console.log("Successfully renamed websites directory.")
      } catch(err) {
        console.log(err)
      }
    },
    closeDialog() { this.$emit('finish') },
  },
}
</script>