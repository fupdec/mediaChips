<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div class="headline text-h3 d-flex align-center justify-center py-4">
      <v-icon x-large left>mdi-{{meta.settings.icon}}</v-icon> {{meta.settings.name}}
      <span class="text-h5 ml-2">({{filteredMeta.length}})</span>
    </div>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start py-0">
      <FiltersChips :filters="filters" type="Meta" @removeAllFilters="removeAllFilters"/>
    </v-container>

    <div v-if="metaCardsOnPage.length">
      <v-container fluid class="pagination-container">
        <v-overflow-btn v-model="cardsPerPage" hint="items per page" persistent-hint
          :items="cardsPerPagePreset" dense height="36" solo disable-lookup hide-no-data
          class="items-per-page-dropdown"/>
        <v-spacer/>
        <v-pagination v-model="currentPage" :length="pagesSum" :total-visible="getNumberOfPagesLimit"/>
        <v-spacer/>
        <v-overflow-btn v-if="pagesSum > 5" 
          v-model="currentPage" :items="pages" dense height="36" solo
          class="items-per-page-dropdown jump-to-page-menu"
          disable-lookup hint="jump to page" persistent-hint hide-no-data
          :menu-props="{ auto:true, contentClass:'jump-to-page-menu',
            nudgeBottom: -110, origin:'center center', transition:'scale-transition'}"/>
        <div v-else style="min-width:80px;"></div>
      </v-container>

      <v-container fluid class="meta-grid">
        <MetaCard v-for="card in metaCardsOnPage" :key="card.id" :card="card"/>
      </v-container>
      
      <v-pagination v-model="currentPage" :length="pagesSum" :total-visible="getNumberOfPagesLimit" class="my-4"/>
    </div>
    
    <div v-else class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching videos for the selected filters.
    </div>

    <Loading />
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-10"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    
    <DialogEditMetaCard v-if="$store.state.Meta.dialogEditMetaCard"/>
    <DialogEditMetaCardImages v-if="$store.state.Meta.dialogEditMetaCardImages"/>
  </vuescroll>
</template>


<script>
import MetaCard from '@/components/pages/meta/MetaCard.vue'
import vuescroll from 'vuescroll'
import Selection from '@simonwep/selection-js'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: "MetaPage",
  components: {
    MetaCard,
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
    DialogEditMetaCard: () => import('@/components/pages/meta/DialogEditMetaCard.vue'),
    DialogEditMetaCardImages: () => import('@/components/pages/meta/DialogEditMetaCardImages.vue'),
    FiltersChips: () => import('@/components/elements/FiltersChips.vue'),
  },
  mixins: [MetaGetters],
  beforeMount() {
    this.initFilters()
  },
  mounted() {
    this.$nextTick(function () {
      this.initSelection()
    })
  },
  destroyed() {
    this.$store.state.Meta.selection.destroy()
  },
  data: () => ({
    cardsPerPagePreset: [20,40,60,80,100,150,200,300], // TODO create custom numbers in settings
    isScrollToTopVisible: false,
  }),
  computed: {
    getNumberOfPagesLimit() { return this.$store.state.Settings.numberOfPagesLimit },
    pages() { return this.$store.getters.metaCardsPages },
    cardsPerPage: {
      get() { return this.$store.state.Meta.cardsPerPage },
      set(number) { this.$store.state.Meta.cardsPerPage = number },
    },
    pagesSum: {
      get() { return this.$store.state.Meta.pageTotal },
      set(number) { this.$store.state.Meta.pageTotal = number },
    },
    currentPage: {
      get() { return this.$store.state.Meta.page },
      set(number) { this.$store.state.Meta.page = number },
    },
    metaCardsOnPage() { return this.$store.getters.metaCardsOnPage },
    filteredMeta() { return this.$store.state.Meta.filteredMeta },
    filters() { return this.$store.getters.meta.find({id:this.metaId}).cloneDeep().value().filters || [] },
  },
  methods: {
    initSelection() {
      this.$store.state.Meta.selection = new Selection({
        boundaries: ['.meta-grid'],
        selectables: ['.meta-card'],
        allowTouch: false,
      }).on('beforestart', ({store, event}) => {
        const targetEl = event.target.closest('.meta-card')
        if (event.button == 2 && store.stored.includes(targetEl)) return false
        return (event.button !== 1)
      }).on('start', ({store, event}) => {
        const targetEl = event.target.closest('.meta-card')
        if (event.button == 2 && store.stored.includes(targetEl)) return false
        if (!event.ctrlKey && !event.metaKey) {
          for (const el of store.stored) el.classList.remove('selected')
          this.$store.state.Meta.selection.clearSelection()
        }
      }).on('move', ({store: {changed: {added, removed}}}) => {
        for (const el of added) el.classList.add('selected')
        for (const el of removed) el.classList.remove('selected')
      }).on('stop', ({store, event}) => {
        const targetEl = event.target.closest('.meta-card')
        if (event.button==0 && targetEl) this.$store.state.Meta.selection.select(targetEl)
        this.$store.state.Meta.selection.keepSelection()
        this.$store.state.Meta.selectedMeta = store.stored.map(item => (item.dataset.id))
      })
    },
    scrollToTop() { this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad") },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) this.isScrollToTopVisible = true
      else this.isScrollToTopVisible = false
    },
    initFilters() {
      let newFilters
      if (this.tabId === 'default' || this.tab.filters === undefined) {
        newFilters = _.cloneDeep(this.meta.filters) || []
        this.$store.state.Meta.sortBy = this.meta.sortBy || 'name'
        this.$store.state.Meta.sortDirection = this.meta.sortDirection || 'asc'
        this.$store.state.Meta.page = this.meta.page || 1
      } else {
        newFilters = _.cloneDeep(this.tab.filters)
        this.$store.state.Meta.sortBy = this.tab.sortBy
        this.$store.state.Meta.sortDirection = this.tab.sortDirection
        this.$store.state.Meta.page = this.tab.page
      }
      this.$store.state.Meta.filters = newFilters
      this.$store.dispatch('filterMetaCards') 
    },
    removeAllFilters() {
      this.$store.getters.meta.find({id:this.meta.id}).set('filters', []).write()
      this.initFilters()
    },
  },
  watch: {
    // $route(newRoute) { if (this.$route.path.includes('/meta/')) this.initFilters() },
  }
}
</script>