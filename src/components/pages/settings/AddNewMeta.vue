<template>
	<div>
    <v-card outlined class="py-2 mb-10">
      <div class="text-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" left>mdi-help-circle-outline</v-icon>
          </template>
          <div class="d-flex flex-column align-center">
            <span class="caption">add images, ratings, favorite to meta-cards</span>
            <div class="my-2">
              <v-icon size="40" dark>mdi-card-bulleted</v-icon>
              <v-icon size="50" dark class="mx-1">mdi-card-account-details</v-icon>
              <v-icon size="40" dark>mdi-card-text</v-icon>
              <v-icon size="30" dark>mdi-card-bulleted-outline</v-icon>
            </div>
          </div>
        </v-tooltip>
        <span class="overline">Meta with cards</span>
      </div>
      <v-list v-if="metaList.length" dense>
        <v-list-item-group color="primary">
          <v-list-item v-for="(meta, i) in metaList" :key="i">
            <v-icon left>mdi-{{meta.settings.icon}}</v-icon> 
            <div class="d-flex justify-space-between align-center" style="width:100%">
              <span>{{meta.name}}</span>
              <span>
                <v-btn @click="deleteMeta(i)" color="red" icon>
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </span>
            </div>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <div v-else class="d-flex justify-space-between align-center flex-column">
        <v-icon size="40" class="my-2">mdi-shape-outline</v-icon>
        <div class="d-flex align-center mb-2">It's so empty ... </div>
      </div>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialogAddNewMeta=true" rounded class="pr-4" color="primary">
          <v-icon left>mdi-plus</v-icon> <span>add new meta</span>  
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
    
    <v-card outlined class="py-2">
      <div class="text-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" left>mdi-help-circle-outline</v-icon>
          </template>
          <div class="d-flex flex-column align-center">
            <span class="caption">string, number, array, date, boolean</span>
            <div class="my-2">
              <v-icon size="40" dark>mdi-alphabetical</v-icon>
              <v-icon size="40" dark>mdi-numeric</v-icon>
              <v-icon size="50" dark>mdi-calendar</v-icon>
              <v-icon size="40" dark>mdi-code-brackets</v-icon>
              <v-icon size="30" dark>mdi-toggle-switch</v-icon>
            </div>
          </div>
        </v-tooltip>
        <span class="overline">Simple Meta</span>
      </div>
      <v-list v-if="simpleMetaList.length" dense>
        <v-list-item-group color="primary">
          <v-list-item v-for="(meta, i) in simpleMetaList" :key="i">
            <v-icon left>{{getIconMeta(meta.settings.type)}}</v-icon> 
            <div class="d-flex justify-space-between align-center" style="width:100%">
              <span>{{meta.name}}</span>
              <span>
                <v-btn @click="deleteMeta(i, 'simple')" color="red" icon>
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </span>
            </div>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <div v-else class="d-flex justify-space-between align-center flex-column">
        <v-icon size="40" class="my-2">mdi-shape-outline</v-icon>
        <div class="d-flex align-center mb-2">It's so empty ...</div>
      </div>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialogAddNewSimpleMeta=true" rounded class="pr-4" color="primary">
          <v-icon left>mdi-plus</v-icon> <span>add new meta</span>  
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
    
    <v-dialog v-model="dialogAddNewSimpleMeta" scrollable max-width="450">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">Adding a new simple meta</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="px-4">
            <v-form v-model="validSimpleMeta" ref="formSimpleMeta" class="flex-grow-1" @submit.prevent>
              <v-text-field v-model="simpleMetaName" :rules="[nameRules]" label="Name of meta"/>
              <v-autocomplete v-model="typeOfSimpleMeta" label="Type of meta"
                :items="['string', 'number', 'boolean', 'array', 'date']" class="mt-4"
                :rules="[value => !!value || 'Type is required']" persistent-hint :hint="hint">
                <template v-slot:selection="data">
                  <v-icon left small>{{getIconMeta(data.item)}}</v-icon> 
                  <span class="overline">{{data.item}}</span>
                </template>
                <template v-slot:item="data">
                  <template>
                    <v-icon left>{{getIconMeta(data.item)}}</v-icon> 
                    <span class="overline">{{data.item}}</span>
                  </template>
                </template>
              </v-autocomplete>
            </v-form>
            <div v-if="typeOfSimpleMeta=='array'">
              <div class="overline text-center mt-4">Items for array</div>
              <div v-if="array.length <= 1" class="caption text-center mb-4">
                <v-icon small left color="red">mdi-alert</v-icon>
                <span class="red--text"> In array must be more than 2 items </span>
              </div>
              <div class="d-flex">
                <v-btn @click="addNewItem" :disabled="!validItemName" 
                  height="40" class="mr-4" color="success" outlined rounded> 
                  <v-icon left>mdi-plus</v-icon> Add item 
                </v-btn>
                <v-form v-model="validItemName" ref="itemName" class="flex-grow-1" @submit.prevent>
                  <v-text-field v-model="itemName" :rules="[itemNameRules]" @keyup.enter="tryAddNewItem"
                    dense outlined label="Name of item" />
                </v-form>
              </div>
              <v-chip-group column>
                <v-chip v-for="item in array" :key="item" 
                  @click:close="removeItem(item)" close close-icon="mdi-close">{{item}}</v-chip>
              </v-chip-group>
            </div>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="addSimpleMeta" class="ma-4 pr-4" rounded color="primary">
            <v-icon left>mdi-plus</v-icon> Add meta </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="dialogAddNewMeta" scrollable max-width="450">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">Adding a new meta with cards</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="px-4">
            <v-form v-model="validMeta" ref="formMeta" class="flex-grow-1" @submit.prevent>
              <v-text-field v-model="metaName" :rules="[nameRules]" label="Name of meta"/>
              <v-autocomplete v-model="metaIcon" :items="icons" :filter="filterIcons"
                item-text="name" item-value="name" label="Icon" class="mt-4"
                :rules="[value => !!value || 'Icon is required']">
                <template v-slot:selection="data">
                  <v-icon left>mdi-{{data.item.name}}</v-icon> {{data.item.name}}
                </template>
                <template v-slot:item="data">
                  <template>
                    <v-icon left>mdi-{{data.item.name}}</v-icon>
                    <span v-html="data.item.name"></span>
                  </template>
                </template>
              </v-autocomplete>
            </v-form>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="addMeta" class="ma-4 pr-4" rounded color="primary">
            <v-icon left>mdi-plus</v-icon> Add meta </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'

