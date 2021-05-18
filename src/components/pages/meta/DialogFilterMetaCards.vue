<template>
  <div>
    <v-dialog v-model="$store.state.Meta.dialogFilterMetaCards" scrollable width="1000">
      <v-card>
        <v-card-title class="py-1 px-4">
          <span class="headline">Filter {{meta.settings.name}}</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        
        <vuescroll>
          <v-card-text class="text-center">
            <div v-for="(filter,i) in filters" :key="i" class="filter-row">
              <v-select @input="setBy($event,i)" :value="filters[i].by" 
                :items="metaList" label="By" outlined dense class="param"
                :disabled="filters[i].lock">
                <template v-slot:selection="data">
                  <v-icon left>mdi-{{getMeta(data.item).settings.icon||''}}</v-icon>
                  <span>{{getMeta(data.item).settings.name||''}}</span>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <v-icon left>mdi-{{getMeta(data.item).settings.icon||''}}</v-icon>
                    <span>{{getMeta(data.item).settings.name||''}}</span>
                  </div>
                </template>
              </v-select>

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

              <v-checkbox v-if="filters[i].by==='name'" label="Aliases" class="mt-1 mr-2"
                @change="setFlag($event,i)" :value="filters[i].flag" indeterminate 
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"/>
              
              <v-text-field v-if="filters[i].type==='number'||filters[i].type==='string'||filters[i].type===null"
                @input="setVal($event,i)" :value="filters[i].val" :rules="[getValueRules]"
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
                label="Value" outlined dense class="val"/>
                
              <v-text-field v-if="filters[i].type==='date'" 
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
                :value="filters[i].val" @click="datePicker=true, datePickerIndex=i"
                label="Date" outlined dense readonly class="val"/>
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
                 outlined dense multiple />
              
              <v-autocomplete v-if="filters[i].type==='select'" :items="getCards(filters[i].by)" 
                @input="setVal($event,i)" :value="filters[i].val"
                outlined multiple hide-selected hide-details dense
                label="Values" item-value="id" class="val"
                :menu-props="{contentClass:'list-with-preview'}"
                :disabled="filters[i].lock||filters[i].cond=='empty'||filters[i].cond=='not empty'"
              >
                <template v-slot:selection="data">
                  <v-chip v-bind="data.attrs" close 
                    @click:close="removeItem(data.item.id,i)"
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
                    <span v-if="getMeta(filters[i].by).settings.chipColor">
                      <v-icon :color="data.item.meta.color || ''" left small>
                        mdi-{{getMeta(filters[i].by).settings.icon}}</v-icon>
                    </span>
                    <span>{{data.item.meta.name}}</span>
                    <span v-if="getMeta(filters[i].by).settings.synonyms" class="aliases"> a.k.a.
                      {{card.meta.synonyms===undefined? '' : card.meta.synonyms.join(', ').slice(0,50)}}
                    </span>
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
          <v-btn @click="$store.state.Meta.dialogFilterMetaCards=false" class="ma-4">
            <v-icon left>mdi-cancel</v-icon> Cancel </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.SavedFilters.dialogSavedFilters = true" class="ma-4" color="secondary">
            <v-icon left>mdi-content-save</v-icon> Save / load filters </v-btn>
          <v-btn @click="applyFilters" class="ma-4" color="primary">
            <v-icon left>mdi-filter</v-icon>Apply filters</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SavedFilters v-if="$store.state.SavedFilters.dialogSavedFilters" @loadFilters="loadFilters" type="meta" :filters="filters"/>
  </div>
</template>


