<template>
  <v-dialog v-if="dialog" :value="dialog" @input="close" scrollable max-width="450">
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
            <v-text-field v-model="metaHint" label="Hint for meta" hint="This text under the field is the hint"/>
            <v-autocomplete v-model="metaIcon" :items="icons" :filter="filterIcons"
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
            <v-autocomplete v-model="dataType" label="Data type of meta"
              :items="['string', 'number', 'boolean', 'array', 'date']"
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
</template>


<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'
import draggable from 'vuedraggable'
import NameRules from '@/mixins/NameRules'

export default {
  props: {
    dialog: Boolean,
  },
  name: 'DialogAddSimpleMeta',
  components: {
    vuescroll,
    draggable,
  },
  mixins: [NameRules], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
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

      this.close()
    },
    close() { this.$emit('close') },
  },
}
</script>