export default {
  name: 'AddNewMeta',
  components: {
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogAddNewSimpleMeta: false,
    dialogAddNewMeta: false,
    // simple meta
    validSimpleMeta: false,
    simpleMetaName: '',
    typeOfSimpleMeta: '',
    validItemName: false,
    array: [],
    itemName: '',
    reserved: ['id','name','duration','size','resolution','rating','favorite','bookmark',
      'date','edit','views','array','type','number','string','boolean'],
    // meta with cards
    validMeta: false,
    metaName: '',
    metaIcon: 'shape',
    icons: icons,
  }),
  computed: {
    metaList() {
      return this.$store.getters.meta.value()
    },
    simpleMetaList() {
      return this.$store.getters.simpleMeta.value()
    },
    hint() {
      if (this.typeOfSimpleMeta === 'string') return 'for description, notes'
      if (this.typeOfSimpleMeta === 'date') return 'e.g. release date, last viewed date'
      if (this.typeOfSimpleMeta === 'number') return 'to count'
      if (this.typeOfSimpleMeta === 'array') return `for multiple values. for example colors: blue, red, green`
      if (this.typeOfSimpleMeta === 'boolean') return 'for one value. either yes or no'
      return 'choose one of the types'
    },
  },
  methods: {
    getIconMeta(meta) {
      if (meta === 'string') return 'mdi-alphabetical'
      if (meta === 'date') return 'mdi-calendar'
      if (meta === 'number') return 'mdi-numeric'
      if (meta === 'array') return 'mdi-code-array'
      if (meta === 'boolean') return 'mdi-toggle-switch'
      return 'mdi-shape'
    },
    deleteMeta(index, type) {
      let id, name
      if (type == 'simple') {
        id = this.simpleMetaList[index].id
        name = this.simpleMetaList[index].name
      } else {
        id = this.metaList[index].id 
        name = this.metaList[index].name
      }
      this.$store.dispatch('deleteMeta', {id, name, type})
    },
    // dialogs - simple meta
    nameRules(name) {
      name = name.trim().toLowerCase()
      let dup = this.$store.getters.meta.filter(meta => name==meta.name.toLowerCase()).value()
      let dupSimple = this.$store.getters.simpleMeta.filter(meta => name==meta.name.toLowerCase()).value()
      if (name.length > 30) {
        return 'Name must be less than 30 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (!/^[a-zA-Z]*$/g.test(name)) {
        return 'Name must content only letters'
      } else if (dup.length || dupSimple.length) {
        return 'Meta with that name already exists'
      } else if (this.reserved.includes(name)) {
        return 'This word is reserved'
      } else {
        return true
      }
    },
    itemNameRules(name) {
      name = name.trim().toLowerCase()
      let duplicate = this.array.includes(name)
      if (name.length > 30) {
        return 'Name must be less than 30 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\"<>{}\[\]]/g.test(name)) {
        return 'Name must not contain any of the characters \\/<>{}\[\]"'
      } else if (duplicate) {
        return 'Item with that name already exists'
      } else {
        return true
      }
    },
    tryAddNewItem() {
      if (this.validSimpleMeta) this.addNewItem()
    },
    addNewItem() {
      this.$refs.itemName.validate()
      if (!this.validItemName) return
      this.array.push(this.itemName)
      this.itemName = ''
    },
    removeItem(item) { 
      const index = this.array.indexOf(item)
      if (index >= 0) this.array.splice(index, 1)
    },
    addSimpleMeta() {
      this.$refs.formSimpleMeta.validate()
      if (!this.validSimpleMeta) return
      if (this.typeOfSimpleMeta=='array' && this.array.length <= 1) return

      let settings = { type: this.typeOfSimpleMeta }
      if (this.typeOfSimpleMeta=='array') settings.array = this.array

      this.$store.dispatch('addMeta', {
        id: shortid.generate(), 
        name: this.simpleMetaName, 
        type: 'simple', 
        settings
      })

      this.dialogAddNewSimpleMeta = false
      this.simpleMetaName = ''
      this.typeOfSimpleMeta = ''
      this.array = []
      this.itemName = ''
    },
    // dialogs - meta with cards
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
    addMeta() {
      this.$refs.formMeta.validate()
      if (!this.validMeta) return

      this.$store.dispatch('addMeta', {
        id: shortid.generate(), 
        name: this.metaName, 
        type: 'cards', 
        settings: { icon: this.metaIcon }
      })

      this.dialogAddNewMeta = false
      this.metaName = ''
      this.metaIcon = 'shape'
    },
  },
}
</script>