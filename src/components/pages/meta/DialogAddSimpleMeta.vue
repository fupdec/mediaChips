<template>
  <div>
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
              <div class="text--secondary caption">Icon of meta</div>
              <div class="d-flex">
                <v-icon>mdi-{{metaIcon}}</v-icon>
                <v-btn @click="selectIcon('metaIcon')" color="primary" small rounded class="ml-4">Select icon</v-btn>
              </div>
              <v-autocomplete v-model="dataType" label="Data type of meta"
                :items="['string', 'number', 'boolean', 'array', 'date', 'rating']"
                :rules="[value => !!value || 'Type is required']" persistent-hint :hint="hint">
                <template v-slot:selection="data">
                  <v-icon left>{{getIconMeta(data.item)}}</v-icon> 
                  <span class="mr-2">{{data.item}}</span>
                </template>
                <template v-slot:item="data">
                  <v-icon left>{{getIconMeta(data.item)}}</v-icon> 
                  <span>{{data.item}}</span>
                </template>
              </v-autocomplete>
              <v-switch v-if="dataType=='string'" v-model="isLink" :label="`Open link in browser - ${isLink?'Yes':'No'}`" hide-details/>
              <v-card v-if="dataType=='rating'" outlined class="px-4 pb-4 mt-4">
                <div class="overline text-center my-2">Settings for Rating</div>
                <div class="text--secondary caption">Icon for rating</div>
                <div class="d-flex">
                  <v-icon>mdi-{{ratingIcon}}</v-icon>
                  <v-btn @click="selectIcon('ratingIcon')" color="primary" small rounded class="ml-4">Select icon</v-btn>
                </div>
                <div class="text--secondary caption">Icon for empty rating</div>
                <div class="d-flex">
                  <v-icon>mdi-{{ratingIconEmpty}}</v-icon>
                  <v-btn @click="selectIcon('ratingIconEmpty')" color="primary" small rounded class="ml-4">Select icon</v-btn>
                </div>
                <v-text-field v-model="ratingMax" type="number" 
                  :rules="[v=>v>1&&v<11 || 'Incorrect value']" label="Max value for rating" 
                  :hint="`The rating will be from 0 to ${ratingMax}`"/>
                <v-btn @click="openDialogPalette" :color="ratingColor" rounded block class="my-2">
                  <v-icon left>mdi-palette</v-icon> change rating color </v-btn>
                <v-switch v-model="ratingHalf" :label="`Half increment - ${ratingHalf?'Yes':'No'}`"/>
                <div v-if="ratingHalf" class="text--secondary caption">Icon for half rating</div>
                <div v-if="ratingHalf" class="d-flex">
                  <v-icon>mdi-{{ratingIconHalf}}</v-icon>
                  <v-btn @click="selectIcon('ratingIconHalf')" color="primary" small rounded class="ml-4">Select icon</v-btn>
                </div>
                <div class="mt-4">Rating preview</div>
                <v-rating :value="1" :length="ratingMax>10?10:ratingMax<2?2:ratingMax" hover
                  :full-icon="`mdi-${ratingIcon}`" :empty-icon="`mdi-${ratingIconEmpty||ratingIcon}`" 
                  :color="ratingColor" background-color="grey" class="meta-rating" clearable
                  :half-increments="ratingHalf" :half-icon="`mdi-${ratingIconHalf||ratingIcon}`"/>
              </v-card>
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
              <draggable v-model="items" v-bind="dragOptions" @start="drag=true" @end="drag=false" class="d-flex flex-wrap">
                <v-chip v-for="(item,i) in items" :key="i" @click:close="removeItem(i)"
                  close close-icon="mdi-close" class="mr-2 mb-2">{{item.name}}</v-chip>
              </draggable>
            </v-card>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogPalette" width="300"> 
      <v-card>
        <v-toolbar color="primary">
          <v-btn @click="applyColor" outlined block><v-icon left>mdi-check</v-icon> apply color</v-btn>
        </v-toolbar>
        <v-color-picker @update:color="changeColor($event)" :value="palette" /> 
      </v-card>
    </v-dialog>

    <Icons v-if="dialogIcons" @close="dialogIcons=false" @apply="changeIcon($event)"/>
  </div>
</template>


<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
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
    Icons: () => import('@/components/elements/Icons.vue'),
  },
  mixins: [NameRules], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogIcons: false,
    iconType: '',
    metaIcon: 'shape',
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
    isLink: false,
    validItemName: false,
    items: [],
    itemName: '',
    // rating
    ratingIcon: 'star',
    ratingIconEmpty: 'star-outline',
    ratingIconHalf: 'star-half-full',
    ratingHalf: false,
    ratingMax: 5,
    ratingColor: '#ffab00',
    dialogPalette: false,
    palette: '#ffab00',
  }),
  computed: {
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
    hint() {
      if (this.dataType === 'string') return 'for description, notes'
      if (this.dataType === 'date') return 'e.g. release date, last viewed date'
      if (this.dataType === 'number') return 'to count'
      if (this.dataType === 'array') return `for multiple values. for example colors: blue, red, green`
      if (this.dataType === 'boolean') return 'for one value. either yes or no'
      if (this.dataType === 'rating') return 'for scoring'
      return 'choose one of the types'
    },
  },
  methods: {
    selectIcon(type) {
      this.iconType = type
      this.dialogIcons = true
    },
    changeIcon(icon) {
      this.dialogIcons = false
      this[this.iconType] = icon
    },
    getIconMeta(meta) {
      if (meta === 'string') return 'mdi-alphabetical'
      if (meta === 'date') return 'mdi-calendar'
      if (meta === 'number') return 'mdi-numeric'
      if (meta === 'array') return 'mdi-code-array'
      if (meta === 'boolean') return 'mdi-toggle-switch'
      if (meta === 'rating') return 'mdi-star'
      return 'mdi-shape'
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
      if (this.dataType=='string') settings.isLink = this.isLink
      else if (this.dataType=='array') settings.items = this.items
      else if (this.dataType=='rating') {
        settings.ratingIcon = this.ratingIcon
        settings.ratingMax = this.ratingMax
        settings.ratingColor = this.ratingColor
      } 

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
    openDialogPalette() {
      this.dialogPalette = true 
      this.palette = this.ratingColor
    },
    changeColor(e) { this.palette = e.hex },
    applyColor() {
      this.ratingColor = this.palette
      this.dialogPalette = false
    },
  },
}
</script>