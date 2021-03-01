<template>
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
              :items="params" label="Parameter" outlined dense class="param overline"
              :prepend-icon="getIconParam(filters[i].param)" :disabled="filters[i].lock">
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

            <v-checkbox v-if="filters[i].param==='name'" label="Aliases" class="mt-1 mr-2"
              @change="setFlag($event,i)" :value="filters[i].flag" indeterminate/>
            
            <v-text-field v-if="filters[i].type==='number'||filters[i].type==='string'||filters[i].type===null"
              @input="setVal($event,i)" :value="filters[i].val" :rules="[getValueRules]"
              :disabled="filters[i].lock" label="Value" outlined dense class="val overline"/>
              
            <v-text-field v-if="filters[i].type==='date'" 
              :value="filters[i].val" @focus="picker=true, pickerIndex=i"
              label="Date" outlined dense readonly class="val overline"/>
            <v-dialog v-model="picker" width="300px">
              <v-date-picker v-if="filters[i].type==='date'"
                @change="setVal($event,pickerIndex), picker=false"
                :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
                :value="filters[pickerIndex].val" no-title color="primary" full-width/>
            </v-dialog>

            <v-autocomplete v-if="filters[i].param==='nations'" 
              @input="setVal($event,i)" :value="filters[i].val" :disabled="filters[i].lock"
              :items="countries" item-text="name" item-value="name" label="Nationality" 
              multiple hide-selected hide-details clearable outlined dense small-chips
              class="select-small-chips nation-chips hidden-close val overline"
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
              class="mb-4 select-small-chips hidden-close val overline" label="Tags" 
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

            <v-select v-if="filters[i].type==='array' && namesOfCustomParams.includes(filters[i].param)" 
              @input="setVal($event,i)" :value="filters[i].val" class="val overline"
              :items="getCustomItems(filters[i].param)" label="Values"
              :disabled="filters[i].lock" outlined dense multiple 
              :menu-props="{contentClass:'overline'}"/>

            <v-select v-if="filters[i].param==='category'" 
              @input="setVal($event,i)" :value="filters[i].val" 
              :items="$store.state.Settings.performerInfoCategory" 
              outlined dense label="Categories" class="val overline"
              :disabled="filters[i].lock" multiple
              :menu-props="{contentClass:'overline'}"/>

            <v-select v-if="filters[i].param==='ethnicity'" 
              @input="setVal($event,i)" :value="filters[i].val" 
              :items="$store.state.Settings.performerInfoEthnicity" 
              outlined dense label="Ethnicity" class="val overline"
              :disabled="filters[i].lock" multiple
              :menu-props="{contentClass:'overline'}"/>

            <v-select v-if="filters[i].param==='hair'" 
              @input="setVal($event,i)" :value="filters[i].val" 
              :items="$store.state.Settings.performerInfoHair" 
              outlined dense label="Hair" class="val overline"
              :disabled="filters[i].lock" multiple
              :menu-props="{contentClass:'overline'}"/>

            <v-select v-if="filters[i].param==='eyes'" 
              @input="setVal($event,i)" :value="filters[i].val" 
              :items="$store.state.Settings.performerInfoEyes" 
              outlined dense label="Eyes" class="val overline"
              :disabled="filters[i].lock" multiple
              :menu-props="{contentClass:'overline'}"/>

            <v-select v-if="filters[i].param==='cups'" 
              @input="setVal($event,i)" :value="filters[i].val" 
              :items="$store.state.Settings.performerInfoCups" 
              outlined dense label="Cups" class="val overline"
              :disabled="filters[i].lock" multiple
              :menu-props="{contentClass:'overline'}"/>

            <v-select v-if="filters[i].param==='boobs'" 
              @input="setVal($event,i)" :value="filters[i].val" 
              :items="$store.state.Settings.performerInfoBoobs" 
              outlined dense label="Boobs" class="val overline"
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
        <v-btn @click="$store.state.Performers.dialogFilterPerformers=false" class="ma-4 mt-0">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn v-if="filters.length>5" @click="removeAll" class="ma-4 mt-0" color="red" dark>
          <v-icon left>mdi-close</v-icon>Remove all</v-btn>
        <v-btn @click="addNewTab" class="ma-4 mt-0" color="secondary">
          <v-icon left>mdi-tab-plus</v-icon>Add new tab</v-btn>
        <v-btn @click="applyFilters" class="ma-4 mt-0" color="primary">
          <v-icon left>mdi-filter</v-icon>Apply filters</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
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
      for (let param in this.customParams) {
        let type = this.customParams[param].type
        let name = this.customParams[param].name
        this.params.push(name)
        if (type=='number') this.paramTypeNumber.push(name)
        if (type=='string') this.paramTypeString.push(name)
        if (type=='array') this.paramTypeArray.push(name)
        if (type=='select') this.paramTypeSelect.push(name)
        if (type=='boolean') this.paramTypeBoolean.push(name)
        if (type=='date') this.paramTypeDate.push(name)
      }
      this.filters = _.cloneDeep(this.$store.state.Settings.performerFilters)
    })
  },
  data: () => ({
    filters: [],
    params: ['name','tags','category','rating','favorite','bookmark','birthday','start','end','nations','ethnicity','hair','eyes','height','weight','boobs','cups','bra','waist','hip','date','edit'],
    paramTypeNumber: ['rating','height','weight','bra','waist','hip','start','end',],
    paramTypeString: ['name',],
    paramTypeArray: ['tags','category','nations','ethnicity','hair','eyes','boobs','cups'],
    paramTypeSelect: [],
    paramTypeBoolean: ['favorite','bookmark'],
    paramTypeDate: ['birthday','date','edit'],
    picker: false,
    pickerIndex: 0,
  }),
  computed: {
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('performer')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    tabId() {
      return this.$route.query.tabId
    },
    customParams() {
      return this.$store.state.Settings.customParametersPerformer
    },
    namesOfCustomParams() {
      return this.$store.state.Settings.customParametersPerformer.map(p=>p.name)
    },
  },
  methods: {
    // TODO: add paste from clipboard function for all input's type
    getCustomItems(paramName) {
      if (this.namesOfCustomParams.includes(paramName)) {
        return _.find(this.customParams, {name: paramName}).items
      } else return []
    },
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
      if (param === 'nations') return 'mdi-flag'
      if (param === 'ethnicity') return 'mdi-account-group'
      if (param === 'hair') return 'mdi-face-woman'
      if (param === 'eyes') return 'mdi-eye'
      if (param === 'cups') return 'mdi-coffee'
      if (param === 'boobs') return 'mdi-vector-circle-variant'
      if (param === 'height') return 'mdi-human-male-height'
      if (param === 'weight') return 'mdi-weight'
      if (param === 'bra'||param === 'waist'||param === 'hip') return 'mdi-tape-measure'
      if (param === 'favorite') return 'mdi-heart'
      if (param === 'bookmark') return 'mdi-bookmark'
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
      this.$store.state.Settings.performerFilters = _.cloneDeep(this.filters)
      this.$store.dispatch('filterPerformers')
      // this.$store.dispatch('saveFiltersOfPerformers', this.$route)
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
      if (this.paramTypeBoolean.includes(e)) {
        this.filters[i].type = 'boolean'
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
    setFlag(e, i) {
      this.filters[i].flag = e
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
    removeAll() { 
      this.filters = _.filter(this.filters, {lock: true})
    },
    addNewTab() {
      let tabId = Date.now()
      let tab = { 
        name: this.$store.getters.performerFiltersForTabName, 
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.performerFilters),
        sortBy: this.$store.state.Settings.performerSortBy,
        sortDirection: this.$store.state.Settings.performerSortDirection,
        page: 1,
        firstChar: this.$store.state.Settings.performerFirstChar,
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$store.state.Performers.dialogFilterPerformers = false
      this.$router.push(tab.link)
    },
  },
}
</script>