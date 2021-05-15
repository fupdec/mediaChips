<template>
  <div>
    <v-dialog v-if="dialogEditMeta" :value="dialogEditMeta" @input="closeSettings" scrollable max-width="600">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">Meta Settings</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-cog</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <div class="d-flex justify-space-between px-4 pt-2">
          <v-chip label small outlined class="mr-4">
            <v-icon left small>mdi-calendar-plus</v-icon> Added: {{dateAdded}}
          </v-chip>
          <v-chip label small outlined>
            <v-icon left small>mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
          </v-chip>
        </div>
        <vuescroll>
          <v-card-text class="px-4">
            <v-form v-model="validMetaSettings" ref="formMetaSettings" class="flex-grow-1" @submit.prevent>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="settings.name" :rules="[nameRules]" label="Name of meta"/>
                  <v-text-field v-model="settings.nameSingular" :rules="[nameRules]" label="Name singular"/>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-autocomplete v-model="settings.icon" :items="icons" :filter="filterIcons"
                    item-text="name" item-value="name" label="Icon"
                    :rules="[value => !!value || 'Icon is required']">
                    <template v-slot:selection="data">
                      <v-icon>mdi-{{data.item.name}}</v-icon> <span class="mx-2">{{data.item.name}}</span>
                    </template>
                    <template v-slot:item="data">
                      <v-icon left>mdi-{{data.item.name}}</v-icon>
                      <span v-html="data.item.name"></span>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" align="center" class="pb-0">
                  <span class="overline text-center">Chips Appearance</span>
                </v-col>
                <v-col cols="12">
                  <div class="d-flex justify-space-around">
                    <div class="d-flex justify-space-between">
                      <v-checkbox v-model="settings.chipLabel" label="Label" class="my-0 mr-6" hide-details/>
                      <v-checkbox v-model="settings.chipOutlined" label="Outlined" class="my-0 mr-6" hide-details/>
                      <v-checkbox v-model="settings.chipColor" label="Color" class="my-0" hide-details/>
                    </div>
                    <v-spacer></v-spacer>
                    <v-chip :label="settings.chipLabel" :outlined="settings.chipOutlined" 
                      :color="settings.chipColor?getRandomColor():''">Example chip</v-chip>
                  </div>
                </v-col>
                <v-col cols="12" align="center" class="pb-0">
                  <span class="overline text-center">Card Appearance</span>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-switch v-model="settings.images" :label="`Images: ${settings.images?'Yes':'No'}`" class="ma-0" hide-details/>
                  <v-radio-group v-if="settings.images" v-model="settings.imageAspectRatio" column mandatory hide-details>
                    <span class="mb-2">Aspect ratio of images:</span>
                    <v-radio value="square"><template v-slot:label><v-icon left>mdi-image</v-icon> 1:1 </template></v-radio>
                    <v-radio value="album"><template v-slot:label><v-icon left>mdi-image-area</v-icon> 16:9 </template></v-radio>
                    <v-radio value="portrait"><template v-slot:label><v-icon left>mdi-image-album</v-icon> 9:16 </template></v-radio>
                  </v-radio-group>
                </v-col>
                <v-col cols="12" sm="6" v-if="settings.images">
                  <div class="mb-2 body-1">Type of Images:</div>
                  <v-checkbox v-model="settings.imageTypes" label="Main" value="main" class="ma-0 pa-0" hide-details disabled/>
                  <v-checkbox v-model="settings.imageTypes" label="Alternate" value="alt" class="ma-0 pa-0" hide-details/>
                  <v-checkbox v-model="settings.imageTypes" label="Custom 1" value="custom1" class="ma-0 pa-0" hide-details/>
                  <v-checkbox v-model="settings.imageTypes" label="Custom 2" value="custom2" class="ma-0 pa-0" hide-details/>
                  <v-checkbox v-model="settings.imageTypes" label="Avatar" value="avatar" class="ma-0 pa-0" hide-details/>
                  <v-checkbox v-model="settings.imageTypes" label="Header" value="header" class="ma-0 pa-0" hide-details/>
                </v-col>
                <v-col cols="12" align="center">
                  <span class="overline text-center">Meta in Card</span>
                  <v-list v-if="settings.metaInCard.length" dense class="mb-2">
                    <v-list-item-group color="primary">
                      <v-list-item v-for="(meta, i) in settings.metaInCard" :key="i">
                        <v-icon left>mdi-{{getMetaByType(meta.type, meta.id).settings.icon}}</v-icon>
                        {{getMetaByType(meta.type, meta.id).settings.name}}
                        <span class="px-2">({{meta.type}})</span>
                      </v-list-item>
                    </v-list-item-group>
                  </v-list>
                  <div v-else class="mb-4">
                    <v-icon large class="mb-2">mdi-card-off-outline</v-icon>
                    <div>No meta added to the card</div>
                  </div>
                  <v-btn @click="dialogAddMetaToCard=true" color="success" small rounded>
                    <v-icon left>mdi-plus</v-icon>Add meta to card</v-btn>
                </v-col>
                <v-col cols="12" align="center" class="pb-0">
                  <span class="overline text-center">Specific meta</span>
                </v-col>
                <v-col cols="12">
                  <v-switch v-model="settings.synonyms" :label="`Synonyms: ${settings.synonyms?'Yes':'No'}`" class="ma-0" hide-details/>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="saveSettings" class="ma-4 pr-4" rounded color="primary">
            <v-icon left>mdi-content-save</v-icon> Save Settings </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-dialog v-if="dialogAddMetaToCard" v-model="dialogAddMetaToCard" scrollable max-width="350">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">Add Meta to Card</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="px-4">
            <v-autocomplete v-model="selectedMetaForCard" label="Meta name" :items="metaForCard"
              :rules="[value => !!value || 'Meta is required']" item-value="id">
              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
                <span class="ml-2">({{data.item.type}})</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
                <span class="ml-2">({{data.item.type}})</span>
              </template>
            </v-autocomplete>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="addMetaToCard" class="ma-4 pr-4" rounded color="primary">
            <v-icon left>mdi-plus</v-icon> Add Meta To Card </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'

