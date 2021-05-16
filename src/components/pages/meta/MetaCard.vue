<template>
  <v-lazy :width="cardSize">
    <v-card @mousedown="stopSmoothScroll($event)" height="100%"
      :data-id="card.id" class="meta-card" outlined hover :key="cardKey"
      v-ripple="{class:'accent--text'}" :class="{favorite: favorite}">
      <div v-if="meta.settings.images" class="img-container">
        <v-img :src="imgMain" :aspect-ratio="meta.settings.imageAspectRatio" :class="{show:!isAltImgExist}" position="top" class="main-img"/>
        <v-img v-if="isAltImgExist" :src="imgAlt" :aspect-ratio="meta.settings.imageAspectRatio" position="top" class="secondary-img"/> 
        <div v-if="isCustom1ImgExist" class="custom1-img-button">1</div> <v-img v-if="isCustom1ImgExist" :src="imgCustom1" class="custom1-img"/>
        <div v-if="isCustom2ImgExist" class="custom2-img-button">2</div> <v-img v-if="isCustom2ImgExist" :src="imgCustom2" class="custom2-img"/>
        <v-btn v-if="meta.settings.favorite" @click="toggleFavorite" icon absolute :color="favorite?'pink':'white'" class="fav-btn"> <v-icon :color="favorite?'pink':'grey'">mdi-heart-outline</v-icon> </v-btn>
        <div v-if="meta.settings.rating" class="rating-wrapper"> <v-rating :value="rating" @input="changeRating($event)" dense half-increments hover clearable size="18" color="yellow darken-2" background-color="grey darken-1" empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"/> </div>
      </div>
      <v-divider v-show="meta.settings.images"/>

      <div class="px-1">{{card.meta.name}}</div>
      <div v-if="meta.settings.synonyms" class="px-1">{{card.meta.name}}</div>
      <div v-for="(m,i) in metaInCard" :key="i">
        <v-icon>mdi-{{getMeta(m.id,m.type).settings.icon}}</v-icon> {{getMeta(m.id,m.type).settings.name}}
      </div>

      <v-btn @click="$store.state.Meta.dialogEditMetaCard=true" color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
      <v-btn v-if="meta.settings.images" @click="$store.state.Meta.dialogEditMetaCardImages=true" color="secondary" fab x-small class="btn-edit-images"> <v-icon>mdi-image-edit-outline</v-icon> </v-btn>
    </v-card>
  </v-lazy>
</template>


<script>
const fs = require("fs")
const path = require("path")

export default {
  name: "MetaCard",
  props: {
    card: Object,
  },
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
    getMeta(id, type) {
      if (type == 'complex') return this.$store.getters.meta.find({id}).value()
      else return this.$store.getters.simpleMeta.find({id}).value()
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