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
  </vuescroll>
</template>


<script>
import MetaCard from "@/components/pages/meta/MetaCard.vue"
import vuescroll from 'vuescroll'

export default {
  name: "MetaPage",
  components: {
    MetaCard,
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
    })
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