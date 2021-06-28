<script>
const fs = require("fs")
const path = require("path")
import CountryFlag from 'vue-country-flag'
import Countries from '@/components/elements/Countries'

export default {
  components: {
    CountryFlag,
	},
  mixins: [], 
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
    isWebsitePage() {
      return this.$route.path.includes('/website/:')  
    },
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.type.includes('performer')))
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
        return imgChecked
      } else {
        return path.join(this.$store.getters.getPathToUserData, '/img/templates/tag.png')
      }
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return false
      }
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