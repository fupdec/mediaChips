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
      <span class="mr-1">"{{filter.param}}"</span>
      <span>{{filter.cond}}</span> 
      <span v-if="filter.type=='array'" class="ml-1">"{{filter.val.join(', ')}}"</span>
      <span v-else-if="filter.type=='boolean'"></span>
      <span v-else class="ml-1">"{{filter.val}}"</span>
    </v-chip>
  </div>
</template>


<script>
export default {
  name: 'FiltersChips',
  props: {
    filters: Array,
    type: String, // e.g. Video, Tag
  },
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
      if (['Performer','Website'].includes(this.$route.name)) {
        this.$emit('removeAllFilters')
        return
      }
      const locked = _.filter(this.$store.state.Settings[this.filtersState], {lock: true})
      this.$store.state.Settings[this.filtersState] = _.cloneDeep(locked)
      this.$store.dispatch(`filter${this.type}s`)
    },
    removeFilter(i) {
      this.filters.splice(i, 1)
      this.$store.dispatch(`filter${this.type}s`)
    },
  },
}
</script>