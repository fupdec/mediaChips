<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu" height="100%"
      :data-id="card.id" class="meta-card" outlined hover :key="cardKey"
      v-ripple="{class:'accent--text'}" :class="{favorite: meta.settings.favorite?favorite:false}">
      <div v-if="meta.settings.images" class="img-container">
        <div v-if="meta.settings.color && visibility.color" class="meta-color" :style="`border-color: ${getColor(metaId,card.id)} transparent transparent transparent;`"/>
        <div v-if="meta.settings.country && visibility.country" class="country"> <div v-for="c in card.meta.country" :key="c" class="flag-icon"> <country-flag :country='findCountryCode(c)' size='normal' :title="c"/> </div> </div>
        <v-img :src="imgMain" :aspect-ratio="meta.settings.imageAspectRatio" :class="{show:!isAltImgExist}" position="top" class="main-img"/>
        <v-img v-if="isAltImgExist" :src="imgAlt" :aspect-ratio="meta.settings.imageAspectRatio" position="top" class="secondary-img"/> 
        <div v-if="isCustom1ImgExist" class="custom1-img-button">1</div> <v-img v-if="isCustom1ImgExist" :src="imgCustom1" class="custom1-img"/>
        <div v-if="isCustom2ImgExist" class="custom2-img-button">2</div> <v-img v-if="isCustom2ImgExist" :src="imgCustom2" class="custom2-img"/>
        <v-btn v-if="meta.settings.favorite && visibility.favorite" @click="toggleFavorite" icon absolute :color="favorite?'pink':'white'" class="fav-btn"> <v-icon :color="favorite?'pink':'grey'">mdi-heart-outline</v-icon> </v-btn>
        <div v-if="meta.settings.rating && visibility.rating" class="rating-wrapper"> <v-rating :value="rating" @input="changeRating($event)" dense half-increments hover clearable size="18" color="yellow darken-2" background-color="grey darken-1" empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"/> </div>
      </div>
      <!-- <div v-else class="d-flex flex-column align-center py-1">
        <v-icon>mdi-{{meta.settings.icon}}</v-icon>
        <span>Open {{meta.settings.nameSingular}} page</span>
      </div> -->
      <v-divider/>

      <div v-if="visibility.name" class="px-1">{{card.meta.name}}</div>
      <div v-if="meta.settings.synonyms && visibility.synonyms" class="px-1 caption synonyms"> {{card.meta.synonyms===undefined? '' : card.meta.synonyms.join(', ')}} </div>
      
      <!-- Parse meta from cards -->
      <div v-for="(m,i) in metaInCard" :key="i">
        <div v-if="visibility[m.id]" class="d-flex px-1"> 
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <v-icon v-on="on" class="mr-2">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
            </template>
            <span>{{getMeta(m.id).settings.name}}</span>
          </v-tooltip>
          <v-chip-group v-if="m.type=='complex'" column>
            <v-chip v-for="c in card.meta[m.id]" :key="c" 
              :color="getColor(m.id,c)" 
              :label="getMeta(m.id).settings.chipLabel"
              :outlined="getMeta(m.id).settings.chipOutlined"
              @mouseover.stop="showImage($event,c,'meta',m.id)" 
              @mouseleave.stop="$store.state.hoveredImage=false"> 
                {{ getCard(c).meta.name }} </v-chip>
          </v-chip-group>
          <div v-else-if="m.type=='simple'">
            <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id)}}</span>
            <span v-else-if="getMeta(m.id).dataType=='boolean'">{{card.meta[m.id]?'Yes':'No'}}</span>
            <span v-else>{{card.meta[m.id]}}</span>
          </div>
        </div>
      </div>

      <v-btn @click="$store.state.Meta.dialogEditMetaCard=true" color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
      <v-btn v-if="meta.settings.images" @click="$store.state.Meta.dialogEditMetaCardImages=true" color="secondary" fab x-small class="btn-edit-images"> <v-icon>mdi-image-edit-outline</v-icon> </v-btn>
    </v-card>
  </v-lazy>
</template>


<script>
const fs = require("fs")
const path = require("path")

import ShowImageFunction from '@/mixins/ShowImageFunction'
import MetaGetters from '@/mixins/MetaGetters'
import CountryFlag from 'vue-country-flag'
import Countries from '@/mixins/Countries'

export default {
  name: "MetaCard",
  props: {
    card: Object,
  },
  components: { CountryFlag, },
  mixins: [ShowImageFunction, MetaGetters, Countries],
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
      let code = _.filter(this.countries, country => (country.name.toLowerCase().includes(countryName)) )[0]
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