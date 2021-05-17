<template>
  <v-lazy :width="cardSize">
    <v-card @mousedown="stopSmoothScroll($event)" height="100%"
      :data-id="card.id" class="meta-card" outlined hover :key="cardKey"
      v-ripple="{class:'accent--text'}" :class="{favorite: favorite}">
      <div v-if="meta.settings.images" class="img-container">
        <div v-if="meta.settings.chipColor" class="meta-color" :style="`border-color: ${getColor(metaId,card.id)} transparent transparent transparent;`"/>
        <v-img :src="imgMain" :aspect-ratio="meta.settings.imageAspectRatio" :class="{show:!isAltImgExist}" position="top" class="main-img"/>
        <v-img v-if="isAltImgExist" :src="imgAlt" :aspect-ratio="meta.settings.imageAspectRatio" position="top" class="secondary-img"/> 
        <div v-if="isCustom1ImgExist" class="custom1-img-button">1</div> <v-img v-if="isCustom1ImgExist" :src="imgCustom1" class="custom1-img"/>
        <div v-if="isCustom2ImgExist" class="custom2-img-button">2</div> <v-img v-if="isCustom2ImgExist" :src="imgCustom2" class="custom2-img"/>
        <v-btn v-if="meta.settings.favorite" @click="toggleFavorite" icon absolute :color="favorite?'pink':'white'" class="fav-btn"> <v-icon :color="favorite?'pink':'grey'">mdi-heart-outline</v-icon> </v-btn>
        <div v-if="meta.settings.rating" class="rating-wrapper"> <v-rating :value="rating" @input="changeRating($event)" dense half-increments hover clearable size="18" color="yellow darken-2" background-color="grey darken-1" empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"/> </div>
      </div>
      <v-divider v-show="meta.settings.images"/>

      <div class="px-1">{{card.meta.name}}</div>
      <div v-if="meta.settings.synonyms" class="px-1 caption"> 
        <span v-if="card.meta.synonyms" class="mx-2">a.k.a.</span> 
        {{card.meta.synonyms===undefined? '' : card.meta.synonyms.join(', ')}}
      </div>
      
      <!-- Parse meta from cards -->
      <div v-for="(m,i) in metaInCard" :key="i" class="d-flex px-1">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" class="mr-2">mdi-{{getMeta(m.id,m.type).settings.icon}}</v-icon>
          </template>
          <span>{{getMeta(m.id,m.type).settings.name}}</span>
        </v-tooltip>
        <v-chip-group v-if="m.type=='complex'" column>
          <v-chip v-for="c in card.meta[m.id]" :key="c" :color="getColor(m.id,c)"
            @mouseover.stop="showImage($event,c,'meta',m.id)" 
            @mouseleave.stop="$store.state.hoveredImage=false"> 
              {{ getCard(m.id,c).meta.name }} </v-chip>
        </v-chip-group>
        <div v-else-if="m.type=='simple'">
          <span v-if="getMeta(m.id,m.type).type=='array'">{{getArrayValues(m.id)}}</span>
          <span v-else-if="getMeta(m.id,m.type).type=='boolean'">{{card.meta[m.id]?'Yes':'No'}}</span>
          <span v-else>{{card.meta[m.id]}}</span>
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

export default {
  name: "MetaCard",
  props: {
    card: Object,
  },
  mixins: [ShowImageFunction],
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
    metaId() { return this.$route.query.metaId },
    meta() { return this.$store.getters.meta.find({id: this.metaId}).value() },
    cardSize() { return `calc(${100 / this.meta.settings.cardSize}% - 20px)` },
    updateCardIds() { return this.$store.state.Meta.updateCardIds },
    metaInCard() { return this.meta.settings.metaInCard },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    isAltImgExist() { return this.meta.settings.imageTypes.includes('alt') && !this.imgAlt.includes('not_exist') },
    isCustom1ImgExist() { return this.meta.settings.imageTypes.includes('custom1') && !this.imgCustom1.includes('not_exist') },
    isCustom2ImgExist() { return this.meta.settings.imageTypes.includes('custom2') && !this.imgCustom2.includes('not_exist') },
  },
  methods: {
    stopSmoothScroll(event) {
      if (event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    getColor(metaId, cardId) {
      if (!this.getMeta(metaId, 'complex').settings.chipColor) return ''
      else return this.getCard(metaId,cardId).meta.color || '#777'
    },
    getMeta(id, type) {
      if (type == 'complex') return this.$store.getters.meta.find({id}).value()
      else return this.$store.getters.simpleMeta.find({id}).value()
    },
    getCard(metaId, cardId) { return this.$store.getters.metaCards.get(metaId).find({id:cardId}).value() },
    getArrayValues(metaId) { 
      let array = this.card.meta[metaId]
      if (array === undefined) return ''
      let items = this.getMeta(metaId,'simple').settings.items
      let values = array.map(itemId=>(_.find(items, {id: itemId}).name))
      return values.join(', ') 
    },
    // image 
    getImgUrl(type) {
      console.log()
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
      this.$store.getters.metaCards.get(this.metaId).find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({favorite:this.favorite}).write()
    },
    changeRating(stars) {
      this.$store.getters.metaCards.get(this.metaId).find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({rating:stars}).write()
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