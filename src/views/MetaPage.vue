<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div class="headline text-h3 d-flex align-center justify-center py-6">
      <v-icon x-large left>mdi-{{meta.settings.icon}}</v-icon> {{meta.settings.name}}
    </div>

    <v-container fluid class="meta-grid">
      <MetaCard v-for="(metaCard, i) in metaCardsOnPage" :key="i" :metaCard="metaCard"/>
    </v-container>
    <div v-if="metaCardsOnPage.length==0" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      Empty
    </div>

    <DialogEditMetaCard v-if="$store.state.Meta.dialogEditMetaCard"/>
  </vuescroll>
</template>


<script>
import MetaCard from '@/components/pages/meta/MetaCard.vue'
import vuescroll from 'vuescroll'
import Selection from '@simonwep/selection-js'

export default {
  name: "MetaPage",
  components: {
    MetaCard,
    vuescroll,
    DialogEditMetaCard: () => import('@/components/pages/meta/DialogEditMetaCard.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
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
    metaId() {
      return this.$route.query.metaId
    },
    meta() {
      return this.$store.getters.meta.find({id: this.metaId}).value()
    },
    metaList() {
      return this.$store.getters.meta.value()
    },
    metaCardsOnPage() {
      return this.$store.getters.metaCardsOnPage
    },
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
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    initFilters() {
      this.$store.dispatch('filterMetaCards', { metaId: this.meta.id })
    },
  },
  watch: {
    $route(newRoute) {
      if (!this.$route.path.includes('/meta/')) return
      this.initFilters()
    },
  }
}
</script>