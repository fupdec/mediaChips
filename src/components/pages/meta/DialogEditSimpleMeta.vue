<template>
  <div>
    <v-dialog v-if="dialogEditMeta" :value="dialogEditMeta" @input="closeSettings" scrollable max-width="700">
      <v-card>
        <v-toolbar color="primary">
          <v-card-title class="headline pl-0">Settings for meta <b class="ml-2">{{meta.settings.name}}</b></v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="saveSettings" outlined> <v-icon left>mdi-content-save</v-icon> Save </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
        <div class="d-flex justify-space-between px-4 pt-2">
          <v-chip label small outlined class="mr-4">
            <v-icon left small>mdi-calendar-plus</v-icon> Added: {{dateAdded}}
          </v-chip>
          <span class="caption">data type: <b>{{meta.dataType}}</b></span>
          <v-chip label small outlined>
            <v-icon left small>mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
          </v-chip>
        </div>
        <vuescroll>
          <v-card-text class="px-4">
            <v-form v-model="valid" ref="form" class="flex-grow-1" @submit.prevent>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="settings.name" :rules="[nameRules]" label="Name of meta"/>
                  <v-text-field v-model="settings.hint" label="Hint of meta" hint="This text under the field is the hint"/>
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
                <v-col v-if="meta.dataType=='array'" cols="12">
                  <v-card outlined class="px-4 pb-4">
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
                    <div v-if="meta.settings.items.length==0" class="text-center">Please add items to array</div>
                    <draggable v-model="meta.settings.items" v-bind="dragOptions" @start="drag=true" @end="drag=false">
                      <transition-group type="transition" class="d-flex flex-wrap">
                        <v-chip v-for="(item,i) in meta.settings.items" :key="i" @click:close="removeItem(i)"
                          close close-icon="mdi-close" class="mr-2 mb-2">{{item.name}}</v-chip>
                      </transition-group>
                    </draggable>
                  </v-card>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteItem" :value="dialogDeleteItem" persistent max-width="450">
      <v-card>
        <v-toolbar color="error">
          <v-card-title class="headline pl-0">Are you sure?</v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteItem=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="addItemToDeleted" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="py-8">
          <div class="text-center">Delete item
            <v-chip small class="mx-1">
              {{meta.settings.items[deleteItemIndex].name}}
            </v-chip> from array?
            <div>This item will be removed from all meta.</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import draggable from 'vuedraggable'
import icons from '@/assets/material-icons.json'
import NameRules from '@/mixins/NameRules'

export default {
  props: {
    dialogEditMeta: false,
    metaObj: Object,
  },
  name: "DialogEditMeta",
  components: { vuescroll, draggable, },
  mixins: [NameRules], 
  mounted () {
    this.$nextTick(function () {
      this.settings = { ...this.settings, ...this.meta.settings }
    })
  },
  data: () => ({
    icons: icons,
    valid: false,
    settings: {
      name: '',
      hint: '',
      icon: 'shape',
    },
    // for data type array
    itemName: '',
    validItemName: false,
    dialogDeleteItem: false,
    deleteItemIndex: 0,
    deletedItems: [],
    drag: false,
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
  }),
  computed: {
    meta() { return this.metaObj },
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
    saveSettings() {
      this.$refs.form.validate()
      if (!this.valid) return
      this.$store.getters.simpleMeta.find({id: this.meta.id}).set('edit', Date.now()).set('settings', this.settings).write()
      this.parseDeletedItems()
      this.$emit('closeSettings')
    },
    closeSettings() { this.$emit('closeSettings') },
    getRandomColor() { return '#'+Math.floor(Math.random()*16777215).toString(16) },
    tryAddNewItem() { if (this.valid) this.addNewItem() },
    addNewItem() {
      this.$refs.itemName.validate()
      if (!this.validItemName) return
      this.meta.settings.items.push({ id:shortid.generate(), name: this.itemName })
      this.itemName = ''
    },
    removeItem(index) { 
      this.dialogDeleteItem = true
      this.deleteItemIndex = index
    },
    addItemToDeleted() {
      this.deletedItems.push(this.meta.settings.items[this.deleteItemIndex].id)
      this.meta.settings.items.splice(this.deleteItemIndex, 1)
      this.dialogDeleteItem = false
    },
    parseDeletedItems() {
      let ids = this.deletedItems
      let metaId =  this.meta.id
      for (let id = 0; id < ids.length; id++) { // delete from meta cards
        let itemId = ids[id]
        this.$store.getters.metaCards.filter(i=>{
          let metaInCard = i.meta[metaId]
          if (metaInCard) return i.meta[metaId].includes(itemId)
          else return false
        }).each(i=>{
          const index = i.meta[metaId].indexOf(itemId)
          if (index > -1) i.meta[metaId].splice(index, 1) 
        }).write()
      }
    },
    itemNameRules(string) {
      let items = this.meta.settings.items.map(i => i.name.toLowerCase())
      let duplicate = items.includes(string.trim().toLowerCase())
      if (string.length > 30) return 'Name must be less than 30 characters'
      else if (string.length===0) return 'Name is required'
      else if (duplicate) return 'Item with that name already exists'
      else return true
    },
  },
}
</script>