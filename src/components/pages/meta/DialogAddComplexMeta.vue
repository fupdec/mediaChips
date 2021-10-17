<template>
<div>
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
            <div class="text--secondary caption">Icon of meta</div>
            <div class="d-flex">
              <v-icon>mdi-{{metaIcon}}</v-icon>
              <v-btn @click="dialogIcons=true" color="primary" small rounded class="ml-4">Select icon</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
  <Icons v-if="dialogIcons" @close="dialogIcons=false" @apply="changeIcon($event)"/>
</div>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")

import vuescroll from 'vuescroll'
import NameRules from '@/mixins/NameRules.vue'

export default {
  props: {
    dialog: Boolean,
  },
  name: 'DialogAddComplexMeta',
  components: {
    vuescroll,
    Icons: () => import('@/components/elements/Icons.vue'),
  },
  mixins: [NameRules], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogIcons: false,
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
    changeIcon(icon) {
      this.dialogIcons = false
      this.metaIcon = icon
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
          imageTypes: ['main'],
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