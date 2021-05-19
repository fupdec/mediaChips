<template>
  <div>
    <v-dialog v-if="dialogEditMeta" :value="dialogEditMeta" @input="closeSettings" scrollable width="80vw" max-width="700">
      <v-card>
        <v-toolbar color="primary">
          <v-card-title class="headline pl-0">Settings for meta "{{this.meta.settings.name}}"</v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="saveSettings" outlined large>
            <v-icon left>mdi-content-save</v-icon> Save </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="px-4">
            <div class="d-flex justify-space-between pb-4">
              <v-chip label small outlined class="mr-4">
                <v-icon left small>mdi-calendar-plus</v-icon> Added: {{dateAdded}}
              </v-chip>
              <v-chip label small outlined>
                <v-icon left small>mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
              </v-chip>
            </div>
            <v-form v-model="valid" ref="form" class="flex-grow-1" @submit.prevent>
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
                <v-col cols="12" align="center">
                  <v-card outlined class="pa-4">
                    <span class="text-center">
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-icon v-on="on" left>mdi-help-circle-outline</v-icon>
                        </template>
                        <span>Drag to change order</span>
                      </v-tooltip>
                      <span class="overline">Meta in Cards</span> 
                    </span>
                    <v-card v-if="settings.metaInCard.length" outlined class="mb-4 mt-2">
                      <v-list dense class="list-zebra pa-0">
                        <v-list-item-group color="primary">
                          <draggable v-model="settings.metaInCard" v-bind="dragOptions" @start="drag=true" @end="drag=false">
                            <transition-group type="transition">
                              <v-list-item v-for="(meta, i) in settings.metaInCard" :key="i">
                                <v-icon left>mdi-{{getMeta(meta.id).settings.icon}}</v-icon>
                                {{getMeta(meta.id).settings.name}}
                                <span class="px-2">({{meta.type}})</span>
                                <span class="caption px-2">id: {{meta.id}}</span>
                                <span v-if="meta.type=='simple'" class="caption px-2">
                                  {{getMeta(meta.id).dataType}}
                                </span>
                              </v-list-item>
                            </transition-group>
                          </draggable>
                        </v-list-item-group>
                      </v-list>
                    </v-card>
                    <div v-else class="mb-4">
                      <v-icon large class="mb-2">mdi-card-off-outline</v-icon>
                      <div>No meta added to the cards</div>
                    </div>
                    <v-btn @click="dialogAddMetaToCard=true" color="success" small rounded>
                      <v-icon left>mdi-plus</v-icon>Add meta to cards</v-btn>
                  </v-card>
                </v-col>
                <v-col cols="12" align="center">
                  <v-card outlined class="pa-4">
                    <span class="overline text-center">Specific meta</span>
                    <v-row>
                      <v-col cols="12">
                        <v-switch v-model="settings.synonyms" :label="`Synonyms: ${settings.synonyms?'On':'Off'}`" class="ma-0" hide-details/>
                      </v-col>
                      <v-col cols="6">
                        <v-switch v-model="settings.favorite" :label="`Favorites: ${settings.favorite?'On':'Off'}`" class="ma-0" hide-details/>
                      </v-col>
                      <v-col cols="6">
                        <v-switch v-model="settings.rating" :label="`Ratings: ${settings.rating?'On':'Off'}`" class="ma-0" hide-details/>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <v-card outlined class="pa-4">
                    <div class="overline text-center mb-4">Chips Appearance</div>
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
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <v-card outlined class="pa-4">
                    <v-row>
                      <v-col cols="12" align="center" class="pb-0">
                        <span class="overline text-center">Card Appearance</span>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-switch v-model="settings.images" :label="`Images: ${settings.images?'Yes':'No'}`" class="ma-0" hide-details/>
                        <v-radio-group v-if="settings.images" v-model="settings.imageAspectRatio" column mandatory hide-details>
                          <span class="mb-2">Aspect ratio of images:</span>
                          <v-radio :value="1"><template v-slot:label><v-icon left>mdi-image</v-icon> 1:1 </template></v-radio>
                          <v-radio :value="16/9"><template v-slot:label><v-icon left>mdi-image-area</v-icon> 16:9 </template></v-radio>
                          <v-radio :value="5/8"><template v-slot:label><v-icon left>mdi-image-album</v-icon> 5:8 </template></v-radio>
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
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    
    <v-dialog v-if="dialogAddMetaToCard" v-model="dialogAddMetaToCard" scrollable max-width="350">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">Add Meta to Cards</div>
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
import draggable from 'vuedraggable'
import icons from '@/assets/material-icons.json'
import NameRules from '@/mixins/NameRules'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  props: {
    dialogEditMeta: false,
    metaIndex: Number,
  },
  name: "DialogEditMeta",
  components: {
    vuescroll,
    draggable,
	},
  created() {
  },
  mixins: [NameRules, MetaGetters], 
  mounted () {
    this.$nextTick(function () {
      this.settings = { ...this.settings, ...this.meta.settings }
    })
  },
  data: () => ({
    dialogAddMetaToCard: false,
    icons: icons,
    selectedMetaForCard: null,
    valid: false,
    settings: {
      name: '',
      nameSingular: '',
      icon: 'shape',
      images: true,
      imageAspectRatio: '',
      imageTypes: ['main'],
      chipLabel: false,
      chipOutlined: false,
      chipColor: false,
      cardSize: 1,
      synonyms: false,
      favorite: true,
      rating: false,
      metaInCard: [],
    },
    drag: false,
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
  }),
  computed: {
    complexMetaList() { return this.$store.getters.complexMeta.value() },
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
    meta() { return _.cloneDeep(this.complexMetaList[this.metaIndex]) },
    metaForCard() {
      let metaInCardIds = this.settings.metaInCard.map(i=>i.id)
      let freeMetaList = this.$store.getters.meta.filter(i=>!metaInCardIds.includes(i.id)).cloneDeep().value()
      return _.filter(freeMetaList, i=>i.id!=this.meta.id)
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
    saveSettings() {
      this.$refs.form.validate()
      if (!this.valid) return
      this.$store.getters.meta.find({id: this.meta.id}).set('edit', Date.now()).set('settings', this.settings).write()
      this.$store.commit('getMetaListFromDb')
      this.$emit('closeSettings')
    },
    closeSettings() { this.$emit('closeSettings') },
    getRandomColor() { return '#'+Math.floor(Math.random()*16777215).toString(16) },
  },
}
</script>