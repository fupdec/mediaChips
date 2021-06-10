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
      <v-list v-if="simpleMetaList.length" dense class="list-zebra">
        <v-list-item-group color="primary">
          <v-list-item v-for="(meta, i) in simpleMetaList" :key="i">
            <div class="d-flex justify-space-between align-center" style="width:100%">
              <span>
                <v-icon left>mdi-{{meta.settings.icon}}</v-icon>
                <span>{{meta.settings.name}}</span>
                <span class="caption text--secondary px-4">type: {{meta.dataType}}</span>
                <span class="caption text--secondary">id: {{meta.id}}</span>
              </span>
              <span>
                <v-btn @click="openSettings(i)" icon><v-icon>mdi-cog</v-icon></v-btn>
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
        <v-btn @click="dialogAddNewMeta=true" rounded class="pr-4" color="primary">
          <v-icon left>mdi-plus</v-icon> <span>add new meta</span>  
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
    
    <v-dialog v-model="dialogAddNewMeta" scrollable max-width="450">
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">New simple meta</div>
          <v-spacer></v-spacer>
          <v-btn @click="addMeta" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
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
              <v-text-field v-model="metaHint" label="Hint for meta" hint="This text under the field is the hint"/>
              <v-autocomplete v-model="dataType" label="Data type of meta"
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
            <v-card v-if="dataType=='array'" outlined class="px-4 pb-4 mt-4">
              <div class="overline text-center">Array Items</div>
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
              <div v-if="items.length==0" class="text-center">Please add items to array</div>
              <draggable v-model="items" v-bind="dragOptions" @start="drag=true" @end="drag=false">
                <transition-group type="transition" class="d-flex flex-wrap">
                  <v-chip v-for="(item,i) in items" :key="i" @click:close="removeItem(i)"
                    close close-icon="mdi-close" class="mr-2 mb-2">{{item.name}}</v-chip>
                </transition-group>
              </draggable>
            </v-card>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteMeta" :value="dialogDeleteMeta" persistent max-width="450">
      <v-card>
        <v-toolbar color="error">
          <v-card-title class="headline pl-0">Are you sure?</v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteMeta=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteMeta" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="py-8">
          <div class="text-center">Delete <b>simple</b> meta?
            <v-chip small class="mx-2">
              <v-icon small left>mdi-{{simpleMetaList[selectedMetaIndex].settings.icon}}</v-icon>
              <b>{{simpleMetaList[selectedMetaIndex].settings.name}}</b>
            </v-chip>
            <div>This meta will be removed <br> from all assigned complex meta and cards.</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <DialogEditSimpleMeta v-if="dialogEditMeta" :dialogEditMeta="dialogEditMeta" :metaIndex="selectedMetaIndex" @closeSettings="closeSettings"/>
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
    DialogEditSimpleMeta: () => import("@/components/pages/meta/DialogEditSimpleMeta.vue"),
  },
  mixins: [NameRules], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogAddNewMeta: false,
    dialogEditMeta: false,
    dialogAddMetaToCard: false,
    dialogDeleteMeta: false,
    deleteDataType: null,
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
    metaHint: '',
    dataType: '',
    validItemName: false,
    items: [],
    itemName: '',
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
    hint() {
      if (this.dataType === 'string') return 'for description, notes'
      if (this.dataType === 'date') return 'e.g. release date, last viewed date'
      if (this.dataType === 'number') return 'to count'
      if (this.dataType === 'array') return `for multiple values. for example colors: blue, red, green`
      if (this.dataType === 'boolean') return 'for one value. either yes or no'
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
      let items = this.items.map(i => i.name.toLowerCase())
      let duplicate = items.includes(string.trim().toLowerCase())
      if (string.length > 30) return 'Name must be less than 30 characters'
      else if (string.length===0) return 'Name is required'
      else if (duplicate) return 'Item with that name already exists'
      else return true
    },
    tryAddNewItem() { if (this.validMeta) this.addNewItem() },
    addNewItem() {
      this.$refs.itemName.validate()
      if (!this.validItemName) return
      this.items.push({ id:shortid.generate(), name: this.itemName })
      this.itemName = ''
    },
    removeItem(index) { this.items.splice(index, 1) },
    addMeta() {
      this.$refs.form.validate()
      if (!this.validMeta) return

      let settings = { 
        name: this.metaName, 
        icon: this.metaIcon,
        hint: this.metaHint,
      }
      if (this.dataType=='array') settings.items = this.items

      let meta = {
        id: shortid.generate(),
        type: 'simple',
        dataType: this.dataType,
        settings: settings,
      }
      this.$store.dispatch('addSimpleMeta', meta)

      this.dialogAddNewMeta = false
      this.metaName = ''
      this.metaHint = ''
      this.metaIcon = 'shape'
      this.dataType = ''
      this.items = []
      this.itemName = ''
      // TODO update simple meta list
    },
    openSettings(index) {
      this.selectedMetaIndex = index
      this.dialogEditMeta = true
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
    closeSettings() { this.dialogEditMeta = false },
  },
}
</script>