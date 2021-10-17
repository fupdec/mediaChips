<template>
	<div>
    <v-dialog v-model="$store.state.SavedFilters.dialogSavedFilters" width="700" scrollable eager>
      <v-card class="pb-4">
        <v-toolbar color="primary">
          <span class="headline">Saved filters for {{type=='meta'?meta.settings.name:type}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.SavedFilters.dialogSavedFilters=false" outlined>
            <v-icon left>mdi-close</v-icon> Close </v-btn>
        </v-toolbar>
        <div class="overline text-center pt-4">Save current filters</div>
        <v-card-actions class="px-0">
          <v-container class="py-0 pl-4">
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-form ref="form" v-model="valid">
                  <v-text-field v-model="savedFiltersName" :rules="[getNameRules]"
                    dense outlined label="Name for current filters"/>
                </v-form>
              </v-col>
            </v-row>
          </v-container>
          <v-spacer class="mx-1"></v-spacer>
          <v-btn @click="addNewSavedFilters" :disabled="!valid" class="mb-4 mr-4 pr-4" color="primary" rounded outlined> 
            <v-icon left>mdi-content-save</v-icon> Save
          </v-btn>
        </v-card-actions>
        <vuescroll>
          <div class="overline text-center py-2">List of saved filters</div>
          <v-card-text v-if="savedFilters.length" class="py-0">
            <v-card outlined>
              <v-list dense class="list-zebra pa-0">
                <v-list-item v-for="(item, i) in savedFilters" :key="i" class="pr-0">
                  <div class="d-flex justify-space-between align-center" style="width:100%">
                    <span class="filter-name">{{item.name}}</span>
                    <span class="d-flex">
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn v-on="on" @click="selected=i, dialogDeleteFilters=true" color="error" icon><v-icon>mdi-delete</v-icon></v-btn>
                        </template>
                        <span>Delete</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn v-on="on" @click="selected=i, rewriteFilter()" color="warning" icon><v-icon>mdi-content-save</v-icon></v-btn>
                        </template>
                        <div>
                          <span>Rewrite with current filters</span>
                          <FiltersChips :filters="filters" :type="type" :isTooltip="true"/>
                        </div>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn v-on="on" @click="selected=i, openDialogEditSavedFiltersName()" icon><v-icon>mdi-pencil</v-icon></v-btn>
                        </template>
                        <span>Edit name</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn v-on="on" @click="selected=i, loadFilters()" color="success" icon><v-icon>mdi-filter</v-icon></v-btn>
                        </template>
                        <div>
                          <span>Load saved filters</span>
                          <FiltersChips :filters="item.filters" :type="type" :isTooltip="true"/>
                        </div>
                      </v-tooltip>
                    </span>
                  </div>
                </v-list-item>
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
const shortid = require('shortid')

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
    FiltersChips: () => import('@/components/elements/FiltersChips.vue'),
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
      if (name.length > 50) return 'Name must be less than 50 characters'
      else if (name.length===0) return 'Name is required'
      else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) return 'Name must not content \\/\%\"<>{}\[\]'
      else if (duplicate!==undefined && duplicate.name===name) return 'Saved filters with that name already exists'
      else return true
    },
    addNewSavedFilters() {
      if (!this.valid) return
      const savedFilters = {
        id: shortid.generate(),
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
      this.$store.dispatch('updateSavedFilterName', valuesForUpdate)
      this.dialogEditSavedFiltersName = false
    },
    rewriteFilter() {
      let type = this.type=='meta' ? this.metaId : this.type
      const valuesForUpdate = {
        type: type,
        id: this.savedFilters[this.selected].id,
        filters: _.cloneDeep(this.filters),
      }
      this.$store.dispatch('rewriteSavedFilter', valuesForUpdate)
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

<style lang="scss">
.filter-name {
  word-break: break-all;
}
</style>