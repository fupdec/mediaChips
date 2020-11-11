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
    boobsItems: ['Real','Fake','Unknown'],
  }),
  computed: {
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('performer')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
  },
  methods: {
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
    resetAllFilters() {
      this.$store.state.Performers.dialogFilterPerformers = false
      this.$store.commit('resetFilteredPerformers')
      this.$store.dispatch('filterPerformers')
      this.isSortedByName = false
      this.isSortedByRating = false
      this.isSortedByDate = false
      this.sortButtons = 0
    },
    applyAllFilters() {
      this.$store.state.Performers.dialogFilterPerformers = false
      this.$store.dispatch('filterPerformers')
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