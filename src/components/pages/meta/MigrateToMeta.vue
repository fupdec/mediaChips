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

import vuescroll from 'vuescroll'

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
      // this.createPerformers()
      // this.createTags()
      // this.createWebsites()
      // let performers = this.$store.getters.performers.value()
      // let tags = this.$store.getters.tags.value()
      // let websites = this.$store.getters.websites.value()
      // console.log(websites)
      this.isMigrationRunning = false
      // TODO close all tabs, update meta in player window
    },
    createPerformers() {
      let performers = this.$store.getters.performers.value()
      
      let id = shortid.generate()
      let complexMetaPerformers = {
        id: id,
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
          metaInCard: [],
        },
        state: {
          visibility: {
            name: true,
          },
        },
      }
      // this.$store.dispatch('addComplexMeta', complexMetaPerformers)

// 'aliases'
// 'tags'
// 'favorite'
// 'bookmark'
// 'rating'
// 'nations'
// 'views'

      let simpleMetaTypeString = []
      let simpleMetaTypeDate = ['birthday']
      let simpleMetaTypeNumber = ['start', 'end', 'height', 'weight', 'bra', 'waist', 'hip', ]
      let simpleMetaTypeArray = ['ethnicity', 'hair', 'eyes', 'category', 'boobs', 'cups']
      let simpleMetaTypeBoolean = []

      for (let i = 0; i < simpleMetaTypeString.length; i++) {
        const element = simpleMetaTypeString[i]
        
      }


      console.log(performers)
    },
    createTags() {
      let tags = this.$store.getters.tags.value()
      let tagsId = shortid.generate()
      let simpleMetaCategoryId = shortid.generate() 

      // operations with images
      const currPath  = path.join(this.pathToUserData, `/media/tags`)
      const newPath  = path.join(this.pathToUserData, `/media/meta/${tagsId}`)
      // rename tag images to tag_main.jpg
      for (const oldFile of fs.readdirSync(currPath)) {
        const extension = path.extname(oldFile)
        const name = path.basename(oldFile, extension)
        const oldFileName = path.join(currPath, oldFile)
        const newFileName = path.join(currPath, `${name}main${extension}`)
        fs.renameSync(oldFileName, newFileName)
      }
      // move folder with tag images
      try {
        fs.renameSync(currPath, newPath)
        console.log("Successfully renamed tags directory.")
      } catch(err) {
        console.log(err)
      }

      // complex meta
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
          },
        },
      }
      this.$store.dispatch('addComplexMeta', complexMetaTags)

      // simple meta
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

      // cards
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i]
        let bookmark = ''
        if (tag.bookmark) this.$store.getters.bookmarks.get('tags').find({itemId:tag.id}).value().text
        
        let card = {
          id: tag.id,
          metaId: tagsId,
          date: tag.date,
          edit: tag.edit,
          views: 0,
          meta: {
            name: tag.name,
            color: tag.color || '#777777',
            bookmark: bookmark,
            synonyms: tag.altNames || [],
            favorite: tag.favorite || false,
            [simpleMetaCategoryId]: tag.category.map(i=>_.find(tagCategoriesItems ,{name:i}).id),
          },
        }

        this.$store.dispatch('addMetaCard', card)
      }
      // update tags in videos db
      let cards = this.$store.getters.metaCards.filter({metaId:tagsId})
      this.$store.getters.videos.each(video=>{
        video[tagsId] = video.tags.map(tag=>{
          let card = cards.find(card=>card.meta.name===tag).value()
          if (card) return card.id
        })
        video.tags = undefined
      }).write()

       // add meta to video meta in card settings
      this.$store.getters.settings.get('videoMetaInCard').push({id:tagsId,type:'complex'}).write()
      this.$store.state.Settings.videoMetaInCard = this.$store.getters.settings.get('videoMetaInCard').value()
    },
    createWebsites() {
      let websites = this.$store.getters.websites.value()
      let websitesId = shortid.generate()
      let simpleMetaUrlId = shortid.generate() 

      // operations with images
      const currPath  = path.join(this.pathToUserData, `/media/websites`)
      const newPath  = path.join(this.pathToUserData, `/media/meta/${websitesId}`)
      // rename website images to website_main.jpg
      for (const oldFile of fs.readdirSync(currPath)) {
        const extension = path.extname(oldFile)
        const name = path.basename(oldFile, extension)
        const oldFileName = path.join(currPath, oldFile)
        const newFileName = path.join(currPath, `${name}main${extension}`)
        fs.renameSync(oldFileName, newFileName)
      }
      // move folder with website images
      try {
        fs.renameSync(currPath, newPath)
        console.log("Successfully renamed websites directory.")
      } catch(err) {
        console.log(err)
      }

      // complex meta
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
          },
        },
      }
      this.$store.dispatch('addComplexMeta', complexMetaWebsites)

      // simple meta
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

      // cards
      for (let i = 0; i < websites.length; i++) {
        const web = websites[i]
        let bookmark = ''
        if (web.bookmark) this.$store.getters.bookmarks.get('websites').find({itemId:web.id}).value().text
        
        let card = {
          id: web.id,
          metaId: websitesId,
          date: web.date,
          edit: web.edit,
          views: web.views,
          meta: {
            name: web.name,
            color: web.color || '#777777',
            bookmark: bookmark,
            synonyms: web.altNames || [],
            favorite: web.favorite || false,
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
      // update websites in videos db
      this.$store.getters.videos.each(video=>{
        video[websitesId] = video.websites.map(web=>{
          let card = cards.find(card=>card.meta.name===web).value()
          if (card) return card.id
        })
        video.websites = undefined
      }).write()
      
      // add meta to video meta in card settings
      this.$store.getters.settings.get('videoMetaInCard').push({id:websitesId,type:'complex'}).write()
      this.$store.state.Settings.videoMetaInCard = this.$store.getters.settings.get('videoMetaInCard').value()
    },
    closeDialog() { this.$emit('finish') },
  },
}
</script>