export default {
  props: {
    dialogEditMeta: false,
    metaIndex: Number,
  },
  name: "DialogEditMeta",
  components: {
    vuescroll,
	},
  created() {
  },
  mounted () {
    this.$nextTick(function () {
      this.settings = { ...this.settings, ...this.meta.settings }
    })
  },
  data: () => ({
    dialogAddMetaToCard: false,
    icons: icons,
    selectedMetaForCard: null,
    validMetaSettings: false,
    settings: {
      name: '',
      nameSingular: '',
      icon: 'shape',
      images: false,
      imageAspectRatio: '',
      imageTypes: ['main'],
      chipLabel: false,
      chipOutlined: false,
      chipColor: false,
      cardSize: 1,
      synonyms: false,
      metaInCard: [],
    },
    reserved: ['id','name','duration','size','resolution','rating','favorite','bookmark',
      'date','edit','views','array','type','number','string','boolean'],
  }),
  computed: {
    metaList() { return this.$store.getters.meta.value() },
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
    meta() { return _.cloneDeep(this.metaList[this.metaIndex]) },
    metaForCard() {
      let existMeta = _.filter(this.settings.metaInCard, {type:'complex'}).map(i=>i.id)
      let existSimpleMeta = _.filter(this.settings.metaInCard, {type:'simple'}).map(i=>i.id)
      let metaList = this.$store.getters.meta.filter(i=>!existMeta.includes(i.id)).cloneDeep().value()
      metaList = _.filter(metaList, i=>i.id!=this.meta.id)
      metaList = metaList.map(i => {i.type = 'complex'; return i})
      let simpleMetaList = this.$store.getters.simpleMeta.filter(i=>!existSimpleMeta.includes(i.id)).cloneDeep().value()
      simpleMetaList = simpleMetaList.map(i => {i.type = 'simple'; return i})
      let list = [...metaList, ...simpleMetaList]
      // TODO remove from list current meta and already added meta in settings.meta
      return list
    },
    dateAdded() {
      let date = new Date(this.meta.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.meta.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
  methods: {
    nameRules(name) {
      name = name.trim().toLowerCase()
      if (name.length > 30) {
        return 'Name must be less than 30 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (!/^[a-zA-Z\s]*$/g.test(name)) {
        return 'Name must content only letters'
      } else if (this.reserved.includes(name)) {
        return 'This word is reserved'
      } else {
        return true
      }
    },
    filterIcons(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const aliases = item.aliases
      let found = false
      for (let i=0;i<aliases.length;i++) {
        if (aliases[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    addMetaToCard() {
      if (this.selectedMetaForCard == null || this.selectedMetaForCard.length == 0) return // check if empty
      if (_.filter(this.settings.metaInCard, {id:this.selectedMetaForCard}).length > 0) return // check for dups
      let meta = _.find(this.metaForCard, {id: this.selectedMetaForCard})
      let metaForAdding = { id: meta.id, type: meta.type } 
      this.settings.metaInCard.push(metaForAdding)
      this.dialogAddMetaToCard = false
      this.selectedMetaForCard = null
    },
    getMetaByType(type, id) {
      if (type == 'simple') return _.find(this.simpleMetaList, {id})
      else return _.find(this.metaList, {id})
    },
    saveSettings() {
      this.$refs.formMetaSettings.validate()
      if (!this.validMetaSettings) return
      this.$store.getters.meta.find({id: this.meta.id}).set('edit', Date.now()).set('settings', this.settings).write()
      this.$store.commit('getMetaListFromDb')
      this.$emit('closeSettings')
    },
    closeSettings() { this.$emit('closeSettings') },
    getRandomColor() { return '#'+Math.floor(Math.random()*16777215).toString(16) },
  },
}
</script>