<script>
import ShowImageFunction from '@/mixins/ShowImageFunction'
import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'DialogFilterMetaCards',
  components: {
    vuescroll,
    SavedFilters: () => import('@/components/elements/SavedFilters.vue'),
  },
  mixins: [ShowImageFunction, MetaGetters], 
  mounted() {
    this.$nextTick(function () {
      this.initMetaList()
      this.filters = _.cloneDeep(this.meta.filters || [])
    })
  },
  data: () => ({
    filters: [],
    metaList: [],
    metaType: {
      number: [],
      string: [],
      array: [],
      date: [],
      boolean: [],
      select: [],
    },
    datePicker: false,
    datePickerIndex: 0,
  }),
  computed: {
    tabId() { return this.$route.query.tabId },
  },
  methods: {
    initMetaList() {
      for (let i = 0; i < this.metaInCard.length; i++) {
        let id = this.metaInCard[i].id
        let type = this.metaInCard[i].type
        let meta = this.getMeta(id)
        this.metaList.push(meta.id)
        if (type == 'complex') { this.metaType.select.push(meta.id); continue }
        if (meta.dataType=='number') this.metaType.number.push(meta.id)
        else if (meta.dataType=='string') this.metaType.string.push(meta.id)
        else if (meta.dataType=='array') this.metaType.array.push(meta.id)
        else if (meta.dataType=='boolean') this.metaType.boolean.push(meta.id)
        else if (meta.dataType=='date') this.metaType.date.push(meta.id)
      }
    },
    getConditions(type) {
      if (type === 'number' || type === 'date') return ['equal', 'not equal', 'greater than', 'less than', 'greater than or equal', 'less than or equal', 'empty', 'not empty']
      if (type === 'string') return ['includes', 'excludes', 'empty', 'not empty']
      if (type === 'array' || type === 'select') return ['includes all', 'includes one of', 'excludes', 'empty', 'not empty']
      if (type === 'boolean') return ['yes', 'no']
      return []
    },
    getIconCond(cond) {
      if (cond === 'equal') return 'mdi-equal'
      if (cond === 'not equal') return 'mdi-not-equal-variant'
      if (cond === 'greater than') return 'mdi-greater-than'
      if (cond === 'less than') return 'mdi-less-than'
      if (cond === 'greater than or equal') return 'mdi-greater-than-or-equal'
      if (cond === 'less than or equal') return 'mdi-less-than-or-equal'
      if (cond === 'includes all' || cond === 'includes') return 'mdi-equal'
      if (cond === 'includes one of') return 'mdi-math-norm'
      if (cond === 'excludes') return 'mdi-not-equal-variant'
      if (cond === 'yes') return 'mdi-check'
      if (cond === 'no') return 'mdi-close'
      if (cond === 'empty') return 'mdi-code-brackets'
      if (cond === 'not empty') return 'mdi-dots-horizontal'
      return 'mdi-help'
    },
    getItems(id) { return this.getMeta(id).settings.items || [] },
    addFilter() {
      this.filters.push({
        by: null,
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
    removeItem(item, i) { 
      const index = this.filters[i].val.indexOf(item)
      if (index >= 0) this.filters[i].val.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeFilter(i) { this.filters.splice(i, 1) },
    removeAll() { this.filters = _.filter(this.filters, {lock: true}) },
    applyFilters() {
      let filters = _.cloneDeep(this.filters)
      this.$store.getters.meta.find({id:this.metaId}).set('filters', filters).write()
      this.$store.dispatch('filterMetaCards', {metaId: this.metaId})
      this.$store.state.Meta.dialogFilterMetaCards = false 
    },
    setBy(e, i) {
      this.filters[i].by = e
      if (this.metaType.number.includes(e)) {
        this.filters[i].type = 'number'
        this.filters[i].val = ''
      } else if (this.metaType.string.includes(e)) {
        this.filters[i].type = 'string'
        this.filters[i].val = ''
      } else if (this.metaType.array.includes(e)) {
        this.filters[i].type = 'array'
        this.filters[i].val = []
      } else if (this.metaType.date.includes(e)) {
        this.filters[i].type = 'date'
        this.filters[i].val = ''
      } else if (this.metaType.boolean.includes(e)) {
        this.filters[i].type = 'boolean'
        this.filters[i].val = ''
      } else if (this.metaType.select.includes(e)) {
        this.filters[i].type = 'select'
        this.filters[i].val = []
      }
      this.filters[i].cond = this.getConditions(this.filters[i].type)[0]
    },
    setCond(e, i) { this.filters[i].cond = e },
    setVal(e, i) { this.filters[i].val = e },
    setFlag(e, i) { this.filters[i].flag = e },
    getValueRules(value) { return true },
    removeChip(item, i) { 
      const index = this.filters[i].val.indexOf(item.name)
      if (index >= 0) this.filters[i].val.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    loadFilters(filters) { this.filters = filters },
  },
}
</script>