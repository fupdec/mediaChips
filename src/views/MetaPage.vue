<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <v-toolbar dense>
      <v-spacer></v-spacer>
      <v-btn-toggle v-model="chars" group multiple color="primary">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn icon small class="ma-0" :value="27" v-on="on">#</v-btn>
          </template>
          <span>Symbol</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn icon small class="ma-0" :value="0" v-on="on">0-9</v-btn>
          </template>
          <span>Number</span>
        </v-tooltip>
        <v-btn v-for="(char,i) in alphabet" :key="i" icon small class="ma-0" :value="i+1">
          {{char}}
        </v-btn>
      </v-btn-toggle>
      <v-tooltip bottom v-if="chars.length">
        <template v-slot:activator="{ on }">
          <v-btn @click="clearChars" icon small tile class="ml-2" v-on="on">
            <v-icon size="20">mdi-alphabetical-variant-off</v-icon>
          </v-btn>
        </template>
        <span>Clear all characters</span>
      </v-tooltip>
      <v-spacer></v-spacer>
    </v-toolbar>

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

      <Loading />

      <v-container :key="$store.state.Meta.updateKey" fluid class="card-grid" :class="[cardSize, gapSize, {'wide-image':isWideImage}]">
        <MetaCard v-for="card in metaCardsOnPage" :key="card.id" :card="card"/>
      </v-container>
      
      <v-pagination v-model="currentPage" :length="pagesSum" :total-visible="getNumberOfPagesLimit" class="my-4"/>
    </div>
    
    <div v-else-if="metaCardsNumber==0" class="text-center">
      <div><v-icon size="100" class="ma-10">mdi-{{meta.settings.icon}}</v-icon></div>
      It's so empty... maybe add some {{meta.settings.name.toLowerCase()}}
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-icon v-on="on">mdi-help-circle-outline</v-icon>
        </template>
        <span>Click on the icon <v-icon dark small>mdi-plus</v-icon>
          <v-icon dark>mdi-{{meta.settings.icon}}</v-icon> in the upper left corner, on appbar</span>
      </v-tooltip>
    </div>
    
    <div v-else class="text-center"> 
      <!-- TODO replace the icon with a nice .svg image -->
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching {{meta.settings.name.toLowerCase()}} for the selected filters
    </div>
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-10"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    
    <div v-if="$store.state.Meta.dialogEditMetaCard">
      <DialogEditSingleMetaCard v-if="selectedMeta.length==1"/>
      <DialogEditMultipleMetaCards v-if="selectedMeta.length>1"/>
    </div>
    <DialogEditMetaCardImages v-if="$store.state.Meta.dialogEditMetaCardImages"/>
    
    <v-dialog v-if="$store.state.Meta.dialogDeleteMetaCard" v-model="$store.state.Meta.dialogDeleteMetaCard" persistent scrollable max-width="600">
      <v-card>
        <v-toolbar color="error">
          <span class="headline">Are you sure?</span>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.Meta.dialogDeleteMetaCard=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteMetaCard" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div> You want to delete {{meta.settings.name.toLowerCase()}} ({{selectedMeta.length}}): </div>
            <div v-for="(m,i) in selectedMeta" :key="i">{{i+1}}) {{getCard(m).meta.name}}</div>
          </v-card-text>
        </vuescroll>
        <!-- <v-card-actions class="mx-4">
          <v-checkbox v-model="deleteVideos" color="red" hide-details class="mr-6"> 
            <template v-slot:label>
              <span class="red--text">Delete videos with this performer from database</span>
            </template>
          </v-checkbox>
          <v-spacer></v-spacer>
          <v-checkbox v-model="$store.state.Videos.deleteFile" color="red" hide-details 
            :disabled="!deleteVideos"> 
            <template v-slot:label>
              <span class="red--text">Also delete files</span>
            </template>
          </v-checkbox>
        </v-card-actions> -->
      </v-card>
    </v-dialog>
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
    DialogEditSingleMetaCard: () => import('@/components/pages/meta/DialogEditSingleMetaCard.vue'),
    DialogEditMultipleMetaCards: () => import('@/components/pages/meta/DialogEditMultipleMetaCards.vue'),
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
    this.$store.state.Meta.selectedMeta = []
    this.$store.state.Meta.selection.destroy()
  },
  data: () => ({
    alphabet: [
      'a','b','c','d','e','f','g','h','i','j','k','l','m','n',
      'o','p','q','r','s','t','u','v','w','x','y','z'
    ],
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
      set(number) { 
        this.$store.state.Meta.page = number 
        this.$store.dispatch('saveStateOfMeta') 
      },
    },
    chars: {
      get () { return this.$store.state.Meta.firstChar },
      set (value) {
        this.$store.state.Meta.firstChar = value
        this.$store.dispatch('filterMetaCards')
      },
    },
    metaCardsNumber() { return this.$store.getters.metaCards.filter({metaId:this.meta.id}).value().length },
    metaCardsOnPage() { return this.$store.getters.metaCardsOnPage },
    cardSize() { return `card-size-${this.meta.state.cardSize || 1}` },
    gapSize() { return `gap-size-${this.$store.state.Settings.gapSize}` },
    isWideImage() { return this.meta.settings.imageAspectRatio > 1 },
    filteredMeta() { return this.$store.state.Meta.filteredMeta },
    filters() { return this.$store.state.Meta.filters },
    selectedMeta() { return this.$store.state.Meta.selectedMeta },
    updateKey() { return this.$store.state.Meta.updateKey },
  },
  methods: {
    initSelection() {
      this.$store.state.Meta.selection = new Selection({
        boundaries: ['.card-grid'],
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
        newFilters = _.cloneDeep(this.meta.state.filters) || []
        this.$store.state.Meta.sortBy = this.meta.state.sortBy || 'name'
        this.$store.state.Meta.sortDirection = this.meta.state.sortDirection || 'asc'
        this.$store.state.Meta.page = this.meta.state.page || 1
        this.$store.state.Meta.firstChar = this.meta.state.firstChar || []
      } else {
        newFilters = _.cloneDeep(this.tab.filters)
        this.$store.state.Meta.sortBy = this.tab.sortBy
        this.$store.state.Meta.sortDirection = this.tab.sortDirection
        this.$store.state.Meta.page = this.tab.page
        this.$store.state.Meta.firstChar = this.tab.firstChar || []
      }
      this.$store.state.Meta.filters = newFilters
      this.$store.dispatch('filterMetaCards') 
    },
    removeAllFilters() {
      this.$store.state.Meta.filters = []
      this.$store.dispatch('filterMetaCards')
    },
    clearChars() {
      this.$store.state.Meta.firstChar = []
      this.$store.dispatch('filterMetaCards')
    },
    deleteMetaCard() { this.$store.dispatch('deleteMetaCard') },
  },
  watch: {
  }
}
</script>