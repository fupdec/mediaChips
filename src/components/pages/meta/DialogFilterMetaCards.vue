<template>
  <div>
    <v-dialog v-model="$store.state.Meta.dialogFilterMetaCards" scrollable width="1000">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">Filter {{meta.settings.name}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.SavedFilters.dialogSavedFilters=true" class="mx-4" outlined>
            <v-icon left>mdi-content-save</v-icon> Save / load filters </v-btn>
          <v-btn @click="applyFilters" outlined>
            <v-icon left>mdi-filter</v-icon>Apply filters</v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="text-center">
            <div v-for="(filter,i) in filters" :key="i" class="filter-row">
              <v-autocomplete @input="setBy($event,i)" :value="filters[i].by" 
                :items="computedBy" label="By" outlined dense class="by" hide-selected
                :disabled="filters[i].lock" item-value="by" :filter="filterBy"> 
                <template v-slot:selection="data">
                  <v-icon>mdi-{{getMeta(data.item.by).settings.icon||''}}</v-icon>
                  <span class="mx-2">{{getMeta(data.item.by).settings.name||''}}</span>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <v-icon left>mdi-{{getMeta(data.item.by).settings.icon||''}}</v-icon>
                    <span>{{getMeta(data.item.by).settings.name||''}}</span>
                  </div>
                </template>
              </v-autocomplete>

              <v-select @input="setCond($event,i)" :value="filters[i].cond" class="cond"
                :items="getConditions(filters[i].type)" outlined dense label="Condition"
                :prepend-icon="getIconCond(filters[i].cond)" :disabled="filters[i].lock">
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <v-icon left>{{getIconCond(data.item)}}</v-icon>
                    <span>{{data.item}}</span>
                  </div>
                </template>
              </v-select>

              <v-text-field v-if="filters[i].type==='string'||filters[i].type===null"
                @input="setVal($event,i)" :value="filters[i].val"
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
                label="Value" outlined dense class="val" :hint="getHint(filters[i].by)" persistent-hint/>
              <v-checkbox v-if="filters[i].by==='name' && meta.settings.synonyms" label="Synonyms" class="mt-1 ml-4"
                @change="setFlag($event,i)" :value="filters[i].flag" indeterminate 
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"/>

              <v-text-field v-if="filters[i].type==='number'" label="Value" outlined dense class="val"
                @input="setVal($event,i)" :value="filters[i].val" type="number"
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
                :hint="getHint(filters[i].by)" persistent-hint/>
                
              <v-text-field v-if="filters[i].type==='date'" 
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
                :value="filters[i].val" @click="datePicker=true, datePickerIndex=i"
                label="Date" outlined dense readonly class="val"
                :hint="getHint(filters[i].by)" persistent-hint/>
              <v-dialog v-model="datePicker" width="300px">
                <v-date-picker v-if="filters[i].type==='date'"
                  @change="setVal($event,datePickerIndex), datePicker=false"
                  :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
                  :value="filters[datePickerIndex].val" no-title color="primary" full-width/>
              </v-dialog>

              <v-select v-if="filters[i].type==='array'" 
                @input="setVal($event,i)" :value="filters[i].val" class="val"
                :items="getItems(filters[i].by)" label="Values" item-text="name" item-value="id"
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
                outlined dense multiple :hint="getHint(filters[i].by)" persistent-hint/>
              
              <v-autocomplete v-if="filters[i].type==='select'&&filters[i].by!=='country'" :items="getCards(filters[i].by)" 
                @input="setVal($event,i)" :value="filters[i].val"
                outlined multiple hide-selected dense :ref="filters[i].by"
                label="Values" item-value="id" class="val" close-icon="mdi-close"
                :menu-props="{contentClass:'list-with-preview'}"
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
                :filter="filterCards" :hint="getHint(filters[i].by)" persistent-hint
              >
                <template v-slot:selection="data">
                  <v-chip v-bind="data.attrs" close class="my-1 px-2" small
                    @click="data.select" :input-value="data.selected"
                    @click:close="removeItem(data.item.id,i)" close-icon="mdi-close"
                    :color="getColor(filters[i].by,data.item.id)" 
                    :label="getMeta(filters[i].by).settings.chipLabel"
                    :outlined="getMeta(filters[i].by).settings.chipOutlined"
                    @mouseover.stop="showImage($event, data.item.id, 'meta', filters[i].by)" 
                    @mouseleave.stop="$store.state.hoveredImage=false">
                    <span>{{ data.item.meta.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item" 
                    @mouseover.stop="showImage($event, data.item.id, 'meta', filters[i].by)" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > 
                    <span v-if="getMeta(filters[i].by).settings.favorite">
                      <v-icon :color="data.item.meta.favorite? 'pink':''" left size="14">mdi-heart</v-icon>
                    </span>
                    <span v-if="getMeta(filters[i].by).settings.color">
                      <v-icon :color="data.item.meta.color || ''" left small>
                        mdi-{{getMeta(filters[i].by).settings.icon}}</v-icon>
                    </span>
                    <span>{{data.item.meta.name}}</span>
                    <span v-if="getMeta(filters[i].by).settings.synonyms" class="aliases"> 
                      {{data.item.meta.synonyms===undefined? '' : data.item.meta.synonyms.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>

              <v-autocomplete v-if="filters[i].by==='country'" :items="countries" 
                @input="setVal($event,i)" :value="filters[i].val" 
                outlined multiple hide-selected dense
                label="Country" item-text="name" item-value="name" class="val"
                :menu-props="{contentClass:'list-with-preview'}" :filter="filterCountry"
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'">
                <template v-slot:selection="data">
                  <v-chip v-bind="data.attrs" close class="my-1 px-2" small label outlined
                    @click="data.select" :input-value="data.selected"
                    @click:close="removeItem(data.item.name,i)" close-icon="mdi-close">
                    <country-flag :country='data.item.code' size='normal'/> 
                    <span class="pl-2">{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <country-flag :country='data.item.code' size='normal'/>
                  <span class="pl-2">{{data.item.name}}</span>
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
          </v-card-text>
        </vuescroll>
        <div v-if="filters.length==0" class="text-center pb-10 overline">No filters</div>
        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>
          <v-btn @click="addFilter" class="ma-4 mt-0 pr-4" color="green" outlined rounded>
            <v-icon left>mdi-plus</v-icon> Add filter </v-btn>
          <v-btn v-if="filters.length" @click="removeAll" class="ma-4 mt-0 pr-4" color="red" outlined rounded>
            <v-icon left>mdi-close</v-icon>Remove all</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SavedFilters v-if="$store.state.SavedFilters.dialogSavedFilters" @loadFilters="loadFilters" type="meta" :filters="filters.filter(f=>f.by)"/>
  </div>
</template>


<script>
import DialogFilters from '@/mixins/DialogFilters.vue'
import ShowImageFunction from '@/mixins/ShowImageFunction.vue'
import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters.vue'
import CountryFlag from 'vue-country-flag'
import Countries from '@/components/elements/Countries.js'

export default {
  name: 'DialogFilterMetaCards',
  components: {
    vuescroll,
    SavedFilters: () => import('@/components/elements/SavedFilters.vue'),
    CountryFlag,
  },
  mixins: [DialogFilters, ShowImageFunction, MetaGetters], 
  mounted() {
    this.$nextTick(function () {
      this.initMetaList()
      this.filters = _.cloneDeep(this.$store.state.Meta.filters)
    })
  },
  data: () => ({
    filters: [],
    metaList: ['name','date','edit','views'],
    metaType: {
      number: ['views'],
      string: ['name'],
      array: [],
      date: ['date','edit'],
      boolean: [],
      select: [],
    },
    datePicker: false,
    datePickerIndex: 0,
    countries: Countries,
  }),
  computed: {
    computedBy() {
      let filtersBoolean = _.filter(this.filters, {type: 'boolean'}).map(i=>i.by)
      return this.metaList.map(by => {
        return { by, disabled: filtersBoolean.includes(by) }
      })
    },
    isMetaAssignedToVideo() { return _.find(this.$store.state.Settings.metaAssignedToVideos, {id:this.meta.id}) !== undefined },
  },
  methods: {
    initMetaList() {
      if (this.meta.settings.favorite) {
        this.metaList.push('favorite')
        this.metaType.boolean.push('favorite')
      } 
      if (this.meta.settings.rating) {
        this.metaList.push('rating')
        this.metaType.number.push('rating')
      } 
      if (this.isMetaAssignedToVideo) {
        this.metaList.push('videos')
        this.metaType.number.push('videos')
      } 
      if (this.meta.settings.bookmark) {
        this.metaList.push('bookmark')
        this.metaType.string.push('bookmark')
      } 
      if (this.meta.settings.country) {
        this.metaList.push('country')
        this.metaType.select.push('country')
      } 
      for (let i = 0; i < this.metaInCard.length; i++) {
        let id = this.metaInCard[i].id
        let type = this.metaInCard[i].type
        let meta = this.getMeta(id)
        this.metaList.push(meta.id)
        if (type == 'complex') { this.metaType.select.push(meta.id); continue }
        if (meta.dataType=='number'||meta.dataType=='rating') this.metaType.number.push(meta.id)
        else if (meta.dataType=='string') this.metaType.string.push(meta.id)
        else if (meta.dataType=='array') this.metaType.array.push(meta.id)
        else if (meta.dataType=='boolean') this.metaType.boolean.push(meta.id)
        else if (meta.dataType=='date') this.metaType.date.push(meta.id)
        // TODO fix number type in meta db. some meta cards has wrong type number with string
      }
    },
    applyFilters() {
      let filters = this.filters.filter(f=>f.by)
      this.$store.state.Meta.filters = _.cloneDeep(filters)
      this.$store.dispatch('filterMetaCards')
      this.$store.state.Meta.dialogFilterMetaCards = false 
    },
    filterCountry(cardObject, queryText, itemText) {
      function foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0
        let foundAllChars = false
        for (let i = 0; i < query.length; i++) {
          const char = query.charAt(i)
          const index = text.indexOf(char, foundCharIndex)
          if (index > -1) foundAllChars = true, foundCharIndex = index + 1
          else return false
        }
        return foundAllChars
      }

      let filtersDefault = this.$store.state.Settings.typingFiltersDefault 
      let text = itemText.toLowerCase()
      let query = queryText.toLowerCase()

      if (filtersDefault) return text.indexOf(query) > -1
      else return foundByChars(text, query)
    },
  },
}
</script>