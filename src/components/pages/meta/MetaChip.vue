<template>
  <v-lazy>
    <v-chip @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu" 
      :data-id="card.id" class="meta-card" :key="cardKey" 
      :color="card.meta.color || '#777777'"
      :label="meta.settings.chipLabel"
      :outlined="meta.settings.chipOutlined"
      @mouseover.stop="showImage($event, card.id, 'meta', meta.id)" 
      @mouseleave.stop="$store.state.hoveredImage=false"
    >
      <v-avatar> <img :src="imgMain" /> </v-avatar>
      <div class="ml-2">{{card.meta.name}}</div>
    </v-chip>
  </v-lazy>
</template>


<script>
const fs = require("fs")
const path = require("path")

import ShowImageFunction from '@/mixins/ShowImageFunction'
import MetaGetters from '@/mixins/MetaGetters'
import CountryFlag from 'vue-country-flag'
import Countries from '@/components/elements/Countries'

export default {
  name: "MetaCard",
  props: {
    card: Object,
  },
  components: { CountryFlag, },
  mixins: [ShowImageFunction, MetaGetters],
  mounted() {
    this.$nextTick(function () {
      this.cardKey = this.card.id
      this.imgMain = this.getImgUrl('main')
      this.imgAlt = this.getImgUrl('alt')
      this.imgCustom1 = this.getImgUrl('custom1')
      this.imgCustom2 = this.getImgUrl('custom2')
      this.favorite = this.card.meta.favorite || false
      this.rating = this.card.meta.rating || 0
    })
  },
  data: () => ({
    cardKey: '',
    imgMain: '',
    imgAlt: '',
    imgCustom1: '',
    imgCustom2: '',
    favorite: false,
    rating: 0,
  }),
  computed: {
    visibility() { return this.$store.state.Meta.visibility },
    updateCardIds() { return this.$store.state.Meta.updateCardIds },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    isAltImgExist() { return this.meta.settings.imageTypes.includes('alt') && !this.imgAlt.includes('not_exist') },
    isCustom1ImgExist() { return this.meta.settings.imageTypes.includes('custom1') && !this.imgCustom1.includes('not_exist') },
    isCustom2ImgExist() { return this.meta.settings.imageTypes.includes('custom2') && !this.imgCustom2.includes('not_exist') },
    isSelectedSingleMetaCard() { return this.$store.state.Meta.selectedMeta.length == 1 },
  },
  methods: {
    stopSmoothScroll(event) { if (event.button != 1) return; event.preventDefault(); event.stopPropagation() },
    openMetaCardPage() { this.$router.push(`/metacard/?metaId=${this.meta.id}&cardId=${this.card.id}&tabId=default`) },
    // image 
    getImgUrl(type) {
      let img = path.join(this.pathToUserData, '/media/meta/', `${this.metaId}/${this.card.id}_${type}.jpg`)
      return path.join('file://', this.checkImageExist(img, type)) 
    },
    checkImageExist(imgPath, type) {
      if (fs.existsSync(imgPath)) return imgPath
      else if (type=='alt' || type=='custom1' || type=='custom2') return 'not_exist'
      else return path.join(this.pathToUserData, '/img/templates/tag.png')
    },
    toggleFavorite() {
      this.favorite = !this.favorite
      this.$store.getters.metaCards.find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({favorite:this.favorite}).write()
    },
    changeRating(stars) {
      this.$store.getters.metaCards.find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({rating:stars}).write()
    },
    findCountryCode(country) {
      if (country == '') return ''
      let countryName = country.toLowerCase()
      let code = _.filter(Countries, country => (country.name.toLowerCase().includes(countryName)) )[0]
      if (code === undefined) return ''
      else return code.code
    },
    showContextMenu(e) {
      e.preventDefault()
      setTimeout(() => {
        this.$store.state.x = e.clientX
        this.$store.state.y = e.clientY
        this.$store.state.contextMenuContent = [
          { name: `Edit ${this.meta.settings.nameSingular}`, type: 'item', icon: 'pencil', function: ()=>{this.$store.state.Meta.dialogEditMetaCard=true}, },
          { name: `Edit Images of ${this.meta.settings.nameSingular}`, type: 'item', icon: 'image-edit', function: ()=>{this.$store.state.Meta.dialogEditMetaCardImages=true}, disabled: !this.isSelectedSingleMetaCard },
          { type: 'divider' },
          { name: `Delete ${this.meta.settings.nameSingular}`, type: 'item', icon: 'delete', color: 'red', function: ()=>{this.$store.state.Meta.dialogDeleteMetaCard=true} },
        ]
        this.$store.state.contextMenu = true
      }, 300)
    },
    asj() {
      console.log(this.findCountryCode('Germany'))
    }, 
  },
  watch: {
    updateCardIds(newValue) {
      if (newValue.length === 0) this.cardKey = this.card.id + Date.now()
      if (newValue.includes(this.card.id)) {
        this.cardKey = this.card.id + Date.now() 
        setTimeout(() => {
          this.imgMain = this.getImgUrl('main')
          this.imgAlt = this.getImgUrl('alt')
          this.imgCustom1 = this.getImgUrl('custom1')
          this.imgCustom2 = this.getImgUrl('custom2')
        }, 100)
      } 
    },
  },
}
</script>