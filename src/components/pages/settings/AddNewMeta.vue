<template>
	<div>
    <v-card outlined class="py-2 mb-10">
      <div class="text-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" left>mdi-help-circle-outline</v-icon>
          </template>
          <div class="d-flex flex-column align-center">
            <span class="caption">Complex meta has a separate page with cards <br> 
              that can be customized in detail:<br>
              images, rating, favorite and etc.</span>
            <div class="mt-2">
              <v-icon size="40" dark>mdi-card-bulleted</v-icon>
              <v-icon size="50" dark class="mx-1">mdi-card-account-details</v-icon>
              <v-icon size="40" dark>mdi-card-text</v-icon>
              <v-icon size="30" dark>mdi-card-bulleted-outline</v-icon>
            </div>
          </div>
        </v-tooltip>
        <span class="overline">Complex Meta</span>
      </div>
      <v-list v-if="metaList.length" dense>
        <v-list-item-group color="primary">
          <v-list-item v-for="(meta, i) in metaList" :key="i">
            <v-icon left>mdi-{{meta.settings.icon}}</v-icon> 
            <div class="d-flex justify-space-between align-center" style="width:100%">
              <span>
                <span>{{meta.settings.name}}</span>
                <span class="caption px-4">id: {{meta.id}}</span>
              </span>
              <span>
                <v-btn @click="openSettings(i)" icon><v-icon>mdi-cog</v-icon></v-btn>
                <v-btn @click="deleteMeta(i)" color="red" icon><v-icon>mdi-delete</v-icon></v-btn>
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
            <span class="caption">Simple meta doesn't have a separate page or cards.<br> 
              They are simply displayed as a line on cards<br>
              and can be of different types:<br>
              string, number, array, date, boolean and etc.</span>
            <div class="mt-2">
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
            <div class="d-flex justify-space-between align-center" style="width:100%">
              <span>
                <v-icon left>mdi-{{meta.settings.icon}}</v-icon>
                <span>{{meta.settings.name}}</span>
                <span class="caption px-4">type: {{meta.settings.type}}</span>
                <span class="caption">id: {{meta.id}}</span>
              </span>
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
              <v-autocomplete v-model="metaIcon" :items="icons" :filter="filterIcons"
                item-text="name" item-value="name" label="Icon" class="mt-4"
                :rules="[value => !!value || 'Icon is required']">
                <template v-slot:selection="data">
                  <v-icon left>mdi-{{data.item.name}}</v-icon> {{data.item.name}}
                </template>
                <template v-slot:item="data">
                  <v-icon left>mdi-{{data.item.name}}</v-icon>
                  <span v-html="data.item.name"></span>
                </template>
              </v-autocomplete>
              <v-autocomplete v-model="typeOfSimpleMeta" label="Type of meta"
                :items="['string', 'number', 'boolean', 'array', 'date']" class="mt-4"
                :rules="[value => !!value || 'Type is required']" persistent-hint :hint="hint">
                <template v-slot:selection="data">
                  <v-icon left small>{{getIconMeta(data.item)}}</v-icon> 
                  <span class="overline">{{data.item}}</span>
                </template>
                <template v-slot:item="data">
                  <v-icon left>{{getIconMeta(data.item)}}</v-icon> 
                  <span class="overline">{{data.item}}</span>
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
              <draggable v-model="array" v-bind="dragOptions" @start="drag=true" @end="drag=false">
                <transition-group type="transition" class="d-flex flex-wrap">
                  <v-chip v-for="item in array" :key="item" @click:close="removeItem(item)"
                    close close-icon="mdi-close" class="mr-2 mb-2">{{item}}</v-chip>
                </transition-group>
              </draggable>
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
          <div class="headline">Adding a new complex meta</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="px-4">
            <v-form v-model="validMeta" ref="formMeta" class="flex-grow-1" @submit.prevent>
              <v-text-field v-model="metaName" :rules="[nameRules]" label="Name of meta"/>
              <v-text-field v-model="nameSingular" :rules="[nameRules]" label="Name singular"/>
              <v-autocomplete v-model="metaIcon" :items="icons" :filter="filterIcons"
                item-text="name" item-value="name" label="Icon" class="mt-4"
                :rules="[value => !!value || 'Icon is required']">
                <template v-slot:selection="data">
                  <v-icon left>mdi-{{data.item.name}}</v-icon> {{data.item.name}}
                </template>
                <template v-slot:item="data">
                  <v-icon left>mdi-{{data.item.name}}</v-icon>
                  <span v-html="data.item.name"></span>
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

    <DialogEditMeta v-if="dialogEditMeta" :dialogEditMeta="dialogEditMeta" :metaIndex="metaSettingsIndex" @closeSettings="closeSettings"/>
  </div>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")

import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'
import draggable from 'vuedraggable'

export default {
  name: 'AddNewMeta',
  components: {
    vuescroll,
    draggable,
    DialogEditMeta: () => import("@/components/pages/meta/DialogEditMeta.vue"),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogAddNewSimpleMeta: false,
    dialogAddNewMeta: false,
    dialogEditMeta: false,
    dialogAddMetaToCard: false,
    // simple meta
    validSimpleMeta: false,
    simpleMetaName: '',
    typeOfSimpleMeta: '',
    validItemName: false,
    array: [],
    itemName: '',
    reserved: ['id','name','namesingular','duration','size','resolution','rating','favorite','bookmark',
      'date','edit','views','array','type','number','string','boolean'],
    drag: false,
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
    // meta with cards
    validMeta: false,
    metaName: '',
    nameSingular: '',
    metaIcon: 'shape',
    icons: icons,
    // settings
    metaSettingsIndex: 0,
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    metaList() { return this.$store.getters.meta.value() },
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
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
        name = this.simpleMetaList[index].settings.name
      } else {
        id = this.metaList[index].id 
        name = this.metaList[index].settings.name
      }
      this.$store.dispatch('deleteMeta', {id, name, type})
    },
    // dialogs - simple meta
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
    itemNameRules(name) {
      let arr = this.array.map(i => i.toLowerCase())
      let duplicate = arr.includes(name.trim().toLowerCase())
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

      let settings = { 
        name: this.simpleMetaName,
        type: this.typeOfSimpleMeta,
        icon: this.metaIcon,
      }
      if (this.typeOfSimpleMeta=='array') {
        settings.array = this.array.map(i => { return { id: shortid.generate(), name: i}})
      } 

      this.$store.dispatch('addMeta', {
        id: shortid.generate(),
        type: 'simple', 
        settings
      })

      this.dialogAddNewSimpleMeta = false
      this.simpleMetaName = ''
      this.metaIcon = 'shape'
      this.typeOfSimpleMeta = ''
      this.array = []
      this.itemName = ''
    },
    // dialogs - complex meta (with cards)
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

      let id = shortid.generate()
      this.$store.dispatch('addMeta', {
        id: id, 
        type: 'complex', 
        settings: { name: this.metaName, nameSingular: this.nameSingular, icon: this.metaIcon, metaInCard: [] }
      })

      const metaFolder = path.join(this.pathToUserData, 'media', 'meta', id)
      if (!fs.existsSync(metaFolder)) fs.mkdirSync(metaFolder)

      this.dialogAddNewMeta = false
      this.metaName = ''
      this.nameSingular = ''
      this.metaIcon = 'shape'
    },
    openSettings(index) {
      this.metaSettingsIndex = index
      this.dialogEditMeta = true
    },
    closeSettings() {
      this.dialogEditMeta = false
    },
  },
}
</script>