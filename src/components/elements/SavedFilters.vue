<template>
	<div>
    <v-dialog :value="$store.state.SavedFilters.dialogSavedFilters" width="800" persistent scrollable eager>
      <v-card>
        <v-card-title class="py-1 px-4 headline">
          Saved filters for {{type}}
          <v-spacer></v-spacer>
          <v-icon>mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pa-0">
          <v-container class="py-0 pl-4">
            <v-row>
              <v-col cols="12" class="pb-0 pt-7">
                <v-form ref="form" v-model="valid">
                  <v-text-field v-model="savedFiltersName" :rules="[getNameRules]"
                    dense outlined label="Name for saved filters"/>
                </v-form>
              </v-col>
            </v-row>
          </v-container>
          <v-spacer></v-spacer>
          <v-btn @click="addNewSavedFilters" class="mt-1 mr-4" color="primary" depressed :disabled="!valid"> 
            <v-icon left>mdi-plus</v-icon> Add saved filters
          </v-btn>
        </v-card-actions>
        <vuescroll>
          <v-card-text class="py-0" v-if="savedFilters.length">
            <v-list dense>
              <v-list-item-group color="secondary" v-model="selected">
                <v-list-item v-for="(item, i) in savedFilters" :key="i">{{item.name}}</v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-card-text class="text-center" v-else>
            <v-icon size="32">mdi-close</v-icon>
            <div class="overline">No filters saved</div>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pa-0">
          <v-btn @click="$store.state.SavedFilters.dialogSavedFilters=false" small class="ma-4">
            <v-icon left>mdi-close</v-icon> Close
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteFilters=true" small class="ma-4" color="red" :disabled="isDisbaled"> 
            <v-icon left>mdi-delete</v-icon> Delete 
          </v-btn>
          <v-btn @click="openDialogEditSavedFiltersName" small class="ma-4" :disabled="isDisbaled"> 
            <v-icon left>mdi-pencil</v-icon> Rename
          </v-btn>
          <v-btn @click="loadFilters" class="ma-4" small color="primary" :disabled="isDisbaled"> 
            <v-icon left>mdi-content-save-move</v-icon> Load filters
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :value="dialogEditSavedFiltersName" width="500" persistent>
      <v-card>
        <v-card-title class="py-1 px-4 headline"> Edit name of saved filters
          <v-spacer></v-spacer>
          <v-icon>mdi-pencil</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pb-0 pt-4 px-4">
          <v-form ref="formNameNew" v-model="validNameNew">
            <v-text-field v-model="nameNew" :rules="[getNameRules]"
              dense outlined label="New name of saved filters"/>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-btn @click="dialogEditSavedFiltersName=false" small class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="saveFiltersName" small class="ma-4" color="primary" :disabled="!validNameNew"> 
            <v-icon left>mdi-content-save</v-icon> Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteFilters" :value="dialogDeleteFilters" width="400" persistent>
      <v-card>
        <v-card-title class="py-1 px-4 headline red--text"> 
          <span>Are you sure?</span>
          <v-spacer></v-spacer> 
          <v-icon color="red">mdi-delete-alert</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-2">
          <div class="text-center">Delete saved filters with name "<b>{{savedFilters[selected].name}}</b>"?</div>
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-btn @click="dialogDeleteFilters=false" small class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="deleteSavedFilter" small class="ma-4" color="red" dark> 
            <v-icon left>mdi-delete-alert</v-icon> Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'SavedFilters',
  props: {
    type: String,
    filters: Array,
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
    savedFiltersName: '',
    selected: undefined,
    dialogDeleteFilters: false,
    dialogEditSavedFiltersName: false,
    validNameNew: false,
    nameNew: '',
  }),
  computed: {
    savedFilters() {
      return this.$store.state.SavedFilters.savedFilters[this.type]
    },
    isDisbaled() {
      return this.selected === undefined || this.savedFilters.length === 0
    },
  },
  methods: {
    getNameRules(name) {
      let duplicate = this.$store.getters.savedFilters.get([this.type]).find({name:name}).value()
      if (name.length > 500) {
        return 'Name must be less than 500 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined && duplicate.name===name) {
        return 'Saved filters with that name already exists'
      } else {
        return true
      }
    },
    addNewSavedFilters() {
      if (!this.valid) return
      const savedFilters = {
        id: Date.now(),
        name: this.savedFiltersName,
        filters: _.cloneDeep(this.filters),
      }
      const values = {
        type: this.type,
        savedFilters: savedFilters
      }
      this.$store.dispatch('addSavedFilter', values)
      this.savedFiltersName = ''
    },
    deleteSavedFilter() {
      const values = {
        type: this.type,
        name: this.savedFilters[this.selected].name 
      }
      this.$store.dispatch('deleteSavedFilter', values)
      this.dialogDeleteFilters = false
    },
    openDialogEditSavedFiltersName() {
      this.dialogEditSavedFiltersName = true
      this.nameNew = this.savedFilters[this.selected].name
    },
    saveFiltersName() {
      if (!this.validNameNew) return
      const valuesForUpdate = {
        type: this.type,
        oldName: this.savedFilters[this.selected].name,
        newName: this.nameNew,
      }
      this.$store.dispatch('updateSavedFiltersName', valuesForUpdate)
      this.dialogEditSavedFiltersName = false
    },
    loadFilters() {
      let savedFilter = this.savedFilters[this.selected]
      this.$store.state.SavedFilters.dialogSavedFilters = false
      this.$emit('loadFilters', _.cloneDeep(savedFilter.filters))
    },
  },
}
</script>