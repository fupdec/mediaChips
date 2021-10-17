<template>
  <div>
    <v-dialog v-model="$store.state.Playlists.dialogFilterPlaylists" scrollable width="1000">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">Filter Playlists</span>
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
                :items="computedBy" label="By" outlined dense class="by"
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

    <SavedFilters v-if="$store.state.SavedFilters.dialogSavedFilters" @loadFilters="loadFilters" type="playlists" :filters="filters.filter(f=>f.by)"/>
  </div>
</template>


<script>
import DialogFilters from '@/mixins/DialogFilters.vue'
import MetaGetters from '@/mixins/MetaGetters.vue'
import ShowImageFunction from '@/mixins/ShowImageFunction.vue'
import vuescroll from 'vuescroll'

export default {
  name: 'DialogFilterPlaylists',
  components: {
    vuescroll,
    SavedFilters: () => import('@/components/elements/SavedFilters.vue'),
  },
  mixins: [DialogFilters, MetaGetters, ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
      this.filters = _.cloneDeep(this.$store.state.Settings.playlistFilters)
    })
  },
  data: () => ({
    filters: [],
    metaList: ['name','favorite','date','edit'],
    metaType: {
      number: [],
      string: ['name'],
      array: [],
      date: ['date','edit'],
      boolean: ['favorite'],
      select: [],
    },
    datePicker: false,
    datePickerIndex: 0,
  }),
  computed: {
    tabId() { return this.$route.query.tabId },
    computedBy() {
      let filtersBoolean = _.filter(this.filters, {type: 'boolean'}).map(i=>i.by)
      return this.metaList.map(by => {
        return { by, disabled: filtersBoolean.includes(by) }
      })
    },
  },
  methods: {
    // TODO: add paste from clipboard function for all input's type
    applyFilters() {
      let filters = this.filters.filter(f=>f.by)
      this.$store.state.Settings.playlistFilters = _.cloneDeep(filters)
      this.$store.dispatch('filterPlaylists')
      this.$store.state.Playlists.dialogFilterPlaylists = false 
    },
  },
}
</script>