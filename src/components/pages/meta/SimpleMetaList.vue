<template>
	<div>
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
                <span class="caption px-4">type: {{meta.type}}</span>
                <span class="caption">id: {{meta.id}}</span>
              </span>
              <span>
                <v-btn @click="openDeleteDialog(i)" color="red" icon><v-icon>mdi-delete</v-icon></v-btn>
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
            <v-form v-model="validMeta" ref="form" class="flex-grow-1" @submit.prevent>
              <v-text-field v-model="metaName" :rules="[nameRules]" label="Name of meta"/>
              <v-autocomplete v-model="metaIcon" :items="icons" :filter="filterIcons"
                item-text="name" item-value="name" label="Icon" class="mt-4"
                :rules="[value => !!value || 'Icon is required']">
                <template v-slot:selection="data">
                  <v-icon>mdi-{{data.item.name}}</v-icon> <span class="mx-2">{{data.item.name}}</span>
                </template>
                <template v-slot:item="data">
                  <v-icon left>mdi-{{data.item.name}}</v-icon>
                  <span v-html="data.item.name"></span>
                </template>
              </v-autocomplete>
              <v-autocomplete v-model="metaType" label="Type of meta"
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
            <div v-if="metaType=='array'">
              <div class="overline text-center mt-4">Items for array</div>
              <div v-if="items.length <= 1" class="caption text-center mb-4">
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
              <draggable v-model="items" v-bind="dragOptions" @start="drag=true" @end="drag=false">
                <transition-group type="transition" class="d-flex flex-wrap">
                  <v-chip v-for="item in items" :key="item" @click:close="removeItem(item)"
                    close close-icon="mdi-close" class="mr-2 mb-2">{{item}}</v-chip>
                </transition-group>
              </draggable>
            </div>
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

    <v-dialog v-if="dialogDeleteMeta" :value="dialogDeleteMeta" persistent max-width="450">
      <v-card>
        <v-card-title class="py-1 px-4 headline red--text"> 
          <span>Are you sure?</span>
          <v-spacer></v-spacer> 
          <v-icon color="red">mdi-delete-alert</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-2">
          <div class="text-center">Delete simple meta 
            <v-chip small class="mx-2">
              <v-icon small left>mdi-{{simpleMetaList[selectedMetaIndex].settings.icon}}</v-icon>
              <b>{{simpleMetaList[selectedMetaIndex].settings.name}}</b>
            </v-chip>?
          </div>
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-btn @click="dialogDeleteMeta=false" small class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="deleteMeta" small class="ma-4" color="red" dark> 
            <v-icon left>mdi-delete-alert</v-icon> Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'
import draggable from 'vuedraggable'
import NameRules from '@/mixins/NameRules'

export default {
  name: 'SimpleMetaList',
  components: {
    vuescroll,
    draggable,
    DialogEditMeta: () => import("@/components/pages/meta/DialogEditMeta.vue"),
  },
  mixins: [NameRules], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogAddNewSimpleMeta: false,
    dialogAddNewMeta: false,
    dialogEditMeta: false,
    dialogAddMetaToCard: false,
    dialogDeleteMeta: false,
    deleteMetaType: null,
    selectedMetaIndex: 0,
    metaIcon: 'shape',
    icons: icons,
    drag: false,
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
    // simple meta
    validMeta: false,
    metaName: '',
    metaType: '',
    validItemName: false,
    items: [],
    itemName: '',
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
    hint() {
      if (this.metaType === 'string') return 'for description, notes'
      if (this.metaType === 'date') return 'e.g. release date, last viewed date'
      if (this.metaType === 'number') return 'to count'
      if (this.metaType === 'array') return `for multiple values. for example colors: blue, red, green`
      if (this.metaType === 'boolean') return 'for one value. either yes or no'
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
    itemNameRules(string) {
      let items = this.items.map(i => i.toLowerCase())
      let duplicate = items.includes(string.trim().toLowerCase())
      if (string.length > 30) return 'Name must be less than 30 characters'
      else if (string.length===0) return 'Name is required'
      else if (duplicate) return 'Item with that name already exists'
      else return true
    },
    tryAddNewItem() {
      if (this.validMeta) this.addNewItem()
    },
    addNewItem() {
      this.$refs.itemName.validate()
      if (!this.validItemName) return
      this.items.push(this.itemName)
      this.itemName = ''
    },
    removeItem(item) { 
      const index = this.items.indexOf(item)
      if (index >= 0) this.items.splice(index, 1)
    },
    addMeta() {
      this.$refs.form.validate()
      if (!this.validMeta) return
      if (this.metaType=='array' && this.items.length <= 1) return

      let settings = { name: this.metaName, icon: this.metaIcon }
      if (this.metaType=='array') settings.items = this.items.map(i=>({id:shortid.generate(),name:i})) 

      this.$store.dispatch('addSimpleMeta', { id:shortid.generate(), type:this.metaType, settings })

      this.dialogAddNewSimpleMeta = false
      this.metaName = ''
      this.metaIcon = 'shape'
      this.metaType = ''
      this.items = []
      this.itemName = ''
    },
    openDeleteDialog(index) {
      this.selectedMetaIndex = index
      this.dialogDeleteMeta = true
    },
    deleteMeta() {
      let index = this.selectedMetaIndex
      let id = this.simpleMetaList[index].id
      let name = this.simpleMetaList[index].settings.name
      this.$store.dispatch('deleteSimpleMeta', {id, name})
      this.dialogDeleteMeta = false
    },
  },
}
</script>