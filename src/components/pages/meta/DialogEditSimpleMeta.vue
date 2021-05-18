<template>
  <div>
    <v-dialog v-if="dialogEditMeta" :value="dialogEditMeta" @input="closeSettings" scrollable max-width="600">
      <v-card>
        <v-card-title class="px-4 py-1">
          <div class="headline">Settings for meta "{{this.meta.settings.name}}"</div>
          <v-spacer></v-spacer>
          <v-icon>mdi-cog</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <div class="d-flex justify-space-between px-4 pt-2">
          <v-chip label small outlined class="mr-4">
            <v-icon left small>mdi-calendar-plus</v-icon> Added: {{dateAdded}}
          </v-chip>
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
              </v-row>
            </v-form>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pa-0">
          <v-spacer></v-spacer>
          <v-btn @click="saveSettings" class="ma-4 pr-4" rounded color="primary">
            <v-icon left>mdi-content-save</v-icon> Save Settings </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import vuescroll from 'vuescroll'
import icons from '@/assets/material-icons.json'
import NameRules from '@/mixins/NameRules'

export default {
  props: {
    dialogEditMeta: false,
    metaIndex: Number,
  },
  name: "DialogEditMeta",
  components: {
    vuescroll,
	},
  created() {
  },
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
      icon: 'shape',
    },
  }),
  computed: {
    simpleMetaList() { return this.$store.getters.simpleMeta.value() },
    meta() { return _.cloneDeep(this.simpleMetaList[this.metaIndex]) },
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
      this.$emit('closeSettings')
    },
    closeSettings() { this.$emit('closeSettings') },
    getRandomColor() { return '#'+Math.floor(Math.random()*16777215).toString(16) },
  },
}
</script>