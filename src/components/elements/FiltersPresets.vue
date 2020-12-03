<template>
	<div>
    <v-dialog :value="$store.state.Bookmarks.dialogFiltersPresets" width="800" persistent scrollable eager>
      <v-card>
        <v-card-title class="py-1 headline">
          Presets for filters of {{typeOfPresets}}
          <v-spacer></v-spacer>
          <v-icon>mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="py-0">
          <v-container class="py-0">
            <v-row>
              <v-col cols="12" class="pb-0 pt-7">
                <v-form ref="form" v-model="valid">
                  <v-text-field v-model="presetName" :rules="[getNameRules]" validate-on-blur 
                    dense outlined label="Name of preset"/>
                </v-form>
              </v-col>
            </v-row>
          </v-container>
          <v-spacer></v-spacer>
          <v-btn @click="addNewPreset" class="mt-1 mr-4" color="primary" depressed :disabled="!valid"> 
            <v-icon left>mdi-plus</v-icon> Add preset
          </v-btn>
        </v-card-actions>
        <vuescroll>
          <v-card-text class="pt-0" v-if="presets.length">
            <div class="text-center overline">Presets</div>
            <v-list dense>
              <v-list-item-group color="secondary" v-model="selectedPreset">
                <v-list-item v-for="(item, i) in presets" :key="i">
                  <v-icon v-if="item.default" color="green" left>mdi-check-circle</v-icon>
                  <v-icon v-else color="grey" left>mdi-check-circle-outline</v-icon>
                  {{item.name}}
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-card-text class="text-center" v-else>
            <v-icon size="32">mdi-close</v-icon>
            <div class="overline">No presets</div>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn @click="$store.state.Bookmarks.dialogFiltersPresets=false" small class="ma-2">
            <v-icon left>mdi-close</v-icon> Close
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteFilters=true" small class="ma-2" color="red" dark :disabled="isPresetsDisbaled"> 
            <v-icon>mdi-delete</v-icon> 
          </v-btn>
          <v-btn @click="openDialogEditPresetName" small class="ma-2" :disabled="isPresetsDisbaled"> 
            <v-icon>mdi-pencil</v-icon> 
          </v-btn>
          <v-btn @click="removePresetsByDefault" small class="ma-2" color="primary" :disabled="isPresetDefault"> 
            <v-icon left>mdi-cancel</v-icon> Remove by default
          </v-btn>
          <v-btn @click="setPresetAsDefault" small class="ma-2" color="primary" :disabled="isPresetsDisbaled"> 
            <v-icon left>mdi-check-circle</v-icon> Set as default
          </v-btn>
          <v-btn @click="loadFilters" class="ma-2" small color="primary" :disabled="isPresetsDisbaled"> 
            <v-icon left>mdi-content-save-move</v-icon> Load
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :value="dialogEditPresetName" width="600" persistent>
      <v-card>
        <v-card-title class="py-1 headline"> Edit name of preset
          <v-spacer></v-spacer>
          <v-icon>mdi-pencil</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <v-form ref="formNameNew" v-model="validNameNew">
            <v-text-field v-model="presetNameNew" :rules="[getNameRules]" validate-on-blur 
              dense outlined label="New name of preset"/>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogEditPresetName=false" class="ma-2">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="savePresetName" class="ma-2" color="primary" :disabled="!validNameNew"> 
            <v-icon left>mdi-content-save</v-icon> Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :value="dialogDeleteFilters" width="400" persistent>
      <v-card>
        <v-card-title class="py-1 headline red--text"> Delete preset?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete-alert</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn @click="dialogDeleteFilters=false" class="ma-2">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="deleteFiltersPreset" class="ma-2" color="red" dark> 
            <v-icon left>mdi-delete-alert</v-icon> Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const shortid = require("shortid")

import vuescroll from 'vuescroll'

export default {
  name: 'FiltersPresets',
  props: {
    typeOfPresets: String,
  },
  components: {
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    valid: false,
    presetName: '',
    selectedPreset: undefined,
    dialogDeleteFilters: false,
    dialogEditPresetName: false,
    validNameNew: false,
    presetNameNew: '',
  }),
  computed: {
    presets() {
      return this.$store.state.Bookmarks.filtersPresets[this.typeOfPresets]
    },
    isPresetsDisbaled() {
      return this.selectedPreset === undefined || this.presets.length === 0
    },
    isPresetDefault() {
      return !this.$store.state.Settings[`${this.typeOfPresets}FiltersPresetDefault`]
    },
    capitalizedTypeOfPreset() {
      return this.typeOfPresets.charAt(0).toUpperCase() + this.typeOfPresets.slice(1)
    },
  },
  methods: {
    getNameRules(name) {
      let duplicate = this.$store.getters.filtersPresets.get([this.typeOfPresets]).find({name:name}).value()
      if (name.length > 500) {
        return 'Name must be less than 500 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined && duplicate.name===name) {
        return 'Preset with that name already exists'
      } else {
        return true
      }
    },
    addNewPreset() {
      if (!this.valid) return
      const preset = {
        id: shortid.generate(),
        name: this.presetName,
        filters: _.cloneDeep(this.$store.state[this.capitalizedTypeOfPreset].filters),
        default: false,
      }
      const values = {
        type: this.typeOfPresets,
        preset: preset
      }
      this.$store.dispatch('addFiltersPreset', values)
    },
    deleteFiltersPreset() {
      const values = {
        type: this.typeOfPresets,
        presetName: this.presets[this.selectedPreset].name 
      }
      this.$store.dispatch('deleteFiltersPreset', values)
      this.dialogDeleteFilters = false
      if (this.presets.length===0) {
        this.removePresetsByDefault()
      }
    },
    openDialogEditPresetName() {
      this.dialogEditPresetName = true
      this.presetNameNew = this.presets[this.selectedPreset].name
    },
    savePresetName() {
      if (!this.validNameNew) return
      const valuesForUpdate = {
        type: this.typeOfPresets,
        oldName: this.presets[this.selectedPreset].name,
        newName: this.presetNameNew,
      }
      this.$store.dispatch('updateFiltersPresetName', valuesForUpdate)
      this.dialogEditPresetName = false
    },
    removePresetsByDefault() {
      const valuesForUpdate = {
        type: this.typeOfPresets,
        value: false
      }
      this.$store.commit('updateFiltersPresetDefault', valuesForUpdate)
      this.$store.dispatch('removePresetsByDefault', this.typeOfPresets)
    },
    setPresetAsDefault() {
      const valuesForUpdate = {
        type: this.typeOfPresets,
        value: true
      }
      this.$store.commit('updateFiltersPresetDefault', valuesForUpdate)
      const presetName = this.presets[this.selectedPreset].name 
      const valuesForDefaultPreset = {
        type: this.typeOfPresets,
        presetName: presetName
      }
      this.$store.dispatch('setPresetAsDefault', valuesForDefaultPreset)
    },
    loadFilters() {
      let preset = this.presets[this.selectedPreset]
      let type = this.capitalizedTypeOfPreset
      this.$store.state[type].filters = _.cloneDeep(preset.filters)
      this.$store.state.Bookmarks.dialogFiltersPresets = false
      this.$store.dispatch(`filter${this.capitalizedTypeOfPreset}`)
    },
  },
}
</script>