<template>
  <v-dialog v-if="dialog" :value="dialog" @input="close" scrollable max-width="450">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">New complex meta</div>
        <v-spacer></v-spacer>
        <v-btn @click="addMeta" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
      </v-toolbar>
      <v-divider></v-divider>
      <vuescroll>
        <v-card-text class="px-4">
          <v-form v-model="valid" ref="form" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="metaName" :rules="[nameRules]" label="Name of meta"/>
            <v-text-field v-model="nameSingular" :rules="[nameRules]" label="Name singular"/>
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
          </v-form>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")

import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'
import NameRules from '@/mixins/NameRules'

export default {
  props: {
    dialog: Boolean,
  },
  name: 'DialogAddComplexMeta',
  components: {
    vuescroll,
  },
  mixins: [NameRules], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    metaIcon: 'shape',
    icons: icons,
    // complex meta (with cards)
    valid: false,
    metaName: '',
    metaHint: '',
    nameSingular: '',
    metaIcon: 'shape',
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
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
          hint: this.metaHint,
          icon: this.metaIcon,
          metaInCard: [],
        },
        state: {
          visibility: {
            name: true,
          },
        },
      }
      this.$store.dispatch('addComplexMeta', meta)

      const metaFolder = path.join(this.pathToUserData, 'media', 'meta', id)
      if (!fs.existsSync(metaFolder)) fs.mkdirSync(metaFolder)

      this.close()
    },
    close() { this.$emit('close') },
  },
}
</script>