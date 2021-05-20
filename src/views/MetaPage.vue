<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div class="headline text-h3 d-flex align-center justify-center py-6">
      <v-icon x-large left>mdi-{{meta.settings.icon}}</v-icon> {{meta.settings.name}}
      <span class="text-h5 ml-2">({{metaCardsOnPage.length}})</span>
    </div>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start py-0">
      <FiltersChips :filters="filters" type="Meta" @removeAllFilters="removeAllFilters"/>
    </v-container>

    <v-container fluid class="meta-grid">
      <MetaCard v-for="card in metaCardsOnPage" :key="card.id" :card="card"/>
    </v-container>
    <div v-if="metaCardsOnPage.length==0" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      Empty
    </div>

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
    isScrollToTopVisible: false,
  }),
  computed: {
    metaCardsOnPage() { return this.$store.getters.metaCardsOnPage },
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