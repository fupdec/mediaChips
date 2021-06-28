<template>
  <div class="d-flex flex-wrap justify-center">
    <v-tooltip v-if="!isTooltip" top>
      <template v-slot:activator="{ on }">
        <v-btn @click="removeAllFilters" v-on="on" fab x-small dark color="red" class="mr-4">
          <v-icon>mdi-filter-off</v-icon>
        </v-btn>
      </template>
      <span>Remove All Filters</span>
    </v-tooltip>
    <v-chip v-for="(filter, i) in filters" :key="i" 
      @click:close="removeFilter(i)" :disabled="filter.lock" class="ma-1 px-2" small
      :color="isTooltip?'#fff':'primary'" :outlined="isTooltip"
      :close="!isTooltip" dark>
      <span class="mr-1">"{{getMeta(filter.by).settings.name}}"</span>
      <span>{{filter.cond}}</span> 
      <span v-if="filter.type=='array'||filter.type=='select'" class="ml-1">"{{getMetaItems(filter.by, filter.val)}}"</span>
      <span v-else-if="filter.type=='boolean'"></span>
      <span v-else class="ml-1">"{{filter.val}}"</span>
      <!-- TODO remove empty quotes and create function for getting values -->
    </v-chip>
  </div>
</template>


<script>
import MetaGetters from '@/mixins/MetaGetters'
import Countries from '@/components/elements/Countries'

export default {
  name: 'FiltersChips',
  props: {
    filters: Array,
    type: String, // Video or Meta
    isTooltip: Boolean, 
  },
  mixins: [MetaGetters],
  mounted() {
    this.$nextTick(function () {
    })
  },
  computed: {
    filtersState() {
      return this.type.toLowerCase() + 'Filters'
    },
  },
  data: () => ({
  }),
  methods: {
    removeAllFilters() {
      if (['Performer','Website','Meta'].includes(this.$route.name)) {
        this.$emit('removeAllFilters')
        return
      }
      const locked = _.filter(this.$store.state.Settings[this.filtersState], {lock: true})
      this.$store.state.Settings[this.filtersState] = _.cloneDeep(locked)
      this.$store.dispatch(`filter${this.type}s`)
    },
    removeFilter(i) {
      if (this.type == 'Meta') {
        this.$store.state.Meta.filters.splice(i, 1)
        this.$store.dispatch('filterMetaCards')
        return 
      }
      this.filters.splice(i, 1)
      this.$store.dispatch(`filter${this.type}s`)
    },
    getMetaItems(metaId, val) {
      let meta = this.getMeta(metaId)
      let metaCards = this.getCards(metaId)
      if (meta.type == 'specific') {
        if (metaId == 'country') return val.map(name=>_.find(Countries, {name}).name).join(', ')
      } 
      else if (meta.type == 'simple') return val.map(id=>_.find(meta.settings.items, {id}).name).join(', ')
      else if (meta.type == 'complex')  return val.map(id=>_.find(metaCards, {id}).meta.name).join(', ')
    },
  },
}
</script>