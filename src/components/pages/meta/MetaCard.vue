<template>
  <v-lazy :key="cardKey" :data-id="card.id" class="select-item" :class="{'rounded':!meta.settings.chipLabel&&view==1}">
    <v-card v-if="view==0" outlined hover :data-id="card.id" class="meta-card" 
      @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu" v-ripple="{class:'accent--text'}" 
      :class="{favorite: meta.settings.favorite?favorite:false, 'icons-in-card':ratingAndFavoriteInCard}">
      <div class="img-container">
        <v-icon v-if="meta.settings.color && visibility.color" class="meta-color" :color="card.meta.color || '#777777'">mdi-circle</v-icon>
        <div v-if="meta.settings.country && visibility.country" @click="filterByCountry" @click.middle="filterByCountryInNewTab" class="country"> <div v-for="c in card.meta.country" :key="c" class="flag-icon"> <country-flag :country='findCountryCode(c)' size='normal' :title="c"/> </div> </div>
        <v-img :src="imgMain" :aspect-ratio="meta.settings.imageAspectRatio" :class="{show:!isAltImgExist}" position="top" class="main-img" @click="openMetaCardPage" @click.middle="addNewTabMetaCard" :title="isMetaAssignedToVideo?`Open ${meta.settings.nameSingular.toLowerCase()} page`:''" />
        <v-img v-if="isAltImgExist" :src="imgAlt" :aspect-ratio="meta.settings.imageAspectRatio" position="top" class="secondary-img" @click="openMetaCardPage" @click.middle="addNewTabMetaCard" :title="isMetaAssignedToVideo?`Open ${meta.settings.nameSingular.toLowerCase()} page`:''" /> 
        <div v-if="isCustom1ImgExist" class="custom1-img-button">1</div> <v-img v-if="isCustom1ImgExist" :src="imgCustom1" class="custom1-img" @click="openMetaCardPage" @click.middle="addNewTabMetaCard" :title="isMetaAssignedToVideo?`Open ${meta.settings.nameSingular.toLowerCase()} page`:''" />
        <div v-if="isCustom2ImgExist" class="custom2-img-button">2</div> <v-img v-if="isCustom2ImgExist" :src="imgCustom2" class="custom2-img" @click="openMetaCardPage" @click.middle="addNewTabMetaCard" :title="isMetaAssignedToVideo?`Open ${meta.settings.nameSingular.toLowerCase()} page`:''" />
        <v-btn v-if="meta.settings.favorite && visibility.favorite && !ratingAndFavoriteInCard" @click="toggleFavorite" icon absolute :color="favorite?'pink':'white'" class="fav-btn"> <v-icon :color="favorite?'pink':'grey'">mdi-heart-outline</v-icon> </v-btn>
        <div v-if="meta.settings.rating && visibility.rating && !ratingAndFavoriteInCard" class="rating-wrapper"> <v-rating :value="rating" @input="changeRating($event)" dense half-increments hover clearable color="yellow darken-2" background-color="grey" empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"/> </div>
        <v-icon v-if="meta.settings.bookmark && visibility.bookmark && card.meta.bookmark" class="bookmark" color="red" :title="card.meta.bookmark">mdi-bookmark</v-icon>
      </div>
      <v-divider/>

      <div v-if="visibility.name" class="px-1 name">{{card.meta.name}} <span v-if="isMetaAssignedToVideo">({{card.videos||0}})</span></div>
      <div v-if="meta.settings.synonyms && visibility.synonyms && card.meta.synonyms && card.meta.synonyms.length" class="px-1 synonyms"> <span class="pl-2"/> {{card.meta.synonyms.join(', ')}} </div>
      
      <v-card-actions v-if="ratingAndFavoriteInCard" class="px-1 py-0">
        <v-rating v-if="meta.settings.rating && visibility.rating" 
          :value="rating" @input="changeRating($event)"
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover clearable />
        <v-btn v-if="meta.settings.favorite && visibility.favorite"
          @click="toggleFavorite" icon color="pink" x-small class="fav-in-card ml-4"> 
          <v-icon v-if="favorite" color="pink">mdi-heart</v-icon>
          <v-icon v-else color="grey">mdi-heart-outline</v-icon>
        </v-btn>
      </v-card-actions>

      <div v-if="meta.settings.career && visibility.career" class="meta-in-card">
        <v-icon title="Career status">mdi-list-status</v-icon>
        <v-chip :color="getCareer('color')" label light>{{getCareer('status')}}</v-chip>
        <span class="ml-1">{{getCareer('ended')}}</span>
      </div>

      <!-- Parse meta from cards -->
      <div v-for="(m,i) in metaInCard" :key="i">
        <div v-if="visibility[m.id]&&checkShowEmptyValue(m)" class="meta-in-card">
          <v-chip-group v-if="m.type=='complex'" column>
            <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
            <v-chip v-for="c in card.meta[m.id]" :key="c" 
              :color="getColor(m.id,c)" 
              :label="getMeta(m.id).settings.chipLabel"
              :outlined="getMeta(m.id).settings.chipOutlined"
              :title="`Filter ${meta.settings.name.toLowerCase()} by ${getMeta(m.id).settings.nameSingular.toLowerCase()}`"
              @click="filterMetaCardsBy(m.id,c)"
              @click.middle="filterMetaCardsByInNewTab(m.id,c)"
              @mouseover.stop="showImage($event,c,'meta',m.id)" 
              @mouseleave.stop="$store.state.hoveredImage=false"> 
                {{ getCard(c).meta.name }} </v-chip>
          </v-chip-group>
          <div v-else-if="m.type=='simple'" class="simple-meta">
            <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
            <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id)}}</span>
            <span v-else-if="getMeta(m.id).dataType=='rating'">      
              <v-rating :value="card.meta[m.id]" @input="changeMetaRating($event, m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable
                :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
            </span>
            <span v-else-if="getMeta(m.id).dataType=='boolean'">{{card.meta[m.id]?'Yes':'No'}}</span>
            <span v-else-if="getMeta(m.id).dataType=='string'&&getMeta(m.id).settings.isLink" @click="openLink(card.meta[m.id])" class="link" title="Open link in browser">{{card.meta[m.id]}}</span>
            <span v-else-if="m.scraperField=='birthday'">{{card.meta[m.id]}}{{getAge(card.meta[m.id])}}</span>
            <span v-else>{{card.meta[m.id]}}</span>
          </div>
        </div>
      </div>

      <v-btn @click="$store.state.Meta.dialogEditMetaCard=true" color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
      <v-btn @click="$store.state.Meta.dialogEditMetaCardImages=true" color="secondary" fab x-small class="btn-edit-images"> <v-icon>mdi-image-edit-outline</v-icon> </v-btn>
    </v-card>
    
    <v-chip v-else-if="view==1" 
      @mousedown="stopSmoothScroll($event)" 
      @contextmenu="showContextMenu" 
      class="meta-chip" 
      :color="card.meta.color || '#777777'"
      :label="meta.settings.chipLabel"
      :outlined="meta.settings.chipOutlined"
      @mouseover.stop="showImage($event, card.id, 'meta', meta.id)" 
      @mouseleave.stop="$store.state.hoveredImage=false"
    >
      <v-avatar @click="openMetaCardPage" @click.middle="addNewTabMetaCard" :title="isMetaAssignedToVideo?`Open ${meta.settings.nameSingular.toLowerCase()} page`:''"> 
        <v-img :src="imgMain" position="top"/> 
      </v-avatar>
      <div class="ml-2">{{card.meta.name}}</div>
    </v-chip>
  </v-lazy>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shell = require('electron').shell

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
  updated() {
    this.imgMain = this.getImgUrl('main')
    this.imgAlt = this.getImgUrl('alt')
    this.imgCustom1 = this.getImgUrl('custom1')
    this.imgCustom2 = this.getImgUrl('custom2')
    this.favorite = this.card.meta.favorite || false
    this.rating = this.card.meta.rating || 0
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
    view() { return this.$store.state.Meta.view || 0 },
    visibility() { return this.$store.state.Meta.visibility },
    updateCardIds() { return this.$store.state.Meta.updateCardIds },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    isAltImgExist() { return this.meta.settings.imageTypes.includes('alt') && !this.imgAlt.includes('not_exist') },
    isCustom1ImgExist() { return this.meta.settings.imageTypes.includes('custom1') && !this.imgCustom1.includes('not_exist') },
    isCustom2ImgExist() { return this.meta.settings.imageTypes.includes('custom2') && !this.imgCustom2.includes('not_exist') },
    isSelectedSingleMetaCard() { return this.$store.state.Meta.selectedMeta.length == 1 },
    isMetaAssignedToVideo() { return _.find(this.$store.state.Settings.metaAssignedToVideos, {id:this.meta.id}) !== undefined },
    showEmptyMetaValueInCard() { return this.$store.state.Settings.showEmptyMetaValueInCard },
    ratingAndFavoriteInCard() { return this.$store.state.Settings.ratingAndFavoriteInCard },
  },
  methods: {
    stopSmoothScroll(event) { if (event.button != 1) return; event.preventDefault(); event.stopPropagation() },
    openMetaCardPage() { if (this.isMetaAssignedToVideo) this.$router.push(`/metacard/?metaId=${this.meta.id}&cardId=${this.card.id}&tabId=default`) },
    checkShowEmptyValue(meta) {
      if (this.showEmptyMetaValueInCard) return true
      if (meta.type == 'complex') return this.card.meta[meta.id]&&this.card.meta[meta.id].length
      let valueType = typeof this.card.meta[meta.id]
      let simpleMeta = this.getMeta(meta.id)
      if (valueType == 'undefined' && simpleMeta.dataType!=='rating') return false
      if (['object','string'].includes(valueType)) return this.card.meta[meta.id].length
      else return true
    },
    // image 
    getImgUrl(type) {
      let img = path.join(this.pathToUserData, '/media/meta/', `${this.metaId}/${this.card.id}_${type}.jpg`)
      return path.join('file://', this.checkImageExist(img, type)) 
    },
    checkImageExist(imgPath, type) {
      if (fs.existsSync(imgPath)) return imgPath
      else if (type=='alt' || type=='custom1' || type=='custom2') return 'not_exist'
      else return path.join(__static, '/img/default.png')
    },
    getCareer(dataType) {
      let data = 'grey'
      let startMeta = _.find(this.meta.settings.metaInCard, i=>i.scraperField==='career_start')
      let endMeta = _.find(this.meta.settings.metaInCard, i=>i.scraperField==='career_end')
      if (!startMeta || !endMeta) return 'red'
      let start = this.card.meta[startMeta.id]
      let end = this.card.meta[endMeta.id]
      start = Number(start || 0)
      end = Number(end || 0)
      switch (dataType) {
        case 'color':
          if (start != 0 && end == 0) data = 'green'
          else if (start != 0 && end != 0) data = 'orange'
          else if (start == 0 && end == 0) data = 'grey'
          break
        case 'status':
          if (start != 0 && end == 0) data = 'Active'
          else if (start != 0 && end != 0) data = 'Retired'
          else if (start == 0 && end == 0) data = 'Unknown'
          break
        case 'ended':
          let birthday = _.find(this.meta.settings.metaInCard, i=>i.scraperField==='birthday')
          if (end!=0 && birthday && this.card.meta[birthday.id].length) {
            birthday = this.card.meta[birthday.id].match(/\d{4}/)[0]
            data = `at ${Number(end) - Number(birthday)} y.o.`
          } else data = ''
      }
      return data
    },
    getAge(date) {
      let birthday = date || ''
      let age = 0
      if (birthday.length) {
        age = birthday.match(/\d{4}/)[0]
        age = new Date().getFullYear() - Number(age)
        age = `, ${age} y.o.`
      } else { age = '' }
      return age
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
    changeMetaRating(stars, metaId) {
      this.$store.getters.metaCards.find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({[metaId]:stars}).write()
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
        let contextMenu = [{ name: `Edit ${this.meta.settings.nameSingular}`, type: 'item', icon: 'pencil', function: ()=>{this.$store.state.Meta.dialogEditMetaCard=true} }]
        contextMenu.push({ name: `Edit Images of ${this.meta.settings.nameSingular}`, type: 'item', icon: 'image-edit', function: ()=>{this.$store.state.Meta.dialogEditMetaCardImages=true}, disabled: !this.isSelectedSingleMetaCard })
        if (this.meta.settings.scraper && this.$store.state.Settings.showAdultContent) contextMenu.push({ name: `Scrape info for ${this.meta.settings.name}`, type: 'item', icon: 'magnify', function: ()=>{this.$store.state.Meta.dialogScrapeInfoMetaCard=true}})
        contextMenu.push({ type: 'divider' })
        if (this.isMetaAssignedToVideo) contextMenu.push({ name: `Open ${this.meta.settings.nameSingular} in New Tab`, type: 'item', icon: 'tab-plus', function: ()=>{this.addNewTabMetaCard()}, disabled: !this.isSelectedSingleMetaCard },
          { name: `Filter Videos by ${this.meta.settings.nameSingular}`, type: 'item', icon: 'filter', function: ()=>{this.filterVideosBy()} },{ type: 'divider' })
        contextMenu.push({ name: `Delete ${this.meta.settings.nameSingular}`, type: 'item', icon: 'delete', color: 'red', function: ()=>{this.$store.state.Meta.dialogDeleteMetaCard=true} })
        this.$store.state.contextMenuContent = contextMenu
        this.$store.state.contextMenu = true
      }, 300)
    },
    filterVideosBy() {
      let tabId = Date.now()
      let tab = { 
        name: this.$store.getters.videoFiltersForTabName, 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: [{
          by: this.meta.id, cond: 'includes one of',
          val: _.cloneDeep(this.$store.state.Meta.selectedMeta),
          type: 'select', flag: null, lock: false,
        }],
        sortBy: 'name',
        sortDirection: 'asc',
        page: 1,
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      setTimeout(() => { this.$router.push(tab.link) }, 100)
    },
    addNewTabMetaCard() {
      if (!this.isMetaAssignedToVideo) return
      let tabId = this.card.id
      let tabName = this.card.meta.name
      let meta = this.meta

      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with ${meta.settings.nameSingular.toLowerCase()} "${tabName}" already exists`
        })
        return
      }

      let tab = {
        name: tabName,
        link: `/metacard/?metaId=${meta.id}&cardId=${tabId}&tabId=${tabId}`,
        id: tabId,
        icon: meta.settings.icon
      }
      this.$store.dispatch('addNewTab', tab)
    },
    filterMetaCardsBy(metaId, cardId) { 
      this.$store.state.Meta.filters.push({
        by: metaId, 
        cond: 'includes one of', 
        val: [cardId],
        type: 'select',
        flag: null,
        lock: false
      })
      this.$store.dispatch('filterMetaCards')
    },
    filterMetaCardsByInNewTab(metaId, cardId) { 
      let tabId = Date.now().toString()
      let tab = { 
        name: this.meta.settings.name, 
        link: `/meta/?metaId=${this.meta.id}&tabId=${tabId}`,
        id: tabId,
        filters: [
          {
            by: metaId, 
            cond: 'includes one of', 
            val: [cardId],
            type: 'select',
            flag: null,
            lock: false
          }
        ],
        sortBy: 'name',
        sortDirection: 'asc',
        cardsPerPage: this.$store.state.Meta.cardsPerPage,
        page: 1,
        icon: this.meta.settings.icon
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    filterByCountry() { 
      this.$store.state.Meta.filters.push({
        by: 'country', 
        cond: 'includes one of', 
        val: this.card.meta.country,
        type: 'select',
        flag: null,
        lock: false
      })
      this.$store.dispatch('filterMetaCards')
    },
    filterByCountryInNewTab() { 
      let tabId = Date.now().toString()
      let tab = { 
        name: this.meta.settings.name, 
        link: `/meta/?metaId=${this.meta.id}&tabId=${tabId}`,
        id: tabId,
        filters: [
          {
            by: 'country', 
            cond: 'includes one of', 
            val: this.card.meta.country,
            type: 'select',
            flag: null,
            lock: false
          }
        ],
        sortBy: 'name',
        sortDirection: 'asc',
        cardsPerPage: this.$store.state.Meta.cardsPerPage,
        page: 1,
        icon: this.meta.settings.icon
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    openLink(url) { shell.openExternal(url) },
  },
  watch: {
    updateCardIds(newValue) {
      if (newValue.length === 0) this.cardKey = this.card.id + Date.now()
      else if (newValue.includes(this.card.id)) this.cardKey = this.card.id + Date.now() 
    },
  },
}
</script>