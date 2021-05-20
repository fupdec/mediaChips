<template>
  <div>
    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <v-btn @click="removeAllFilters" v-on="on" fab x-small dark color="red" class="mr-4">
          <v-icon>mdi-filter-off</v-icon>
        </v-btn>
      </template>
      <span>Remove All Filters</span>
    </v-tooltip>
    <v-chip v-for="(filter, i) in filters" :key="i" class="ma-1" color="primary" 
      small close :disabled="filter.lock" @click:close="removeFilter(i)">
      <span v-if="type=='Meta'" class="mr-1">"{{getMeta(filter.by).settings.name}}"</span>
      <span v-else class="mr-1">"{{filter.param}}"</span>
      <span>{{filter.cond}}</span> 
      <div v-if="type=='Meta'">
        <!-- TODO remove empty quotes and create function for getting values -->
        <span v-if="filter.type=='array'||filter.type=='select'" class="ml-1">"{{getMetaItems(filter.by, filter.val)}}"</span>
        <span v-else-if="filter.type=='boolean'"></span>
        <span v-else class="ml-1">"{{filter.val}}"</span>
      </div>
      <div v-else>
        <span v-if="filter.type=='array'" class="ml-1">"{{filter.val.join(', ')}}"</span>
        <span v-else-if="filter.type=='boolean'"></span>
        <span v-else class="ml-1">"{{filter.val}}"</span>
      </div>
    </v-chip>
  </div>
</template>


<script>
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'FiltersChips',
  props: {
    filters: Array,
    type: String, // e.g. Video, Tag
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
        this.filters.splice(i, 1)
        this.$store.dispatch('filterMetaCards')
        return // TODO rename type to 'MetaCard' and remove condition block
      }
      this.filters.splice(i, 1)
      this.$store.dispatch(`filter${this.type}s`)
    },
    getMetaItems(metaId, items) {
      let meta = this.getMeta(metaId)
      let metaCards = this.getCards(metaId)
      if (meta.type == 'simple') return items.map(id=>_.find(meta.settings.items, {id}).name).join(', ')
      else return items.map(id=>_.find(metaCards, {id}).meta.name).join(', ')
    },
  },
}
</script>