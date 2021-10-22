<template>
  <v-dialog v-model="dialog" persistent max-width="600">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Create meta</div>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog" outlined><v-icon left>mdi-close</v-icon>close</v-btn>
      </v-toolbar>
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
const {app} = require('electron').remote
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
  },
  methods: {
    async createAllMeta() {
      let pId = shortid.generate()
      let tagsId = shortid.generate()

      await this.createPerformers(pId, tagsId)
      await this.createTags(tagsId)
    
      this.$store.getters.settings.get('metaAssignedToVideos')
        .push({ id: pId, type: 'complex' })
        .push({ id: tagsId, type: 'complex' })
        .write()
      
      this.createMetaFolder(pId)
      this.createMetaFolder(tagsId)

      this.$store.state.Settings.metaAssignedToVideos = this.$store.getters.settings.get('metaAssignedToVideos').value()

      this.$store.dispatch('updateSettingsState', {key:'databaseVersion', value:app.getVersion()})
            
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
          dataType: 'array',
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
            imageAspectRatio: 0.625,
            imageTypes: [ 'main', 'alt', 'custom1', 'custom2', 'avatar', 'header' ],
            chipLabel: false,
            chipOutlined: false,
            color: false,
            synonyms: true,
            rating: true,
            favorite: true,
            country: true,
            career: true,
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
            imageAspectRatio: 1,
            imageTypes: ['main'],
            chipLabel: false,
            chipOutlined: true,
            color: true,
            synonyms: true,
            rating: false,
            favorite: true,
            country: false,
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