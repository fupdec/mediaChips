<template>
  <div>
    <v-dialog v-model="$store.state.Performers.dialogFilterPerformers" scrollable width="1000">
      <v-card>
        <v-card-title>
          <span class="headline">Filter performers</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="text-center">
            <div v-for="(filter,i) in filters" :key="i" class="filter-row">
              <v-select @input="setParam($event,i)" :value="filters[i].param" 
                :items="params" label="Parameter" outlined dense class="param"
                :prepend-icon="getIconParam(filters[i].param)"
                :menu-props="{contentClass:'list-with-preview'}" :disabled="filters[i].lock">
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <v-icon left size="14">{{getIconParam(data.item)}}</v-icon>
                    <span>{{data.item}}</span>
                  </div>
                </template>
              </v-select>

              <v-select @input="setCond($event,i)" :value="filters[i].cond" 
                :items="getConditions(filters[i].type)" outlined dense label="Condition"
                :menu-props="{contentClass:'list-with-preview'}" class="cond"
                :prepend-icon="getIconCond(filters[i].cond)" :disabled="filters[i].lock">
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <v-icon left size="14">{{getIconCond(data.item)}}</v-icon>
                    <span>{{data.item}}</span>
                  </div>
                </template>
              </v-select>

              <v-text-field v-if="filters[i].type==='number'||filters[i].type==='string'||filters[i].type===null"
                @input="setVal($event,i)" :value="filters[i].val" :rules="[getValueRules]"
                label="Value" outlined dense class="val"/>
                
              <v-text-field v-if="filters[i].type==='date'" 
                :value="filters[i].val" @focus="datePicker=true, datePickerIndex=i"
                label="Date" outlined dense readonly/>
              <v-dialog v-model="datePicker" width="300px">
                <v-date-picker @change="setVal($event,datePickerIndex), datePicker=false"
                  :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
                  :value="filters[datePickerIndex].val" no-title color="primary" full-width/>
              </v-dialog>

              <v-autocomplete v-if="filters[i].param==='nation'" 
                @input="setVal($event,i)" :value="filters[i].val" :disabled="filters[i].lock"
                :items="countries" item-text="name" item-value="name" label="Nationality" 
                multiple hide-selected hide-details clearable outlined dense small-chips
                class="select-small-chips nation-chips hidden-close"
                :menu-props="{contentClass:'list-with-preview'}">
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small class="my-1" close
                    :input-value="data.selected" label close-icon="mdi-close"
                    @click="data.select" @click:close="removeChip(data.item, i)"
                  > <country-flag :country='data.item.code' size='normal'/> {{ data.item.name }}
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <template v-if="typeof data.item !== 'object'">
                    <v-list-item-content v-text="data.item"></v-list-item-content>
                  </template>
                  <template v-else>
                    <country-flag :country='data.item.code' size='normal'/>
                    <v-list-item-content>
                      <v-list-item-title v-html="data.item.name"></v-list-item-title>
                    </v-list-item-content>
                  </template>
                </template>
              </v-autocomplete>
                
              <v-autocomplete v-if="filters[i].param==='tags'"
                @input="setVal($event,i)" :value="filters[i].val" :items="tags" 
                class="mb-4 select-small-chips hidden-close val" label="Tags" 
                item-text="name" item-value="name" no-data-text="No more tags" 
                multiple hide-selected hide-details clearable outlined dense
                :menu-props="{contentClass:'list-with-preview'}"
                :filter="filterItemsTags" :disabled="filters[i].lock"
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small class="my-1" close-icon="mdi-close"
                    @click="data.select" @click:close="removeChip(data.item, i)"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :input-value="data.selected" outlined close
                    :color="data.item.color" 
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.altNames.length" class="aliases"> 
                      {{data.item.altNames.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>

              <v-select v-if="filters[i].param==='category'" 
                @input="setVal($event,i)" :value="filters[i].val" 
                :items="$store.state.Settings.performerInfoCategory" 
                outlined dense label="Categories"
                :disabled="filters[i].lock" multiple/>

              <v-select v-if="filters[i].param==='ethnicity'" 
                @input="setVal($event,i)" :value="filters[i].val" 
                :items="$store.state.Settings.performerInfoEthnicity" 
                outlined dense label="Ethnicity"
                :disabled="filters[i].lock" multiple/>

              <v-select v-if="filters[i].param==='hair'" 
                @input="setVal($event,i)" :value="filters[i].val" 
                :items="$store.state.Settings.performerInfoHair" 
                outlined dense label="Hair"
                :disabled="filters[i].lock" multiple/>

              <v-select v-if="filters[i].param==='eyes'" 
                @input="setVal($event,i)" :value="filters[i].val" 
                :items="$store.state.Settings.performerInfoEyes" 
                outlined dense label="Eyes"
                :disabled="filters[i].lock" multiple/>

              <v-select v-if="filters[i].param==='cup'" 
                @input="setVal($event,i)" :value="filters[i].val" 
                :items="$store.state.Settings.performerInfoCups" 
                outlined dense label="Cups"
                :disabled="filters[i].lock" multiple/>

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
          <v-btn @click="$store.state.Performers.dialogFilterPerformers=false" class="ma-4 mt-0">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="addNewTab" class="ma-4 mt-0" color="secondary">
            <v-icon left>mdi-tab-plus</v-icon>Add new tab</v-btn>
          <v-btn @click="applyFilters" class="ma-4 mt-0" color="primary">
            <v-icon left>mdi-filter</v-icon>Apply filters</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const shortid = require("shortid")

import ShowImageFunction from '@/mixins/ShowImageFunction'
import Countries from '@/mixins/Countries'
import CountryFlag from 'vue-country-flag'
import vuescroll from 'vuescroll'

export default {
  name: 'DialogFilterPerformers',
  components: {
    CountryFlag, 
    vuescroll, 
  },
  mixins: [ShowImageFunction, Countries], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    params: ['name','tags','category','rating','birthday','start','end','nation','ethnicity','hair','eyes','height','weight','cup','bra','waist','hip','date','edit'],
    paramTypeNumber: ['rating','height','weight','bra','waist','hip','start','end',],
    paramTypeString: ['name',],
    paramTypeArray: ['tags','category','ethnicity','hair','eyes','cup'],
    paramTypeSelect: ['nation'],
    paramTypeBoolean: [],
    paramTypeDate: ['birthday','date','edit'],
    datePicker: false,
    datePickerIndex: 0,
  }),
  computed: {
    filters: {
      get() {
        return this.$store.state.Settings.performerFilters
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'performerFilters', value})
      },
    },
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('performer')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
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
      if (param === 'tags') return 'mdi-tag'
      if (param === 'category') return 'mdi-account-group-outline'
      if (param === 'rating') return 'mdi-star'
      if (param === 'birthday'||param === 'start'||param === 'end'||param === 'date'||param ==='edit') return 'mdi-calendar'
      if (param === 'nation') return 'mdi-flag'
      if (param === 'ethnicity') return 'mdi-account-group'
      if (param === 'hair') return 'mdi-face-woman'
      if (param === 'eyes') return 'mdi-eye'
      if (param === 'cup') return 'mdi-coffee'
      if (param === 'height') return 'mdi-human-male-height'
      if (param === 'weight') return 'mdi-weight'
      if (param === 'bra'||param === 'waist'||param === 'hip') return 'mdi-tape-measure'
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
      return 'mdi-help'
    },
    addFilter() {
      this.filters.push({
        param: null,
        cond: null,
        val: null,
        type: null,
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
      this.$store.state.Settings.performerFilters = this.filters
      this.$store.dispatch('filterPerformers')
      this.updateFiltersOfPerformersTab()
      this.$store.state.Performers.dialogFilterPerformers = false 
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
      this.filters[i].cond = this.getConditions(this.filters[i].type)[0]
    },
    setCond(e, i) {
      this.filters[i].cond = e
    },
    setVal(e, i) {
      this.filters[i].val = e
    },
    getValueRules(value) {
      return true
    },
    filterItemsTags(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const alternateNames = item.altNames
      let found = false
      for (let i=0;i<alternateNames.length;i++) {
        if (alternateNames[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    removeChip(item, i) { 
      const index = this.filters[i].val.indexOf(item.name)
      if (index >= 0) this.filters[i].val.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    addNewTab() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.performerFiltersForTabName, 
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.performerFilters),
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$store.state.Performers.dialogFilterPerformers = false
      this.$router.push(tab.link)
    },
    updateFiltersOfPerformersTab() {
      let newFilters = _.cloneDeep(this.$store.state.Settings.performerFilters)

      if (this.tabId === 'default') { // for performers page (not for tab)
        this.$store.getters.settings.set('performerFilters', newFilters).write()
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.performerFiltersForTabName,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
      // TODO: universal function for update all types of tabs
    },
  },
}
</script>


<style lang="less">
.filter-row {
  display: flex;
  .param {
    width: 25%;
    display: flex;
    input {
      display: none;
    }
  }
  .cond {
    width: 25%;
    margin-left: 15px;
    margin-right: 15px;
    .v-select__selections {
      display: flex;
      justify-content: center;
    }
    .v-select__selection {
      margin: 0;
    }
    input {
      display: none;
    }
  }
  .val {
    width: 50%;
  }
  .v-input__icon--append {
    display: none;
  }
}
</style>