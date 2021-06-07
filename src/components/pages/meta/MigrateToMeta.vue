<template>
  <v-dialog v-model="dialog" persistent max-width="500">
    <v-card>
      <v-alert type="success" text>Migration finished!</v-alert>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog" :disabled="isMigrationRunning" color="success" class="mb-4">
          <v-icon left>mdi-flag-checkered</v-icon> Finish migration</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")

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
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    migrate() {
      let performersId = shortid.generate()
      let tagsId = shortid.generate()
      let websitesId = shortid.generate()
      this.createPerformers(performersId, tagsId)
      this.createTags(tagsId)
      this.parseTagsForPerformers(performersId, tagsId)
      this.createWebsites(websitesId)
      this.isMigrationRunning = false

      // TODO close all tabs, update meta in player window, add migration state to settings
      
      //-add meta to video meta in card settings
      this.$store.getters.settings.get('videoMetaInCard')
        .push({ id: performersId, type: 'complex' })
        .push({ id: tagsId, type: 'complex' })
        .push({ id: websitesId, type: 'complex' })
        .write()
      this.$store.state.Settings.videoMetaInCard = this.$store.getters.settings.get('videoMetaInCard').value()
    
      // this.moveImages(performersId, tagsId, websitesId)
    },
    createPerformers(performersId, tagsId) {
      let performers = this.$store.getters.performers.value()
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
            items: parseItems(this.$store.state.Settings.performerInfoEthnicity),
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
            items: parseItems(this.$store.state.Settings.performerInfoHair),
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
            items: parseItems(this.$store.state.Settings.performerInfoEyes),
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
            items: parseItems(this.$store.state.Settings.performerInfoCups),
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
            items: parseItems(this.$store.state.Settings.performerInfoBoobs),
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
            items: parseItems(this.$store.state.Settings.performerInfoCategory),
          },
        },
      )

      //-parsing custom parameters of performers
      function parseItems(items) { return items.map(i=>{ if (i.length) return{ id:shortid.generate(), name:i } }) }
      
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
        if (cp.type == 'array') nMeta.settings.items = parseItems(cp.items || [])
        newMetaArr.push(nMeta)
      }

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

      console.log(newMetaArr)

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
      
// TODO add hint setting to meta

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
        for (let i = 0; i < metaForParsingPerformer.length; i++) {
          const e = metaForParsingPerformer[i]
          if (e.type == 'number') otherMeta[e.id] = Number(p[e.name])
          else if (e.type == 'array') otherMeta[e.id] = p[e.name].map(i=>{
            let el = _.find(e.items,{name:i})
            if (el) return el.id
          })
          else otherMeta[e.id] = p[e.name]
        }

        return {...specificMeta, ...otherMeta}
      }

      for (let i = 0; i < performers.length; i++) {
        const performer = performers[i]
        
        let card = {
          id: performer.id,
          metaId: performersId,
          date: performer.date,
          edit: performer.edit,
          views: 0,
          meta: parsePerformerForMeta(performer),
        }

        this.$store.dispatch('addMetaCard', card)
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
    },
    createTags(tagsId) {
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
          chipOutlined: false,
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
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i]
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
    },
    parseTagsForPerformers(performersId, tagsId) {
      // let tagCards = this.$store.getters.metaCards.filter({metaId:tagsId}).value()
      let tagCards = this.$store.getters.metaCards.filter({metaId:'Z4Nd9Eghh'}).value()
      
      // tagCard.settings.name
      console.log(tagCards)
    },
    createWebsites(websitesId) {
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
      for (let i = 0; i < websites.length; i++) {
        const web = websites[i]
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