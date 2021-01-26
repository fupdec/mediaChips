<template>
  <div>
    <v-dialog v-model="$store.state.Videos.dialogFilterVideos" scrollable width="1000">
      <v-card>
        <v-card-title>
          <span class="headline">Filter videos</span>
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
                
              <v-autocomplete v-if="filters[i].param==='performers'"
                @input="setVal($event,i)" :value="filters[i].val" :items="performers"
                item-text="name" item-value="name" no-data-text="No more performers"
                class="mb-4 select-small-chips hidden-close" label="Performers" 
                multiple hide-selected hide-details clearable dense outlined
                :menu-props="{contentClass:'list-with-preview'}"
                :filter="filterItemsPerformers" :disabled="filters[i].lock"
              >
                <template v-slot:selection="data">
                  <v-chip close small class="my-1" close-icon="mdi-close"
                    v-bind="data.attrs" :input-value="data.selected" 
                    @click="data.select" @click:close="removeChip(data.item, i)"
                    @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :color="getPerformerColorDependsRating(data.item.rating)"
                    :class="{'tag-with-favorite-performer': data.item.favorite}"
                  ><span>{{ data.item.name }}</span>
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
                class="mb-4 select-small-chips hidden-close val"
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
                class="mb-4 select-small-chips hidden-close"
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

              <v-btn @click="removeFilter(i)" :disabled="filters[i].lock"
                class="ml-2 mt-1" color="red" outlined icon fab x-small>
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
            <v-btn @click="addFilter" color="green" outlined rounded>
              <v-icon left>mdi-plus</v-icon> Add filter
            </v-btn>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn @click="$store.state.Videos.dialogFilterVideos=false" class="ma-4 mt-0">Cancel</v-btn>
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
import vuescroll from 'vuescroll'

export default {
  name: 'DialogFilterVideos',
  components: {
    vuescroll,
  },
  mixins: [ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    params: ['path', 'performers', 'tags', 'websites', 'duration', 'size', 'rating', 'height', 'width'],
    paramTypeNumber: ['duration', 'size', 'rating', 'height', 'width'],
    paramTypeString: ['path'],
    paramTypeArray: ['performers', 'tags', 'websites'],
  }),
  computed: {
    filters: {
      get() {
        return this.$store.state.Settings.videoFilters
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'videoFilters', value})
      },
    },
    performers() {
      return this.$store.getters.performers.orderBy([p=>p.name.toLowerCase()],['asc']).value()
    },
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('video')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    websites() {
      return this.$store.getters.websites.orderBy([w=>w.name.toLowerCase()],['asc']).value()
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    // TODO: add paste from clipboard function for all input's type
    getConditions(type) {
      if (type === 'number') return ['equal', 'not equal', 'greater than', 'less than', 'greater than or equal', 'less than or equal']
      if (type === 'string') return ['including', 'excluding']
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
      if (cond === 'including') return 'mdi-alphabetical'
      if (cond === 'excluding') return 'mdi-alphabetical-off'
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
    removeFilter(i) {
      this.filters.splice(i, 1)
    },
    applyFilters() {
      this.$store.state.Settings.videoFilters = this.filters
      this.$store.dispatch('filterVideos')
      this.updateFiltersOfVideosTab()
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
    addNewTab() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.videoFiltersForTabName, 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.videoFilters),
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$store.state.Videos.dialogFilterVideos = false
      this.$router.push(tab.link)
    },
    getPerformerColorDependsRating(rating) { 
      if (rating === 0) {
        return `rgba(150, 150, 150, 0.1)`
      } else {
        return `rgba(255, 190, 0, ${0.05*rating})`
      }
    },
    updateFiltersOfVideosTab() {
      const pages = ['/performer/:','/website/:']
      let newFilters = _.cloneDeep(this.$store.state.Settings.videoFilters)

      if (this.tabId === 'default') { // for videos page (not for tab)
        this.$store.getters.settings.set('videoFilters', newFilters).write()
      } 
      // for tab of tag page
      else if (this.$route.path.includes('/tag/:')) { 
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters')
          .assign({videos: newFilters}).write()
      } 
      // for tab of performer or website page
      else if (pages.some(p => this.$route.path.includes(p))) { 
        this.$store.getters.tabsDb.find({id:this.tabId})
          .assign({filters:newFilters}).write()
      } 
      // for tab of videos page
      else {
        this.$store.getters.tabsDb.find({id: this.tabId})
          .assign({filters: newFilters}).write()
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