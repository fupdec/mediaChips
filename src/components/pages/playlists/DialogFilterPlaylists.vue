<template>
  <v-dialog v-model="$store.state.Playlists.dialogFilterPlaylists" scrollable width="1000">
    <v-card>
      <v-card-title>
        <span class="headline">Filter Playlists</span>
        <v-spacer></v-spacer>
        <v-icon>mdi-filter</v-icon>
      </v-card-title>
      <v-divider></v-divider>
      <vuescroll>
        <v-card-text class="text-center">
          <div v-for="(filter,i) in filters" :key="i" class="filter-row">
            <v-select @input="setParam($event,i)" :value="filters[i].param" 
              :items="params" label="Parameter" outlined dense class="param overline"
              :prepend-icon="getIconParam(filters[i].param)"
              :disabled="filters[i].lock">
              <template v-slot:item="data">
                <div class="list-item"> 
                  <v-icon left>{{getIconParam(data.item)}}</v-icon>
                  <span class="overline">{{data.item}}</span>
                </div>
              </template>
            </v-select>

            <v-select @input="setCond($event,i)" :value="filters[i].cond" class="cond overline"
              :items="getConditions(filters[i].type)" outlined dense label="Condition"
              :prepend-icon="getIconCond(filters[i].cond)" :disabled="filters[i].lock">
              <template v-slot:item="data">
                <div class="list-item"> 
                  <v-icon left>{{getIconCond(data.item)}}</v-icon>
                  <span class="overline">{{data.item}}</span>
                </div>
              </template>
            </v-select>

            <v-checkbox v-if="filters[i].param==='name'" label="Alt.names" class="mt-1 mr-2"
              @change="setFlag($event,i)" :value="filters[i].flag" indeterminate/>

            <v-text-field v-if="filters[i].type==='number'||filters[i].type==='string'||filters[i].type===null"
              @input="setVal($event,i)" :value="filters[i].val" :rules="[getValueRules]"
              label="Value" outlined dense class="val overline"/>

            <v-text-field v-if="filters[i].type==='date'" 
              :value="filters[i].val" @focus="datePicker=true, datePickerIndex=i"
              label="Date" outlined dense readonly class="val overline"/>
            <v-dialog v-model="datePicker" width="300px">
              <v-date-picker v-if="filters[i].type==='date'"
                @change="setVal($event,datePickerIndex), datePicker=false"
                :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
                :value="filters[datePickerIndex].val" no-title color="primary" full-width/>
            </v-dialog>

            <v-select v-if="filters[i].param==='category'" 
              @input="setVal($event,i)" :value="filters[i].val" :items="['video','performer']" 
              outlined dense label="Categories" class="val overline"
              :disabled="filters[i].lock" multiple
              :menu-props="{contentClass:'overline'}"/>

            <v-btn @click="duplicateFilter(i)" title="Duplicate filter"
              class="ml-2 mt-1" color="green" outlined icon fab x-small>
              <v-icon>mdi-content-duplicate</v-icon>
            </v-btn>
            <v-btn @click="removeFilter(i)" :disabled="filters[i].lock"
              class="ml-2 mt-1" color="red" outlined icon fab x-small title="Remove filter">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <v-btn @click="addFilter" color="green" outlined rounded>
            <v-icon left>mdi-plus</v-icon> Add filter
          </v-btn>
        </v-card-text>
      </vuescroll>
      <v-card-actions>
        <!-- TODO create copy of filters on dialog opened and restore if pressed cancel -->
        <v-btn @click="$store.state.Playlists.dialogFilterPlaylists=false" class="ma-4 mt-0">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="addNewTab" class="ma-4 mt-0" color="secondary">
          <v-icon left>mdi-tab-plus</v-icon>Add new tab</v-btn>
        <v-btn @click="applyFilters" class="ma-4 mt-0" color="primary">
          <v-icon left>mdi-filter</v-icon>Apply filters</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
const shortid = require("shortid")

import ShowImageFunction from '@/mixins/ShowImageFunction'
import vuescroll from 'vuescroll'

