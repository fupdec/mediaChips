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
      <v-list v-if="complexMetaList.length" dense class="list-zebra">
        <v-list-item-group color="primary">
          <v-list-item v-for="(meta, i) in complexMetaList" :key="i">
            <v-icon left>mdi-{{meta.settings.icon}}</v-icon> 
            <div class="d-flex justify-space-between align-center" style="width:100%">
              <span>
                <span>{{meta.settings.name}}</span>
                <span class="caption px-4">id: {{meta.id}}</span>
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
            <v-form v-model="valid" ref="form" class="flex-grow-1" @submit.prevent>
              <v-text-field v-model="metaName" :rules="[nameRules]" label="Name of meta"/>
              <v-text-field v-model="nameSingular" :rules="[nameRules]" label="Name singular"/>
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

    <v-dialog v-if="dialogDeleteMeta" :value="dialogDeleteMeta" persistent max-width="450">
      <v-card>
        <v-card-title class="py-1 px-4 headline red--text"> 
          <span>Are you sure?</span>
          <v-spacer></v-spacer> 
          <v-icon color="red">mdi-delete-alert</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-2">
          <div class="text-center">Delete complex meta 
            <v-chip small class="mx-2">
              <v-icon small left>mdi-{{complexMetaList[selectedMetaIndex].settings.icon}}</v-icon>
              <b>{{complexMetaList[selectedMetaIndex].settings.name}}</b>
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

    <DialogEditComplexMeta v-if="dialogEditMeta" :dialogEditMeta="dialogEditMeta" :metaIndex="selectedMetaIndex" @closeSettings="closeSettings"/>
  </div>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")

import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'
import draggable from 'vuedraggable'
import NameRules from '@/mixins/NameRules'

export default {
  name: 'ComplexMetaList',
  components: {
    vuescroll,
    draggable,
    DialogEditComplexMeta: () => import("@/components/pages/meta/DialogEditComplexMeta.vue"),
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
    deleteMetaType: null,
    selectedMetaIndex: 0,
    metaIcon: 'shape',
    icons: icons,
    // complex meta (with cards)
    valid: false,
    metaName: '',
    nameSingular: '',
    metaIcon: 'shape',
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    complexMetaList() { return this.$store.getters.complexMeta.value() },
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
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
    addMeta() {
      this.$refs.form.validate()
      if (!this.valid) return

      let id = shortid.generate()
      let meta = {
        id: id,
        type: 'complex',
        settings: { 
          name: this.metaName,
          nameSingular: this.nameSingular,
          icon: this.metaIcon,
          metaInCard: [],
        },
      }
      this.$store.dispatch('addComplexMeta', meta)

      const metaFolder = path.join(this.pathToUserData, 'media', 'meta', id)
      if (!fs.existsSync(metaFolder)) fs.mkdirSync(metaFolder)

      this.dialogAddNewMeta = false
      this.metaName = ''
      this.nameSingular = ''
      this.metaIcon = 'shape'
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
      let id = this.complexMetaList[index].id 
      let name = this.complexMetaList[index].settings.name
      this.$store.dispatch('deleteComplexMeta', {id, name})
      this.dialogDeleteMeta = false
    },
    closeSettings() { this.dialogEditMeta = false },
  },
}
</script>