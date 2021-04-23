<template>
	<div>
    <v-btn @click="dialogChooseNewMetaType=true" color="primary" x-large block rounded>
      <v-icon size="26" left>mdi-plus</v-icon> Add new meta </v-btn>
    
    <v-card outlined class="mt-6 pb-2">
      <div class="text-center overline">Meta with cards</div>
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
        <v-icon size="80" class="my-4">mdi-shape-outline</v-icon>
        It's so empty ... Maybe you need to add a new meta?
      </div>
    </v-card>
    
    <v-card outlined class="mt-6 pb-2">
      <div class="text-center overline">Simple Meta</div>
      <v-list v-if="simpleMetaList.length" dense>
        <v-list-item-group color="primary">
          <v-list-item v-for="(meta, i) in simpleMetaList" :key="i">
            <v-icon left>{{getIconParam(meta.settings.type)}}</v-icon> 
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
        <v-icon size="80" class="my-4">mdi-shape-outline</v-icon>
        It's so empty ... Maybe you need to add a new meta?
      </div>
    </v-card>

    <v-dialog v-model="dialogChooseNewMetaType" scrollable max-width="600">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">Choose meta type</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <div class="d-flex justify-space-around ma-4">
          <div class="d-flex flex-column align-center" style="width:50%">
            <span class="overline">Meta with cards</span>
            <span class="caption">add images, ratings, favorite to meta-cards</span>
            <div class="my-4">
              <v-icon size="40">mdi-card-bulleted</v-icon>
              <v-icon size="50" class="mx-1">mdi-card-account-details</v-icon>
              <v-icon size="40">mdi-card-text</v-icon>
              <v-icon size="30">mdi-card-bulleted-outline</v-icon>
            </div>
            <v-btn @click="dialogChooseNewMetaType=false, dialogAddNewMeta=true"
              class="my-4" rounded color="primary">Add Meta with cards</v-btn>
          </div>
          <v-divider vertical class="mx-4"/>
          <div class="d-flex flex-column align-center" style="width:50%">
            <span class="overline">Simple Meta</span>
            <span class="caption">string, number, list, date, boolean</span>
            <div class="my-4">
              <v-icon size="40">mdi-alphabetical</v-icon>
              <v-icon size="40">mdi-numeric</v-icon>
              <v-icon size="50">mdi-calendar</v-icon>
              <v-icon size="40">mdi-format-list-numbered</v-icon>
              <v-icon size="30">mdi-toggle-switch</v-icon>
            </div>
            <v-btn @click="dialogChooseNewMetaType=false, dialogAddNewSimpleMeta=true"
              class="my-4" rounded color="primary">Add simple meta</v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="dialogAddNewSimpleMeta" scrollable max-width="500">
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
              <v-select :items="['string', 'number', 'list', 'date', 'boolean']"
                v-model="typeOfSimpleMeta" label="Type of meta"
                :rules="[value => !!value || 'Type is required']"/>
            </v-form>

            <div v-if="typeOfSimpleMeta=='list'">
              <div class="overline text-center mt-4">Items for list</div>
              <div v-if="list.length <= 1" class="caption text-center mb-4">
                <v-icon small left color="red">mdi-alert</v-icon>
                <span class="red--text"> In list must be more than 2 items </span>
              </div>
              <div class="d-flex">
                <v-btn @click="addNewItem" :disabled="!validItemName" class="mr-4" color="green" rounded> 
                  <v-icon left>mdi-plus</v-icon> Add item
                </v-btn>
                <v-form v-model="validItemName" ref="itemName" class="flex-grow-1" @submit.prevent>
                  <v-text-field v-model="itemName" :rules="[itemNameRules]" @keyup.enter="tryAddNewItem"
                    dense outlined label="Name of item" />
                </v-form>
              </div>
              <v-chip-group column>
                <v-chip v-for="item in list" :key="item" 
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
    
    <v-dialog v-model="dialogAddNewMeta" scrollable max-width="500">
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
                item-text="name" item-value="name" label="Icon"
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
    dialogChooseNewMetaType: false,
    dialogAddNewSimpleMeta: false,
    dialogAddNewMeta: false,
    // simple meta
    validSimpleMeta: false,
    simpleMetaName: '',
    typeOfSimpleMeta: '',
    validItemName: false,
    list: [],
    itemName: '',
    reserved: ['id','name','duration','size','resolution','rating','favorite','bookmark',
      'date','edit','views','array','type','list','number','string','boolean'],
    // meta with cards
    selectedMeta: undefined,
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
  },
  methods: {
    getIconParam(param) {
      if (param === 'string') return 'mdi-alphabetical'
      if (param === 'date') return 'mdi-calendar'
      if (param === 'number') return 'mdi-numeric'
      if (param === 'list') return 'mdi-code-array'
      if (param === 'boolean') return 'mdi-toggle-switch'
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
      let duplicate = this.list.includes(name)
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
      this.list.push(this.itemName)
      this.itemName = ''
    },
    removeItem(item) { 
      const index = this.list.indexOf(item)
      if (index >= 0) this.list.splice(index, 1)
    },
    addSimpleMeta() {
      this.$refs.formSimpleMeta.validate()
      if (!this.validSimpleMeta) return
      if (this.typeOfSimpleMeta=='list' && this.list.length <= 1) return

      let settings = { type: this.typeOfSimpleMeta }
      if (this.typeOfSimpleMeta=='list') settings.list = this.list

      this.$store.dispatch('addMeta', {
        id: shortid.generate(), 
        name: this.simpleMetaName, 
        type: 'simple', 
        settings
      })

      this.dialogAddNewSimpleMeta = false
      this.simpleMetaName = ''
      this.typeOfSimpleMeta = ''
      this.list = []
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