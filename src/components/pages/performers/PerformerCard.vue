<template>
  <v-lazy>
    <v-card @click="$store.state.Performers.bottomSheet = true" 
      @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu"
      class="performer-card" :class="{favorite: performer.favorite}"
      :data-id="performer.id" hover outlined height="100%"
      :key="cardKey" v-ripple="{ class: 'accent--text' }"
    >
      <div class="img-container" :class="{hidden: isFavoriteHidden}">
        <div v-if="!isNationalityHidden" class="nation">
          <div v-for="nation in performer.nations" :key="nation" class="flag-icon" 
            @click="filterByNationality(nation)" @click.middle="addNewTabWithNationality(nation)">
            <country-flag :country='findCountryCode(nation)' size='normal' :title="nation"/>
          </div>
        </div>

        <v-img  @click="openPerformerPage" @click.middle="addNewTabPerformer()"
          :src="imgMain" :aspect-ratio="5/8" position="top" class="performer-card-img">
          <span class="template-text" v-if="imgMain.includes('performer.png')">Main image</span>
        </v-img>
        
        <v-img @click="openPerformerPage" @click.middle="addNewTabPerformer()" class="secondary-img"
          :src="imgAlt" :aspect-ratio="5/8" position="top" :title="`Open ${performer.name} page`">
          <span class="template-text" v-if="imgAlt.includes('performer_back.png')">Alternate image</span>
        </v-img>

        <div v-if="!isRatingHidden && !$store.state.Settings.ratingAndFavoriteInCard" class="rating-wrapper">
          <v-rating :value="performer.rating" @input="changeRating($event, performer.id)"
            color="yellow darken-2" background-color="grey darken-1"
            empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
            dense half-increments hover size="18" clearable />
        </div>

        <v-btn v-if="!isFavoriteHidden && !$store.state.Settings.ratingAndFavoriteInCard" 
          @click="toggleFavorite" icon absolute 
          :color="performer.favorite===false ? 'white' : 'pink'" class="fav-btn"
        > <v-icon :color="performer.favorite===false ? 'grey' : 'pink'"> mdi-heart-outline </v-icon>
        </v-btn>

        <div class="custom1-img-button" v-if="!isCustomImgExist(imgCustom1)">1</div>
        <v-img @click="openPerformerPage" @click.middle="addNewTabPerformer()"
          :src="isCustomImgExist(imgCustom1) ? '' : imgCustom1" class="custom1-img" />

        <div class="custom2-img-button" v-if="!isCustomImgExist(imgCustom2)">2</div>
        <v-img @click="openPerformerPage" @click.middle="addNewTabPerformer()"
          :src="isCustomImgExist(imgCustom2) ? '' : imgCustom2" class="custom2-img" /> 

        <v-progress-circular v-if="!isProfileProgressHidden" class="profile-complete-progress"
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

      <v-progress-linear v-if="!isMeterHidden" class="performer-meter" :value="meter" :height="meterHeight"/>
      
      <v-card-title v-if="!isNameHidden" class="performer-card-title pa-2"> 
        <div> {{performer.name}} ({{performer.videos}})</div>
        <div v-if="performer.aliases.length && !isAliasesHidden" class="aliases mt-1">
          <span class="aka">aka</span>{{performer.aliases.join(", ")}}
        </div>
      </v-card-title>

      <v-card-actions v-if="$store.state.Settings.ratingAndFavoriteInCard" class="px-1 pt-0">
        <v-rating :value="performer.rating" @input="changeRating($event, performer.id)"
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover size="18" clearable />
        <v-spacer></v-spacer>
        <v-btn @click="toggleFavorite" small icon color="pink"> 
          <v-icon v-if="performer.favorite" color="pink">mdi-heart</v-icon>
          <v-icon v-else color="grey">mdi-heart-outline</v-icon>
        </v-btn>
      </v-card-actions>

      <v-card-text v-if="!isCareerStatusHidden" class="pa-2 performer-career-status">
        <span class="caption">Career status</span> 
        <v-chip class="px-4" label small dark :color="careerStatusColor">
          {{careerStatus}}
        </v-chip>
      </v-card-text>

      <v-card-text v-if="performer.tags.length>0 && !isTagsHidden" class="px-1 py-0">
        <v-chip-group column>
          <v-chip v-for="tag in performer.tags" :key="tag" @click="filterByTag(tag)"
            :outlined="isChipsColored" :color="getTagColor(tag)"
            @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
          > {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
      
      <v-card-text v-if="tagsFromVideos.length>0 && !isVideoTagsHidden" class="pa-1 py-0">
        <div class="caption px-1">Tags from videos</div>
        <v-chip-group column>
          <v-chip v-for="tag in tagsFromVideos" :key="tag"
            :outlined="isChipsColored" :color="getTagColor(tag)" 
            @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
          > {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
      
      <v-card-text v-if="performer.websites.length>0 && !isWebsitesHidden" class="pa-1 py-0">
        <div class="caption px-1">Websites</div>
        <v-chip-group column>
          <v-chip v-for="website in performer.websites" :key="website" :to="websiteLink(website)"
            :outlined="isChipsColored" label :color="getWebsiteColor(website)" 
            @mouseover.stop="showImage($event, getWebsiteId(website), 'website')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabWebsite(website)"
          > {{ website }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
      
      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Performers.dialogEditPerformerImages=true"
        color="secondary" fab x-small class="btn-edit-images">
        <v-icon>mdi-image-edit-outline</v-icon>
      </v-btn>
      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Performers.dialogEditPerformerInfo=true"
        color="secondary" fab x-small class="btn-edit">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-card>
  </v-lazy>
</template>


<script>
const fs = require("fs")
const path = require("path")

import CountryFlag from 'vue-country-flag'
import Countries from '@/mixins/Countries'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'

export default {
  name: "PerformerCard",
  props: {
    performer: Object,
  },
  components: {
    CountryFlag,
	},
  mixins: [Countries, ShowImageFunction, LabelFunctions], 
  mounted () {
    this.$nextTick(function () {
      this.cardKey = this.performer.id
      this.imgMain = this.getImgUrl('main')
      this.imgAlt = this.getImgUrl('alt')
      this.imgCustom1 = this.getImgUrl('custom1')
      this.imgCustom2 = this.getImgUrl('custom2')
      this.updateMeter()
    })
  },
  data: () => ({
    cardKey: '',
    imgMain: '',
    imgAlt: '',
    imgCustom1: '',
    imgCustom2: '',
    meter: 0,
  }),
  computed: {
    updateCardIds() {
      return this.$store.state.Performers.updateCardIds
    },
    isChipsColored() {
      return this.$store.state.Settings.performerChipsColored
    },
    isEditBtnHidden() {
      return this.$store.state.Settings.performerEditBtnHidden 
    },
    isRatingHidden() {
      return this.$store.state.Settings.performerRatingHidden
    },
    isNationalityHidden() {
      return this.$store.state.Settings.performerNationalityHidden
    },
    isFavoriteHidden() {
      return this.$store.state.Settings.performerFavoriteHidden
    },
    isProfileProgressHidden() {
      return this.$store.state.Settings.performerProfileProgressHidden
    },
    isNameHidden() {
      return this.$store.state.Settings.performerNameHidden
    },
    isAliasesHidden() {
      return this.$store.state.Settings.performerAliasesHidden
    },
    isMeterHidden() {
      return this.$store.state.Settings.performerMeterHidden
    },
    isCareerStatusHidden() {
      return this.$store.state.Settings.performerCareerStatusHidden
    },
    isTagsHidden() {
      return this.$store.state.Settings.performerTagsHidden
    },
    isVideoTagsHidden() {
      return this.$store.state.Settings.performerVideoTagsHidden
    },
    isWebsitesHidden() {
      return this.$store.state.Settings.performerWebsitesHidden
    },
    tagsFromVideos() {
      return this.performer.videoTags
    },
    meterHeight() {
      return this.$store.state.Settings.meterHeight
    },
    meterMultiplier() {
      return this.$store.state.Settings.meterMultiplier
    },
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
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    profileCompleteProgress() {
      let appParams = [
        'name', 
        'start', 
        'category',
        'birthday', 
        'nations', 
        'ethnicity',
        'eyes',
        'hair', 
        'height', 
        'weight', 
        'bra', 
        'waist', 
        'hip', 
        'cups', 
        'boobs', 
      ]
      let customParams = []
      let params = this.$store.state.Settings.customParametersPerformer
      for (let param in params) {
        customParams.push(params[param].name)
      }
      
      let completed = []
      for (let param in this.performer) {
        if (appParams.includes(param) || customParams.includes(param)) {
          if (typeof this.performer[param] == 'boolean') {
            this.performer[param] === true ? completed.push(1) : completed.push(0)    
          } else {
            this.performer[param].length > 0 ? completed.push(1) : completed.push(0) 
          }
        }
      }
      let completedValue = 0
      for (let i=0; i<completed.length; i++) {
        completedValue = completedValue + completed[i]
      }
      return Math.ceil(completedValue / completed.length * 100)
    },
    bookmark() {
      return this.$store.getters.bookmarks.get('performers').find({itemId:this.performer.id}).value().text
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    addNewTabWithNationality(nation) {
      let filters = [{
        param: 'nations',
        cond: 'one of',
        val: [nation],
        type: 'array',
        flag: null,
        lock: false,
      }]
      this.$store.state.Settings.performerFilters = _.cloneDeep(filters)
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.performerFiltersForTabName,
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.performerFilters),
        sortBy: 'name',
        sortDirection: 'asc',
        page: 1,
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    filterByNationality(nation) {
      let filter = {
        param: 'nations',
        cond: 'one of',
        val: [nation],
        type: 'array',
        flag: null,
        lock: false,
      }
      this.$store.state.Settings.performerFilters.push(filter)
      this.$store.dispatch('filterPerformers')
    },
    openPerformerPage() {
      this.$router.push(`/performer/:${this.performer.id}?tabId=default`)
    },
    isCustomImgExist(imgPath) {
      return imgPath.includes('not_exist')
    },
    updateMeter() {
      if (this.tagsFromVideos.length>0 && !this.isMeterHidden) {
        this.meter = 0
        for (let i=0; i < this.tagsFromVideos.length; i++) {
          this.meter += this.tagInPercentsOfMeter(this.getTagValue(this.tagsFromVideos[i]))
        }
        this.meter = this.meter * (1 + this.meterMultiplier / 50)
      }
    },
    getImgUrl(imageType) {
      let imgMainPath = path.join(this.pathToUserData, `/media/performers/${this.performer.id}_${imageType}.jpg`)
      return path.join('file://', this.checkImageExist(imgMainPath, imageType)) 
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
    addTag(tagName, videoID) {
      console.log(tagName, videoID);
    },
    changeRating(stars, performerID) {
      console.log('rating changed: ' +stars);
      this.$store.getters.performers.find({ id: performerID }).assign({ 
        rating: stars,
        edit: Date.now(),
      }).write()
    },
    toggleFavorite() {
      this.performer.favorite = !this.performer.favorite
      this.$store.getters.performers.find({ id: this.performer.id }).assign({ 
        favorite: this.performer.favorite,
        edit: Date.now(),
      }).write()
    },
    getTagColor(itemName) {
      if (this.isChipsColored) {
        return this.$store.getters.tags.find({name:itemName}).value().color
      } else return ''
    },
    getTagValue(itemName) {
      return this.$store.getters.tags.find({name:itemName}).value().value
    },
    getWebsiteColor(itemName) {
      if (this.isChipsColored) {
        return this.$store.getters.websites.find({name:itemName}).value().color
      } else return ''
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
      this.$store.state.menuTabs = false
      this.$store.state.Performers.menuCard = false
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
      this.$nextTick(() => {
        this.$store.state.Performers.menuCard = true
      })
    },
    filterByTag(tag) {
      let filter = {
        param: 'tags',
        cond: 'one of',
        val: [tag],
        type: 'array',
        flag: null,
        lock: false,
      }
      this.$store.state.Settings.performerFilters.push(filter)
      this.$store.dispatch('filterPerformers')
    },
  },
  watch: {
    updateCardIds(newValue) {
      if (newValue.length === 0) this.cardKey = this.performer.id + Date.now()
      if (newValue.includes(this.performer.id)) {
        this.cardKey = this.performer.id + Date.now()
        setTimeout(() => {
          this.imgMain = this.getImgUrl('main')
          this.imgAlt = this.getImgUrl('alt')
          this.imgCustom1 = this.getImgUrl('custom1')
          this.imgCustom2 = this.getImgUrl('custom2')
        }, 100)
      } 
    },
    isMeterHidden() {
      this.updateMeter()
    },
    meterMultiplier() {
      this.updateMeter()
    },
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
    .custom2-img-button,
    .custom1-img-button {
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
  .v-rating .v-icon::before {
    font-size: 1.3em !important;
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
      background: none;
      opacity: 1;
      box-shadow: 0px 2px 8px 3px rgba(255, 0, 75, 0.25), 0 0 0 1px rgba(255, 0, 75, 1);
    }
    .img-container:before {
      opacity: 1;
    }
    .hidden:before {
      opacity: 0;
    }
  }
  .fav-btn .v-icon:before {
    font-size: 1.5em !important;
  }
  .rating-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.1);
    border-top-right-radius: 3px;
    line-height: 1;
    .v-icon {
      padding: 0;
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
    padding: 3px 4px;
    line-height: 1;
    height: auto !important;
  }
  .nation {
    position: absolute;
    top: 5px;
    left: 5px;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }
  .flag-icon {
    width: 28px;
    height: 20px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    .flag {
      position: absolute;
      margin: auto;
      left: -100%;
      right: -100%;
      top: -100%;
      bottom: -100%;
    }
  }
  .aka {
    font-size: 12px;
    text-transform: uppercase;
    margin-left: 7px;
    margin-right: 10px;
  }
  .aliases {
    width: 100%;
    font-size: 12px;
    line-height: 1.2;
    word-break: keep-all;
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
  .btn-edit-images,
  .btn-edit {
    position: absolute;
    right: 5px;
    opacity: 0;
    z-index: 4;
  }
  .btn-edit-images  {
    bottom: 45px;
  }
  .btn-edit {
    bottom: 5px;
  }
  .tags-from-videos {
    font-size: 12px;
    font-weight: 300;
    margin-bottom: 0;
    padding-left: 3px;
  }
  .performer-career-status {
    display: flex;
    justify-content: space-between;
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
  .profile-complete-progress {
    position: absolute;
    z-index: 1;
    bottom: 5px;
    right: 5px;
    background-color: rgba(90, 90, 90, 0.5);
    border-radius: 50%;
    .percent {
      font-size: 8px;
    }
  }
}
.custom2-img,
.custom1-img {
  position: absolute !important;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  opacity: 0;
  min-width: 100%;
  min-height: 100%;
  transition: .3s opacity ease-out;
  &-button {
    width: 30px;
    height: 30px;
    background: rgba(10, 10, 10, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    position: absolute;
    right: 0;
    opacity: 0;
    transition: .3s;
    transform: translateX(50px);
    z-index: 1;
  }
}
.custom1-img {
  &-button {
    bottom: 50%;
  }
}
.custom2-img {
  &-button {
    bottom: calc(50% - 30px);
  }
}
.custom1-img-button {
  &:hover {
    & + .custom1-img {
      opacity: 1 !important;
    }
  }
}
.custom2-img-button {
  &:hover {
    & + .custom2-img {
      opacity: 1 !important;
    }
  }
}
</style>