export default {
  name: 'DialogFilterPlaylists',
  components: {
    vuescroll,
  },
  mixins: [ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    params: ['name','favorite','date','edit'],
    paramTypeNumber: [],
    paramTypeString: ['name'],
    paramTypeArray: [],
    paramTypeSelect: [],
    paramTypeDate: ['date','edit'],
    paramTypeBoolean: ['favorite'],
    datePicker: false,
    datePickerIndex: 0,
  }),
  computed: {
    filters: {
      get() {
        return this.$store.state.Settings.playlistFilters
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'playlistFilters', value})
      },
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    // TODO: add paste from clipboard function for all input's type
    getConditions(type) {
      if (type === 'number' || type === 'date') return ['equal', 'not equal', 'greater than', 'less than', 'greater than or equal', 'less than or equal']
      if (type === 'string' || type === 'select') return ['includes', 'excludes']
      if (type === 'array') return ['all', 'one of', 'not']
      if (type === 'boolean') return ['yes', 'no']
      return []
    },
    getIconParam(param) {
      if (param === 'name') return 'mdi-alphabetical-variant'
      if (param === 'date') return 'mdi-calendar-plus'
      if (param === 'edit') return 'mdi-calendar-edit'
      if (param === 'favorite') return 'mdi-heart'
      return 'mdi-filter'
    },
    getIconCond(cond) {
      if (cond === 'equal') return 'mdi-equal'
      if (cond === 'not equal') return 'mdi-not-equal-variant'
      if (cond === 'greater than') return 'mdi-greater-than'
      if (cond === 'less than') return 'mdi-less-than'
      if (cond === 'greater than or equal') return 'mdi-greater-than-or-equal'
      if (cond === 'less than or equal') return 'mdi-less-than-or-equal'
      if (cond === 'all') return 'mdi-equal'
      if (cond === 'one of') return 'mdi-math-norm'
      if (cond === 'not') return 'mdi-not-equal-variant'
      if (cond === 'includes') return 'mdi-alphabetical'
      if (cond === 'excludes') return 'mdi-alphabetical-off'
      if (cond === 'yes') return 'mdi-check'
      if (cond === 'no') return 'mdi-close'
      return 'mdi-help'
    },
    addFilter() {
      this.filters.push({
        param: null,
        cond: null,
        val: null,
        type: null,
        flag: null,
        lock: false,
      })
    },
    duplicateFilter(i) {
      let newFilter = _.cloneDeep(this.filters[i])
      newFilter.lock = false
      this.filters.push(newFilter)
    },
    removeFilter(i) {
      this.filters.splice(i, 1)
    },
    applyFilters() {
      this.$store.state.Settings.playlistFilters = _.cloneDeep(this.filters)
      this.$store.dispatch('filterPlaylists')
      this.$store.state.Playlists.dialogFilterPlaylists = false 
    },
    setParam(e, i) {
      this.filters[i].param = e
      if (this.paramTypeNumber.includes(e)) {
        this.filters[i].type = 'number'
        this.filters[i].val = ''
      }
      if (this.paramTypeString.includes(e)) {
        this.filters[i].type = 'string'
        this.filters[i].val = ''
      }
      if (this.paramTypeArray.includes(e)) {
        this.filters[i].type = 'array'
        this.filters[i].val = []
      }
      if (this.paramTypeSelect.includes(e)) {
        this.filters[i].type = 'select'
        this.filters[i].val = ''
      }
      if (this.paramTypeDate.includes(e)) {
        this.filters[i].type = 'date'
        this.filters[i].val = ''
      }
      if (this.paramTypeBoolean.includes(e)) {
        this.filters[i].type = 'boolean'
        this.filters[i].val = ''
      }
      this.filters[i].cond = this.getConditions(this.filters[i].type)[0]
    },
    setCond(e, i) {
      this.filters[i].cond = e
    },
    setVal(e, i) {
      this.filters[i].val = e
    },
    setFlag(e, i) {
      this.filters[i].flag = e
    },
    getValueRules(value) {
      return true
    },
    removeChip(item, i) { 
      const index = this.filters[i].val.indexOf(item.name)
      if (index >= 0) this.filters[i].val.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    addNewTab() {
      // TODO replace shortid with Date.now() miliseconds for all func with creating tab
      let tabId = shortid.generate() 
      let tab = {
        name: this.$store.getters.playlistFiltersForTabName, 
        link: `/playlists/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.playlistFilters),
        sortBy: this.$store.state.Settings.playlistSortBy,
        sortDirection: this.$store.state.Settings.playlistSortDirection,
        page: 1,
        icon: 'format-list-bulleted'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$store.state.Playlists.dialogFilterPlaylists = false
      this.$router.push(tab.link)
    },
  },
}
</script>