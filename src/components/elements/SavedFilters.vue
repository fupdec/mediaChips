<template>
	<div>
    <v-dialog v-model="$store.state.SavedFilters.dialogSavedFilters" width="800" scrollable eager>
      <v-card class="pb-4">
        <v-toolbar color="primary">
          <span class="headline">Saved filters for {{type=='meta'?meta.settings.name:type}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.SavedFilters.dialogSavedFilters=false" outlined>
            <v-icon left>mdi-close</v-icon> Close </v-btn>
        </v-toolbar>
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
            <v-card outlined>
              <v-list dense class="list-zebra pa-0">
                <v-list-item-group color="primary">
                  <v-list-item v-for="(item, i) in savedFilters" :key="i">
                    <div class="d-flex justify-space-between align-center" style="width:100%">
                      <span>{{item.name}}</span>
                      <span>
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-btn v-on="on" @click="selected=i, dialogDeleteFilters=true" color="red" icon><v-icon>mdi-delete</v-icon></v-btn>
                          </template>
                          <span>Delete</span>
                        </v-tooltip>
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-btn v-on="on" @click="selected=i, openDialogEditSavedFiltersName()" icon><v-icon>mdi-pencil</v-icon></v-btn>
                          </template>
                          <span>Edit name</span>
                        </v-tooltip>
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-btn v-on="on" @click="selected=i, loadFilters()" icon><v-icon>mdi-content-save-move</v-icon></v-btn>
                          </template>
                          <span>Load filters</span>
                        </v-tooltip>
                      </span>
                    </div>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-card>
          </v-card-text>
          <v-card-text class="text-center" v-else>
            <v-icon size="32">mdi-close</v-icon>
            <div class="overline">No filters saved</div>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEditSavedFiltersName" width="500">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">Name editing</span>
          <v-spacer></v-spacer>
          <v-btn @click="saveFiltersName" outlined> <v-icon left>mdi-content-save</v-icon> Save </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
        <v-card-text class="pb-0 pt-4 px-4">
          <v-form ref="formNameNew" v-model="validNameNew">
            <v-text-field v-model="nameNew" :rules="[getNameRules]" dense outlined label="New name"/>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteFilters" :value="dialogDeleteFilters" width="500" persistent>
      <v-card>
        <v-toolbar color="error">
          <v-card-title class="headline pl-0">Are you sure?</v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteFilters=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> no </v-btn>
          <v-btn @click="deleteSavedFilter" outlined> <v-icon left>mdi-check</v-icon> yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div>Delete saved filters with name "<b>{{savedFilters[selected].name}}</b>"?</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'SavedFilters',
  props: {
    type: String,
    filters: Array,
  },
  components: {
    vuescroll,
  },
  mixins: [MetaGetters], 
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
      if (this.type=='meta') return this.$store.state.SavedFilters.savedFilters[this.metaId] 
      else return this.$store.state.SavedFilters.savedFilters[this.type]
    },
  },
  methods: {
    getNameRules(name) {
      let type = this.type=='meta' ? this.metaId : this.type
      let duplicate = this.$store.getters.savedFilters.get([type]).find({name:name}).value()
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
      let type = this.type=='meta' ? this.metaId : this.type
      const values = {
        type: type,
        savedFilters: savedFilters
      }
      this.$store.dispatch('addSavedFilter', values)
      this.savedFiltersName = ''
    },
    deleteSavedFilter() {
      let type = this.type=='meta' ? this.metaId : this.type
      const values = {
        type: type,
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
      this.$refs.formNameNew.validate()
      if (!this.validNameNew) return
      let type = this.type=='meta' ? this.metaId : this.type
      const valuesForUpdate = {
        type: type,
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