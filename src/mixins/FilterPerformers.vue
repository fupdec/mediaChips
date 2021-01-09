<script>
const fs = require("fs")
const path = require("path")
import CountryFlag from 'vue-country-flag'
import Countries from '@/mixins/Countries'

export default {
  components: {
    CountryFlag,
	},
  mixins: [Countries], 
  mounted () {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    itemId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    isPerformerPage() {
      return this.$route.path.includes('/performer/:')  
    },
    isTagPage() {
      return this.$route.path.includes('/tag/:')  
    },
    isWebsitePage() {
      return this.$route.path.includes('/website/:')  
    },
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('performer')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    getItem(itemType) {
      return this.$store.getters[itemType].find({ id: this.itemId }).value()    
    },
    getImgTagsUrl(tagId) {
      let imgTag = path.join(this.$store.getters.getPathToUserData, `/media/tags/${tagId}_.jpg`)
      let imgChecked = this.checkImageExist(imgTag)
      if (imgChecked) {
        return imgChecked + '?lastmod='+Date.now()
      } else {
        return path.join(this.$store.getters.getPathToUserData, '/img/templates/tag.png') + '?lastmod='+Date.now()
      }
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return false
      }
    },
    updateFiltersOfPerformersTab() {
      let newFilters = _.cloneDeep(this.$store.state.Performers.filters)
      if (this.tabId === 'default') {
        this.$store.state.Performers.filtersReserved = newFilters
      } else if (this.$route.path.includes('/tag/:')) {
        let newFilters = _.cloneDeep(this.$store.state.Performers.filters)
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters').assign({performers: newFilters}).write()
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.performersFilters,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    resetAllFilters(event) {
      this.$store.commit('resetFilteredPerformers')
      if (this.isPerformerPage) {
        let item = this.getItem('performers')
        this.updateFiltersOfPerformers('performers', [item.name])
      } else if (this.isTagPage) {
        let item = this.getItem('tags')
        this.updateFiltersOfPerformers('tags', [item.name])
      } else if (this.isWebsitePage) {
        let item = this.getItem('websites')
        this.updateFiltersOfPerformers('websites', [item.name])
      } else {
        this.updateFiltersOfPerformersTab()
      }
      this.$store.dispatch('filterPerformers')
    },
    applyAllFilters() {
      this.$store.dispatch('filterPerformers')
      this.updateFiltersOfPerformersTab()
    },
    remove(item, array) { 
      const index = this[array].indexOf(item);
      if (index >= 0) this[array].splice(index, 1);
    },
    sort(items) {
      this[items] = this[items].sort((a, b) => a.localeCompare(b))
    },
  },
}
</script>


<style lang="less">
.nation-chips {
  .v-chip {
    padding-right: 3px;
    padding-left: 0;
  }
  .flag {
    margin: -10px;
  }
}
</style>