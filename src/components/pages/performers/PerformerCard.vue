<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu"
      class="performer-card" :class="{favorite: isFavorite}"
      :data-id="performer.id" hover outlined height="100%"
    >
      <div class="img-container" :class="{hidden: isFavoriteHidden}">
        <div @click="filterByNationality" @click.middle="addNewTabWithNationality"
          class="flag-icon" :class="{hidden: isNationalityHidden}">
          <country-flag :country='findCountryCode(performer.nation)' 
            size='normal' :title="performer.nation" />
        </div>

        <v-img @click.middle="addNewTabPerformer"
          class="performer-card-img" :src="imgMain" :key="imgMainKey"
          @click="openPerformerPage" :aspect-ratio="5/8" position="top"
        >
          <span class="template-text" v-if="imgMain.includes('performer.png')">Main image</span>
        </v-img>
        
        <v-img @click.middle="addNewTabPerformer"
          class="secondary-img" :src="imgAlt" :aspect-ratio="5/8" position="top"
          @click="openPerformerPage" :key="imgAltKey" :title="`Open ${performer.name} page`"
        >
          <span class="template-text" v-if="imgAlt.includes('performer_back.png')">Alternate image</span>
        </v-img>

        <div class="rating-wrapper" :class="{hidden: isRatingHidden}">
          <v-rating
            v-model="performer.rating"
            color="yellow darken-3"
            background-color="grey darken-1"
            empty-icon="mdi-star-outline"
            half-icon="mdi-star-half-full"
            dense half-increments hover size="18" clearable
            @input="changeRating($event, performer.id)"
          ></v-rating>
        </div>

        <v-btn @click="toggleFavorite" icon absolute 
          :color="isFavorite===false ? 'white' : 'pink'"
          class="fav-btn" :class="{hidden: isFavoriteHidden}"
        > <v-icon :color="isFavorite===false ? 'grey' : 'pink'"> mdi-heart-outline </v-icon>
        </v-btn>

        <div class="custom1-img-wrapper" v-if="!isCustomImgExist(imgCustom1)">
          <v-img @click="openPerformerPage" @click.middle="addNewTabPerformer"
            class="custom1-img" :key="imgCustom1Key"
            :src="isCustomImgExist(imgCustom1) ? '' : imgCustom1"
          />
        </div>

        <div class="custom2-img-wrapper" v-if="!isCustomImgExist(imgCustom2)">
          <v-img @click="openPerformerPage" @click.middle="addNewTabPerformer"
            class="custom2-img" :key="imgCustom2Key"
            :src="isCustomImgExist(imgCustom2) ? '' : imgCustom2"
          /> 
        </div>

        <v-progress-circular class="profile-complete-progress" :class="{hidden: isProfileProgressHidden}"
          :value="profileCompleteProgress" size="28" rotate="270" title="Profile complete"
          :color="profileCompleteProgress>=99?'green':'white'" width="2"
        >
          <v-icon v-if="profileCompleteProgress>=99" color="green">mdi-check</v-icon>
          <div v-else class="caption">
            {{profileCompleteProgress}}<span class="percent">%</span>
          </div>
        </v-progress-circular>
        
        <v-icon v-if="performer.bookmark" class="bookmark" color="red" size="28" :title="bookmark">
          mdi-bookmark
        </v-icon>
      </div>

      <!-- <v-progress-linear 
        class="performer-meter" :class="{hidden: isMeterHidden}"
        :value="meter" :height="meterHeight" /> -->
      
      <v-card-title class="performer-card-title pa-2" :class="{hidden: isNameHidden}"> 
        <div class="performer-name"> {{performerName}} </div>
        <!-- <span class="ml-1 font-weight-light">({{videosQuantity}})</span> -->
        <div v-show="performerAliases.length != 0" class="aliases mt-1" 
          :class="{hidden: isAliasesHidden}">
          <span class="aka">aka</span>{{performerAliases}}
        </div>
      </v-card-title>

      <v-card-text class="pa-2 performer-career-status" :class="{hidden: isCareerStatusHidden}">
        <span class="caption">Career status</span> 
        <v-chip class="px-4" label small dark :color="careerStatusColor">
          {{careerStatus}}
        </v-chip>
      </v-card-text>

      <v-card-text class="px-1 py-0 performer-tags" :class="{hidden: isTagsHidden}" 
        v-if="performer.tags.length>0">
        <v-chip-group column>
          <v-chip v-for="tag in performer.tags" :key="tag" :to="tagLink(tag)"
            :x-small="isChipsXS" :small="isChipsS"
            outlined :color="getTagColor(tag)"
            @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabTag(tag)"
          > {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
      
      <!-- TODO: remake tags from videos. add manual scan for tags, websites in settings -->
      <!-- <v-card-text v-if="tagsFromVideos.length>0" 
        class="pa-1 py-0 performer-video-tags" :class="{hidden: isVideoTagsHidden}">
        <div class="caption px-1">Tags from videos</div>
        <v-chip-group column>
          <v-chip v-for="tag in tagsFromVideos" :key="tag" :to="tagLink(tag)"
            :x-small="isChipsXS" :small="isChipsS"
            outlined :color="getTagColor(tag)" 
            @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabTag(tag)"
          > {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-card-text> -->
      <!-- TODO: add websites from videos -->
      
      <v-btn @click="$store.state.Performers.dialogEditPerformerImages=true"
        color="secondary" fab x-small class="btn-edit-images" :class="{hidden: isEditBtnHidden}">
        <v-icon>mdi-image-edit-outline</v-icon>
      </v-btn>
      <v-btn @click="$store.state.Performers.dialogEditPerformerInfo=true"
        color="secondary" fab x-small class="btn-edit" :class="{hidden: isEditBtnHidden}">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-card>
  </v-lazy>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shortid = require("shortid")

import CountryFlag from 'vue-country-flag'
import Countries from '@/mixins/Countries'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: "PerformerCard",
  props: {
    performer: Object,
  },
  components: {
    CountryFlag,
	},
  mixins: [Countries, ShowImageFunction], 
  mounted () {
    this.$nextTick(function () {
      this.performerAliases = this.performer.aliases.join(", ")
      this.performerName = this.performer.name
      this.isFavorite = this.performer.favorite
      this.imgMain = this.getImg(this.performer.id, 'main')
      this.imgAlt = this.getImg(this.performer.id, 'alt')
      this.imgCustom1 = this.getImg(this.performer.id, 'custom1')
      this.imgCustom2 = this.getImg(this.performer.id, 'custom2')
      // this.updateMeter()
      // this.videosQuantity = this.$store.getters.videos.filter({
      //   'performers': [this.performer.name]
      // }).value().length
    })
  },
  data: () => ({
    performerName: '',
    performerAliases: '',
    imgMain: '',
    imgMainKey: Date.now()+0,
    imgAlt: '',
    imgAltKey: Date.now()+1,
    imgCustom1: '',
    imgCustom1Key: Date.now()+2,
    imgCustom2: '',
    imgCustom2Key: Date.now()+3,
    isFavorite: false,
    // meter: 0,
    // videosQuantity: 0,
    isChipsXS: true,
    isChipsS: false,
    percentValue: 5.263,
  }),
  computed: {
    isChipsColored() {
      return this.$store.state.Performers.performerChipsColored
    },
    isEditBtnHidden() {
      return this.$store.state.Performers.performerEditBtnHidden 
    },
    isRatingHidden() {
      return this.$store.state.Performers.performerRatingHidden
    },
    isNationalityHidden() {
      return this.$store.state.Performers.performerNationalityHidden
    },
    isFavoriteHidden() {
      return this.$store.state.Performers.performerFavoriteHidden
    },
    isProfileProgressHidden() {
      return this.$store.state.Performers.performerProfileProgressHidden
    },
    isNameHidden() {
      return this.$store.state.Performers.performerNameHidden
    },
    isAliasesHidden() {
      return this.$store.state.Performers.performerAliasesHidden
    },
    isMeterHidden() {
      return this.$store.state.Performers.performerMeterHidden
    },
    isCareerStatusHidden() {
      return this.$store.state.Performers.performerCareerStatusHidden
    },
    isTagsHidden() {
      return this.$store.state.Performers.performerTagsHidden
    },
    isVideoTagsHidden() {
      return this.$store.state.Performers.performerVideoTagsHidden
    },
    aliases: {
      get() {
        let filteredAliases = JSON.parse(JSON.stringify(this.performer.aliases))
        this.performerAliases = filteredAliases.join(", ")
      },
      set(newAliases) {
        if (typeof newAliases === 'object') {
          let filteredAliases = JSON.parse(JSON.stringify(newAliases))
          this.performerAliases = filteredAliases.join(", ")
        }
        if (typeof newAliases === 'string') {
          this.performerAliases = newAliases
        }
      },
    },
    name: {
      get() {
        this.performerName = this.performer.name
      },
      set(newName) {
        if (typeof newName === 'string') {
          this.performerName = newName
        }
      },
    },
    updateImagesData() {
      return this.$store.state.Performers.updateImages
    },
    updateInfoData() {
      return this.$store.state.Performers.updateInfo
    },
    // tagsFromVideos() {
    //   let vids = this.$store.getters.videos
    //   vids = vids.filter(v=>v.performers.includes(this.performer.name)).map('tags').value()
    //   let tags = []
    //   vids.map(video=>{ if (video.length>0) video.map(tag=>tags.push(tag)) })
    //   tags = tags.filter((x, i, a) => a.indexOf(x) === i) // get unique values
    //   tags = tags.filter(el => (el !== null && el !== undefined))
    //   return tags.sort((a, b) => a.localeCompare(b))
    // },
    // meterHeight() {
    //   return this.$store.state.Settings.meterHeight
    // },
    // meterMultiplier() {
    //   return this.$store.state.Settings.meterMultiplier
    // },
    careerStatus() {
      let status
      if (this.performer.start !== "" && this.performer.end === "") {
        status = 'Active'
      }
      if (this.performer.start !== "" && this.performer.end !== "") {
        status = 'Retired'
      }
      if (this.performer.start === "" && this.performer.end === "") {
        status = 'Unknown'
      }
      return status
    },
    careerStatusColor() {
      let status
      if (this.performer.start !== "" && this.performer.end === "") {
        status = 'green'
      }
      if (this.performer.start !== "" && this.performer.end !== "") {
        status = 'orange'
      }
      if (this.performer.start === "" && this.performer.end === "") {
        status = 'grey darken-2'
      }
      return status
    },
    chipsSize() {
      return this.$store.state.Settings.performerCardSize
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    profileCompleteProgress() {
      let progress = 0
      if (this.performer.name.length) {
        progress += this.percentValue 
      }
      if (this.performer.birthday.length) {
        progress += this.percentValue 
      }
      if (this.performer.nation.length) {
        progress += this.percentValue 
      }
      if (this.performer.ethnicity.length) {
        progress += this.percentValue 
      }
      if (this.performer.hair.length) {
        progress += this.percentValue 
      }
      if (this.performer.eyes.length) {
        progress += this.percentValue 
      }
      if (this.performer.height.length) {
        progress += this.percentValue 
      }
      if (this.performer.weight.length) {
        progress += this.percentValue 
      }
      if (this.performer.bra.length) {
        progress += this.percentValue 
      }
      if (this.performer.waist.length) {
        progress += this.percentValue 
      }
      if (this.performer.hip.length) {
        progress += this.percentValue 
      }
      if (this.performer.boobs.length) {
        progress += this.percentValue 
      }
      if (this.performer.cup.length) {
        progress += this.percentValue 
      }
      if (this.performer.category.length) {
        progress += this.percentValue 
      }
      if (this.performer.body.length) {
        progress += this.percentValue 
      }
      if (this.performer.pussy.length) {
        progress += this.percentValue 
      }
      if (this.performer.pussyLips.length) {
        progress += this.percentValue 
      }
      if (this.performer.pussyHair.length) {
        progress += this.percentValue 
      }
      if (this.performer.start.length) {
        progress += this.percentValue 
      }
      if (progress > 100) progress = 100
      return Math.ceil(progress)
    },
    bookmark() {
      return this.$store.getters.bookmarks.get('performers').find({itemId:this.performer.id}).value().text
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    addNewTabPerformer() {
      let tabId = this.performer.id
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with performer "${this.performer.name}" already exists`
        })
        return
      }
      let tab = { 
        name: this.performer.name,
        link: `/performer/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    addNewTabTag(tagName) {
      let tabId = this.getTagId(tagName)
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with tag "${tagName}" already exists`
        })
        return
      }
      let tab = { 
        name: tagName,
        link: `/tag/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    addNewTabWithNationality() {
      let key = 'nation'
      let value = [this.performer.nation]
      this.$store.commit('updateFiltersOfPerformers', {key, value})
      this.$store.dispatch('filterPerformers')
      let tabId = shortid.generate()
      let tab = { 
        name: this.performer.nation, 
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Performers.filters),
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    updateTabFilters() {
      let newFilters = _.cloneDeep(this.$store.state.Performers.filters)
      if (this.tabId === 'default') {
        this.$store.state.Performers.filtersReserved = newFilters
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.performersFilters,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    filterByNationality() {
      let key = 'nation'
      let value = [this.performer.nation]
      this.$store.commit('updateFiltersOfPerformers', {key, value})
      this.$store.dispatch('filterPerformers')
      this.updateTabFilters()
    },
    tagLink(tag) {
      return `/tag/:${this.getTagId(tag)}?tabId=default`
    },
    getTagId(itemName) {
      return this.$store.getters.tags.find({name: itemName}).value().id
    },
    openPerformerPage() {
      this.$router.push(`/performer/:${this.performer.id}?tabId=default`)
    },
    isCustomImgExist (imgPath) {
      return imgPath.includes('not_exist')
    },
    updateInfo(info) { //TODO:make update only for current card
      if (this.performer.id != info.id) return
      setTimeout(() => {
        if (info.aliases !== undefined) {
          this.aliases = info.aliases
        }
        if (info.name !== undefined) {
          this.name = info.name
        }
        // console.warn('name typeof: '+ typeof info.name)
        // console.warn('name is: '+ info.name)
        console.log(`info updated`)
      }, 1000)
    },
    updateImages(imageData) {
      setTimeout(() => {
        if (imageData.type === 'main') {
          this.imgMain = this.getImg(this.performer.id, imageData.type)
          this.imgMainKey = imageData.key
          console.log(`main img updated`)
        }
        if (imageData.type === 'alt') {
          this.imgAlt = this.getImg(this.performer.id, imageData.type)
          this.imgAltKey = imageData.key
          console.log(`alt img updated`)
        }
        if (imageData.type === 'custom1') {
          this.imgCustom1 = this.getImg(this.performer.id, imageData.type)
          this.imgCustom1Key = imageData.key
          console.log(`custom1 img updated`)
        }
        if (imageData.type === 'custom2') {
          this.imgCustom2 = this.getImg(this.performer.id, imageData.type)
          this.imgCustom2Key = imageData.key
          console.log(`custom2 img updated`)
        }
      }, 3000)
    },
    // updateMeter(value) {
    //   if(this.tagsFromVideos.length>0) {
    //     this.meter = 0
    //     for (let i=0; i < this.tagsFromVideos.length; i++) {
    //       this.meter += this.tagInPercentsOfMeter(this.getTagValue(this.tagsFromVideos[i]))
    //     }
    //     this.meter = this.meter * (1 + this.meterMultiplier / 50)
    //   }
    // },
    getImg(performerId, imageType) {
      let imgMainPath = this.getImgUrl(performerId) + `_${imageType}.jpg`
      return this.checkImageExist(imgMainPath, imageType)+'?lastmod='+Date.now()
    },
    checkImageExist(imgPath, imgType) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else if (imgType === 'alt') {
        return path.join(this.pathToUserData, '/img/templates/performer_back.png')
      } else if (imgType === 'custom1' || imgType === 'custom2') {
        return 'not_exist'
      } else {
        return path.join(this.pathToUserData, '/img/templates/performer.png')
      }
    },
    getImgUrl(img) {
      return  path.join(this.pathToUserData, `/media/performers/${img}`)
    },
    addTag(tagName, videoID) {
      console.log(tagName, videoID);
    },
    changeRating(stars, performerID) {
      console.log('rating changed: ' +stars);
      this.$store.getters.performers
        .find({ id: performerID })
        .assign({ rating: stars })
        .write();
      this.$store.commit('updatePerformers')
    },
    toggleFavorite() {
      if (this.isFavorite) {
        this.isFavorite = false
        console.log('remove from favorite')
      } else {
        this.isFavorite = true
        console.log('added to favorite')
      }

      this.$store.getters.performers
        .find({ id: this.performer.id })
        .assign({ favorite: this.isFavorite })
        .write();
      this.$store.commit('updatePerformers')
    },
    getTagColor(tagName) {
      if (this.isChipsColored) {
        return this.$store.getters.tags.find({name:tagName}).value().color
      } else return ''
    },
    getTagValue(tagName) {
      return this.$store.getters.tags.find({name:tagName}).value().value
    },
    tagInPercentsOfMeter(tagValue) {
      if (tagValue != 0) {
        return (tagValue / this.$store.getters.sumOfTagsValue) * 100
      } else return 0
    },
    findCountryCode(country) {
      if (!country == '') {
        let countryName = country.toLowerCase()
        let code = _.filter(this.countries,
          country => (country.name.toLowerCase().includes(countryName))
        )[0]
        if (code == undefined) {
          return ''
        } else return code.code
      } else return ""
    },
    showContextMenu(e) {
      e.preventDefault()
      this.$store.state.Performers.menuCard = false
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
      this.$nextTick(() => {
        this.$store.state.Performers.menuCard = true
      })
    },
    getChipsSize() {
      switch(this.chipsSize) {
        case 1: this.isChipsXS = true; this.isChipsS = false; break;
        case 2: this.isChipsXS = true; this.isChipsS = false; break;
        case 3: this.isChipsXS = true; this.isChipsS = false; break;
        case 4: this.isChipsXS = false; this.isChipsS = true; break;
        case 5: this.isChipsXS = false; this.isChipsS = false; break;
      }
    },
  },
  watch: {
    updateImagesData (imgData) {
      if (this.performer.id == imgData.id) {
        this.updateImages(imgData)
      }
    },
    updateInfoData (info) {
      this.updateInfo(info)
    },
    // meterMultiplier (value) {
    //   this.updateMeter(value)
    // },
    chipsSize(newSize, oldSize) {
      this.getChipsSize()
    }
  },
}
</script>


<style lang="less">
.performer-card {
  box-shadow: 0px 3px 3px 2px rgba(0, 0, 0, 0.12);
  border: none !important;
  cursor: default;
  .v-image {
    cursor: pointer;
  }
  &:hover {
    .btn-edit,
    .btn-edit-images {
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }
    .custom2-img-wrapper,
    .custom1-img-wrapper {
      opacity: 0.7;
      transform: translateX(0);
      &:hover {
        opacity: 1;
      }
    }
    .bookmark {
      opacity: 0.7;
      &:hover {
        opacity: 1;
      }
    }
  }
  &-title {
    font-weight: 400;
    font-size: 16px;
    line-height: 1.2;
    &.hidden{
      display: none;
    }
  }
  &-img {
    transition: .3s opacity ease-out, 0.3s height ease;
    opacity: 1;
    .v-image__image {
      background-color: rgba(0, 0, 0, 0.5);
    }
  }
  &-inner {
    height: 100%;
  }
  &.favorite {
    &:before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      border-radius: 4px;
      pointer-events: none;
      box-shadow: 0px 2px 8px 3px rgba(255, 0, 75, 0.25), 0 0 0 1px rgba(255, 0, 75, 1);
    }
    .img-container:before {
      opacity: 1;
    }
    .hidden:before {
      opacity: 0;
    }
  }
  .rating-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.15);
    border-top-right-radius: 8px;
    &.hidden {
      display: none;
    }
  }
  .img-container {
    position: relative;
    overflow: hidden;
    border-radius: 4px 4px 0 0;
    &:hover {
      .btn-open-performer-page {
        opacity: 0.4;
        &:hover {
          opacity: 1;
          .v-btn:before {
            opacity: 0 !important;
          }
        }
      }
      .secondary-img {
        opacity: 1;
      }
      .performer-card-img {
        opacity: 0;
      }
    }
    &:before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 1;
      opacity: 0;
      background-image: linear-gradient(225deg, rgba(255, 0, 75, 1) 0%, rgba(0, 0, 0, 0) 12%, rgba(0, 0, 0, 0));
      transition: 1s all ease;
      pointer-events: none;
    }
  }
  .v-input__append-inner {
    display: none;
  }
  .v-chip {
    margin: 0 2px 2px !important;
    padding: 0 4px;
  }
  .performer-name {
    font-weight: 300;
    cursor: pointer;
  }
  .flag-icon {
    position: absolute;
    top: 5px;
    left: 5px;
    z-index: 1;
    width: 24px;
    height: 16px;
    overflow: hidden;
    cursor: pointer;
    .flag {
      position: absolute;
      margin: auto;
      left: -100%;
      right: -100%;
      top: -100%;
      bottom: -100%;
    }
    &.hidden {
      display: none;
    }
  }
  .aka {
    font-size: 12px;
    font-style: italic;
    margin-left: 7px;
    margin-right: 10px;
  }
  .aliases {
    width: 100%;
    font-size: 12px;
    font-weight: 300;
    line-height: 1.2;
    word-break: keep-all;
    &.hidden {
      display: none;
    }
  }
  .template-text {
    pointer-events: none;
    font-size: 20px;
    font-weight: 300;
    color: #fff;
    opacity: .2;
    position: absolute;
    transform: translateY(-100px);
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    margin: auto;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-edit-images {
    position: absolute;
    bottom: 45px;
    right: 5px;
    opacity: 0;
    z-index: 4;
    &.hidden {
      display: none;
    }
  }
  .btn-edit {
    position: absolute;
    right: 5px;
    bottom: 5px;
    opacity: 0;
    z-index: 4;
    &.hidden {
      display: none;
    }
  }
  .tags-from-videos {
    font-size: 12px;
    font-weight: 300;
    margin-bottom: 0;
    padding-left: 3px;
  }
  .performer-tags {
    &.hidden {
      display: none;
    }
  }
  .performer-video-tags {
    &.hidden {
      display: none;
    }
  }
  .performer-career-status {
    display: flex;
    justify-content: space-between;
    &.hidden {
      display: none;
    }
  }
  .bookmark {
    position: absolute;
    top: -4px;
    right: 50px;
    opacity: 0.4;
    text-shadow: 0px 0px 1px #000;
  }
  .secondary-img {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    transition: .3s all ease;
    opacity: 0;
    .v-image__image {
      background-position-y: top !important;
      background-color: rgba(0, 0, 0, 0.5);
    } 
  }
  .custom2-img,
  .custom1-img {
    min-width: 100%;
    min-height: 100%;
    &-wrapper {
      width: 40px;
      height: 40px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 50px;
      position: absolute;
      right: 5px;
      overflow: hidden;
      transition: .3s all ease;
      opacity: 0;
      transform: translateX(50px);
      &:hover {
        width: 100%;
        height: 100%;
        border-width: 0px;
        border-radius: 0px;
        position: absolute;
        bottom: 0px;
        right: 0px;
      }
    }
  }
  .custom1-img {
    &-wrapper {
      bottom: calc(50% - 18px);
    }
  }
  .custom2-img {
    &-wrapper {
      bottom: calc(50% - 62px);
    }
  }
  .profile-complete-progress {
    position: absolute;
    z-index: 1;
    bottom: 5px;
    right: 5px;
    background-color: rgba(90, 90, 90, 0.5);
    border-radius: 50%;
    &.hidden {
      display: none;
    }
    .percent {
      font-size: 8px;
    }
  }
}
</style>