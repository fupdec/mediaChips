<template>
	<div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Performers.dialogFilterPerformers=true" v-on="on" icon tile>
          <v-badge :value="filterBadge" :content="filteredPerformersTotal" overlap bottom style="z-index: 5;"> 
          <v-icon>mdi-filter</v-icon> </v-badge>
        </v-btn>
      </template>
      <span>Filter Performers</span>
    </v-tooltip>
    
    <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-badge :icon="sortIcon" overlap offset-x="23" offset-y="44" class="badge-sort">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-sort-variant</v-icon>
                <v-icon v-if="sortDirection=='desc'" size="16" class="badge-sort-icon">mdi-arrow-up-thick</v-icon>
                <v-icon v-else size="16" class="badge-sort-icon">mdi-arrow-down-thick</v-icon>
              </v-btn>
            </v-badge>
          </template>
          <span>Sort Performers</span>
        </v-tooltip>
      </template>
      <v-card>
        <v-btn-toggle v-model="sortButtons" mandatory class="group-buttons-sort" color="primary">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="name" v-on="on">
                <v-icon>mdi-alphabetical-variant</v-icon>
                <v-icon right size="14" v-if="sortButtons=='name' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='name' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Name</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="rating" v-on="on">
                <v-icon>mdi-star-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons=='rating' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='rating' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Rating</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="date" v-on="on">
                <v-icon>mdi-calendar-plus</v-icon>
                <v-icon right size="14" v-if="sortButtons=='date' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='date' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Date Added</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="edit" v-on="on">
                <v-icon>mdi-calendar-edit</v-icon>
                <v-icon right size="14" v-if="sortButtons=='edit' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='edit' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Date of Editing</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="videos" v-on="on">
                <v-icon>mdi-video-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons=='videos' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='videos' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Number of Videos</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="views" v-on="on">
                <v-icon>mdi-eye</v-icon>
                <v-icon right size="14" v-if="sortButtons=='views' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='views' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Number of Views</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-card>
    </v-menu>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn icon tile @click="selectAllPerformers" v-on="on">
          <v-icon>mdi-select-all</v-icon>
        </v-btn>
      </template>
      <span>Select All Performers</span>
    </v-tooltip>

		<v-tooltip bottom>
			<template v-slot:activator="{ on }">
				<v-btn @click="addNewTab" icon tile v-on="on">
					<v-icon>mdi-tab-plus</v-icon>
				</v-btn>
			</template>
			<span>Add New Tab</span>
		</v-tooltip>

    <DialogFilterPerformers v-if="$store.state.Performers.dialogFilterPerformers"/>
	</div>
</template>


<script>
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'PerformersAppbarActions',
  components: {
    DialogFilterPerformers: () => import('@/components/pages/performers/DialogFilterPerformers.vue'),
  },
  mixins: [
    ShowImageFunction
  ], 
  mounted() {
    this.$nextTick(function () {})
  },
  data: () => ({
  }),
  computed: {
    filterBadge() {
      let filters = _.cloneDeep(this.$store.state.Settings.performerFilters)
      if (filters.length) {
        filters = _.filter(filters, f => {
          if (f.type == null) return false 
          if (f.type=='number'||f.type=='string'||f.type=='date'||f.type=='select'||f.type=='array') {
            if (f.val.length) return true 
            else return false
          } 
          if (f.type == 'boolean') return true
        })
        return filters.length > 0
      } else return false
    },
    filteredPerformersTotal() {
      let filters = _.cloneDeep(this.$store.state.Settings.performerFilters)
      if (filters.length) {
        filters = _.filter(filters, f => {
          if (f.type == null) return false 
          if (f.type=='number'||f.type=='string'||f.type=='date'||f.type=='select'||f.type=='array') {
            if (f.val.length) return true 
            else return false
          } 
          if (f.type == 'boolean') return true
        })
        return filters.length
      } else return 0
    },
    sortIcon() {
      if (this.sortButtons=='name') return 'mdi-alphabetical-variant'
      if (this.sortButtons=='rating') return 'mdi-star-outline'
      if (this.sortButtons=='date') return 'mdi-calendar-plus'
      if (this.sortButtons=='edit') return 'mdi-calendar-edit'
      if (this.sortButtons=='videos') return 'mdi-video-outline'
      if (this.sortButtons=='views') return 'mdi-eye'
      return 'mdi-help'
    },
    sortButtons: {
      get() {
        return this.$store.state.Settings.performerSortBy
      },
      set(value) {
        this.$store.state.Settings.performerSortBy = value
      },
    },
    sortDirection() {
      return this.$store.state.Settings.performerSortDirection
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    toggleSortDirection() {
      this.$store.state.Settings.performerSortDirection = this.sortDirection=='asc' ? 'desc':'asc'
      setTimeout(()=>{
        this.$store.dispatch('filterPerformers')
        // this.$store.dispatch('saveFiltersOfPerformers', this.$route)
      },200)
    },
    selectAllPerformers() {
      this.$store.state.Performers.selection.clearSelection()
      let selected = this.$store.state.Performers.selection.select('.performer-card')
      this.$store.state.Performers.selection.keepSelection()
      this.getSelectedPerformers(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedPerformers(selectedPerformers){
      let ids = selectedPerformers.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPerformers', ids)
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