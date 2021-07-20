<template>
  <v-dialog v-model="dialog" persistent max-width="600">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Create meta</div>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog" outlined><v-icon left>mdi-close</v-icon>close</v-btn>
      </v-toolbar>
      <v-card-text class="text-center">
        <div class="d-flex mt-6">
          <span class="mr-6 body-1">Create meta for adult content:</span>
          <v-switch v-model="showAdultContent" :label="showAdultContent?'Yes':'No'" class="d-inline mt-0 pt-0" hide-details/>
        </div>
      </v-card-text>
      <v-card-actions class="pb-4">
        <v-spacer></v-spacer>
        <v-btn @click="createAllMeta" color="primary" rounded class="pr-4">
          <v-icon left>mdi-auto-fix</v-icon>create Meta</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")
const { ipcRenderer } = require('electron')

export default {
  name: 'CreateAllMeta',
  props: {
    dialog: Boolean,
  },
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    showAdultContent: {
      get() {return this.$store.state.Settings.showAdultContent},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'showAdultContent', value})},
    },
  },
  methods: {
    async createAllMeta() {
      if (this.showAdultContent) {
        let performersId = shortid.generate()
        let tagsId = shortid.generate()
        let websitesId = shortid.generate()

        await this.createPerformers(performersId, tagsId)
        await this.createTags(tagsId)
        await this.createWebsites(websitesId)
     
        this.$store.getters.settings.get('metaAssignedToVideos')
          .push({ id: performersId, type: 'complex' })
          .push({ id: tagsId, type: 'complex' })
          .push({ id: websitesId, type: 'complex' })
          .write()
        
        this.createMetaFolder(performersId)
        this.createMetaFolder(tagsId)
        this.createMetaFolder(websitesId)
      } else {
        let pId = shortid.generate()
        let tagsId = shortid.generate()

        await this.createPerformersNonAdult(pId, tagsId)
        await this.createTags(tagsId)
     
        this.$store.getters.settings.get('metaAssignedToVideos')
          .push({ id: pId, type: 'complex' })
          .push({ id: tagsId, type: 'complex' })
          .write()
        
        this.createMetaFolder(pId)
        this.createMetaFolder(tagsId)
      }
      this.$store.state.Settings.metaAssignedToVideos = this.$store.getters.settings.get('metaAssignedToVideos').value()

      this.$store.dispatch('updateSettingsState', {key:'databaseVersion', value:'0.9.3'})
            
      ipcRenderer.send('updatePlayerDb', 'settings') // update settings in player window
      ipcRenderer.send('updatePlayerDb', 'meta') // update meta in player window
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update meta in player window
      this.$emit('finish') 
    },
    parseItems(items) { return items.map(i=>{ if (i.length) return{ id:shortid.generate(), name:i } }) },
    async createPerformers(performersId, tagsId) {
      return new Promise(resolve => {
        let newMetaArr = []

        newMetaArr.push(
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'date',
          scraperField: 'birthday',
          settings: { 
            name: 'Birthday', 
            hint: 'YYYY-MM-DD', 
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
            hint: 'YYYY', 
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
            hint: 'YYYY', 
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
            hint: 'cm', 
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
            hint: 'kg', 
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
            hint: 'inch', 
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
            hint: 'inch', 
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
            hint: 'inch', 
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
            hint: '', 
            icon: 'account-group',
            items: this.parseItems(['Asian','Black','Caucasian','Ebony','Hispanic','Latin','White']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'hair',
          settings: { 
            name: 'Hair', 
            hint: '', 
            icon: 'face-woman-shimmer-outline',
            items: this.parseItems(['Black','Blond','Brown','Grey','Red']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'eyes',
          settings: { 
            name: 'Eyes', 
            hint: '', 
            icon: 'eye',
            items: this.parseItems(['Blue','Brown','Green','Grey','Hazel']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'cups',
          settings: { 
            name: 'Cups', 
            hint: '', 
            icon: 'coffee',
            items: this.parseItems(['A','AA','B','C','D','DD','DDD','E','EE','EEE','F','FF','G','GG','H','HH','I','J','K','L','M','N']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'boobs',
          settings: { 
            name: 'Boobs',
            hint: '', 
            icon: 'circle',
            items: this.parseItems(['Real','Fake']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'category',
          settings: { 
            name: 'Category',
            hint: 'Profession',  
            icon: 'shape',
            items: this.parseItems(['Pornstar','Amateur','Erotic model']),
          },
        },
      )

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
            hint: 'People in the video',  
            icon: 'account-outline',
            hidden: false,
            parser: true,
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
            markers: true,
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
    },
    async createPerformersNonAdult(performersId, tagsId) {
      return new Promise(resolve => {
        let newMetaArr = []

        newMetaArr.push(
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'category',
          settings: { 
            name: 'Profession',
            hint: '',  
            icon: 'account-hard-hat',
            items: this.parseItems(['Actress', 'Musician', 'Supermodel']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'date',
          scraperField: 'birthday',
          settings: { 
            name: 'Birthday', 
            hint: 'YYYY-MM-DD', 
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
            hint: 'YYYY', 
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
            hint: 'YYYY', 
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
            hint: 'cm', 
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
            hint: 'kg', 
            icon: 'weight',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'ethnicity',
          settings: { 
            name: 'Ethnicity', 
            hint: '', 
            icon: 'account-group',
            items: this.parseItems(['Asian','Black','Caucasian','Ebony','Hispanic','Latin','White']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'hair',
          settings: { 
            name: 'Hair', 
            hint: '', 
            icon: 'face-woman-shimmer-outline',
            items: this.parseItems(['Black','Blond','Brown','Grey','Red']),
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'array',
          scraperField: 'eyes',
          settings: { 
            name: 'Eyes', 
            hint: '', 
            icon: 'eye',
            items: this.parseItems(['Blue','Brown','Green','Grey','Hazel']),
          },
        },
      )

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
            hint: 'People in the video',  
            icon: 'account-outline',
            hidden: false,
            parser: true,
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
            markers: true,
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
    },
    async createTags(tagsId) {
      return new Promise(async resolve => {
        //-complex meta
        let complexMetaTags = {
          id: tagsId,
          type: 'complex',
          settings: { 
            name: 'Tags',
            nameSingular: 'Tag',
            hint: 'For a quick search',
            icon: 'tag-outline',
            hidden: false,
            parser: true,
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
            markers: true,
            metaInCard: [],
          },
          state: {
            visibility: {
              name: true,
              cardSize: 3,
            },
          },
        }
        this.$store.dispatch('addComplexMeta', complexMetaTags)
        resolve()
      })
    },
    async createWebsites(websitesId) {
      return new Promise(async resolve => {
        let simpleMetaUrlId = shortid.generate() 

        //-complex meta
        let complexMetaWebsites = {
          id: websitesId,
          type: 'complex',
          settings: { 
            name: 'Websites',
            nameSingular: 'Website',
            hint: 'Studios',
            icon: 'web',
            hidden: false,
            parser: true,
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
            markers: false,
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
            hint: 'Address in the internet',
            icon: 'link',
          },
        }
        this.$store.dispatch('addSimpleMeta', simpleMetaUrl)

        resolve()
      })
    },
    createMetaFolder(metaId) {
      const pathMeta = path.join(this.pathToUserData, `/media/meta`)
      const newPathMeta = path.join(this.pathToUserData, `/media/meta/${metaId}`)
      if (!fs.existsSync(pathMeta)) fs.mkdirSync(pathMeta)
      if (!fs.existsSync(newPathMeta)) fs.mkdirSync(newPathMeta)
    },
    closeDialog() { this.$emit('close') },
  },
}
</script>