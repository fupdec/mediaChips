<template>
  <div>
    <v-dialog v-model="$store.state.Videos.dialogFilterVideos" scrollable width="1000">
      <v-card>
        <v-card-title class="py-1 px-4">
          <span class="headline">Filter videos</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="text-center">
            <div v-for="(filter,i) in filters" :key="i" class="filter-row">
              <v-select @input="setParam($event,i)" :value="filters[i].param" 
                :items="computedParams" label="Parameter" outlined dense class="param overline"
                :prepend-icon="getIconParam(filters[i].param)" :disabled="filters[i].lock"
                item-value="name" item-text="name">
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <v-icon left>{{getIconParam(data.item.name)}}</v-icon>
                    <span class="overline">{{data.item.name}}</span>
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

              <v-text-field v-if="filters[i].type==='number'||filters[i].type==='string'||filters[i].type===null"
                @input="setVal($event,i)" :value="filters[i].val" :rules="[getValueRules]"
                label="Value" outlined dense class="val overline" :disabled="filters[i].lock"/>

              <v-text-field v-if="filters[i].type==='date'" 
                :value="filters[i].val" @focus="datePicker=true, datePickerIndex=i"
                label="Date" outlined dense readonly class="val overline"/>
              <v-dialog v-model="datePicker" width="300px">
                <v-date-picker v-if="filters[i].type==='date'"
                  @change="setVal($event,datePickerIndex), datePicker=false"
                  :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
                  :value="filters[datePickerIndex].val" no-title color="primary" full-width/>
              </v-dialog>
                
              <v-autocomplete v-if="filters[i].param==='performers'"
                @input="setVal($event,i)" :value="filters[i].val" :items="performers"
                item-text="name" item-value="name" no-data-text="No more performers"
                class="mb-4 select-small-chips hidden-close val overline" label="Performers" 
                multiple hide-selected hide-details clearable dense outlined
                :menu-props="{contentClass:'list-with-preview'}"
                :filter="filterItemsPerformers" :disabled="filters[i].lock"
              >
                <template v-slot:selection="data">
                  <v-chip close small label class="my-1" close-icon="mdi-close"
                    v-bind="data.attrs" :input-value="data.selected" 
                    @click="data.select" @click:close="removeChip(data.item, i)"
                    @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <span> <v-icon v-if="data.item.favorite" small color="pink">
                      mdi-heart </v-icon> {{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > 
                    <v-icon 
                      left size="12" 
                      :color="data.item.favorite===false ? 'grey' : 'pink'"
                    > mdi-heart </v-icon>
                    <v-rating 
                      class="rating-inline small mr-2"
                      v-model="data.item.rating"
                      color="yellow darken-3"
                      background-color="grey darken-1"
                      empty-icon="$ratingFull" 
                      half-icon="mdi-star-half-full"
                      dense half-increments readonly size="10"
                    />
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.aliases.length" class="aliases"> 
                      aka {{data.item.aliases.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>
                
              <v-autocomplete v-if="filters[i].param==='tags'"
                @input="setVal($event,i)" :value="filters[i].val" :items="tags" 
                class="mb-4 select-small-chips hidden-close val overline"
                item-text="name" dense label="Tags"
                item-value="name" no-data-text="No more tags" 
                multiple hide-selected hide-details clearable outlined
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

              <v-autocomplete v-if="filters[i].param==='websites'"
                @input="setVal($event,i)" :value="filters[i].val" :items="websites" 
                class="mb-4 select-small-chips hidden-close val overline"
                item-text="name" dense label="Websites"
                item-value="name" no-data-text="No more websites" 
                multiple hide-selected hide-details clearable outlined
                :menu-props="{contentClass:'list-with-preview'}" :disabled="filters[i].lock"
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small close class="my-1" close-icon="mdi-close"
                    @click="data.select" @click:close="removeChip(data.item, i)"
                    @mouseover.stop="showImage($event, data.item.id, 'website')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :input-value="data.selected" outlined label
                    :color="data.item.color"
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'website')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <v-icon left size="16" :color="data.item.color"> mdi-web </v-icon>
                    {{data.item.name}}
                  </div>
                </template>
              </v-autocomplete>

              <v-btn @click="duplicateFilter(i)" title="Duplicate filter" 
                class="ml-2 mt-1" color="green" outlined icon fab x-small
                :disabled="filters[i].type=='boolean'">
                <v-icon>mdi-content-duplicate</v-icon>
              </v-btn>
              <v-btn @click="removeFilter(i)" :disabled="filters[i].lock"
                class="ml-2 mt-1" color="red" outlined icon fab x-small title="Remove filter">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
            <v-btn @click="addFilter" color="green" outlined rounded>
              <v-icon left>mdi-plus</v-icon> Add filter </v-btn>
            <v-btn v-if="filters.length" @click="removeAll" class="ml-4" color="red" outlined rounded>
              <v-icon left>mdi-close</v-icon>Remove all</v-btn>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pa-0">
          <v-btn @click="$store.state.Videos.dialogFilterVideos=false" class="ma-4">
            <v-icon left>mdi-cancel</v-icon> Cancel </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.SavedFilters.dialogSavedFilters = true" class="ma-4" color="secondary">
            <v-icon left>mdi-content-save</v-icon> Save / load filters </v-btn>
          <v-btn @click="applyFilters" class="ma-4" color="primary">
            <v-icon left>mdi-filter</v-icon>Apply filters</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SavedFilters v-if="$store.state.SavedFilters.dialogSavedFilters" @loadFilters="loadFilters" type="videos" :filters="filters"/>
  </div>
</template>


<script>
import ShowImageFunction from '@/mixins/ShowImageFunction'
import vuescroll from 'vuescroll'

export default {
  name: 'DialogFilterVideos',
  components: {
    vuescroll,
    SavedFilters: () => import('@/components/elements/SavedFilters.vue'),
  },
  mixins: [ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
      this.filters = _.cloneDeep(this.$store.state.Settings.videoFilters)
    })
  },
  data: () => ({
    filters: [],
    params: ['path','performers','tags','websites','favorite','bookmark','duration','size','rating','height','width','date','edit'],
    paramTypeNumber: ['duration','size','rating','height','width'],
    paramTypeString: ['path'],
    paramTypeArray: ['performers','tags','websites'],
    paramTypeSelect: [],
    paramTypeDate: ['date','edit'],
    paramTypeBoolean: ['favorite','bookmark'],
    datePicker: false,
    datePickerIndex: 0,
  }),
  computed: {
    performers() {
      return this.$store.getters.performers.orderBy([p=>p.name.toLowerCase()],['asc']).value()
    },
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.type.includes('video')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    websites() {
      return this.$store.getters.websites.orderBy([w=>w.name.toLowerCase()],['asc']).value()
    },
    tabId() {
      return this.$route.query.tabId
    },
    computedParams() {
      let filtersBoolean = _.filter(this.filters, {type: 'boolean'}).map(i=>i.param)
      return this.params.map(param => {
        return {
          name: param, 
          disabled: filtersBoolean.includes(param)
        }
      })
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
      if (param === 'path') return 'mdi-file-search'
      if (param === 'performers') return 'mdi-account'
      if (param === 'tags') return 'mdi-tag'
      if (param === 'websites') return 'mdi-web'
      if (param === 'duration') return 'mdi-timer-outline'
      if (param === 'size') return 'mdi-harddisk'
      if (param === 'rating') return 'mdi-star'
      if (param === 'height') return 'mdi-monitor-screenshot'
      if (param === 'width') return 'mdi-monitor-screenshot'
      if (param === 'date') return 'mdi-calendar-plus'
      if (param === 'edit') return 'mdi-calendar-edit'
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
    removeAll() { 
      this.filters = _.filter(this.filters, {lock: true})
    },
    applyFilters() {
      this.$store.state.Settings.videoFilters = _.cloneDeep(this.filters)
      this.$store.dispatch('filterVideos')
      this.$store.state.Videos.dialogFilterVideos = false 
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
    getValueRules(value) {
      return true
    },
    filterItemsPerformers(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const aliases = item.aliases
      let found = false
      for (let i=0;i<aliases.length;i++) {
        if (aliases[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
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
    loadFilters(filters) {
      this.filters = filters
    },
  },
}
</script>