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
      this.createTags()
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
    },
    closeDialog() { this.$emit('finish') },
  },
}
</script>