<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <v-responsive :aspect-ratio="2.3" class="header-images" :class="{header: !isHeaderImageExists}">
      <img v-if="isHeaderImageExists" :src="getImgUrl('header')" :style="header" class="header-image">
      <div v-else class="images">
        <v-img :src="getImgUrl('main')" :gradient="gradientImage" :aspect-ratio="5/9"/>
        <v-responsive :aspect-ratio="5/9" />
        <v-responsive :aspect-ratio="5/9" />
        <v-img :src="getImgUrl('alt')" :gradient="gradientImage" :aspect-ratio="9/5"/>
      </div>
      <div class="header-gradient" :style="gradient"></div>
    </v-responsive>

    <div v-if="!isHeaderImageExists" class="spacer"></div>
    <v-container class="profile-container" :class="{images: isHeaderImageExists}">
      <v-avatar max-width="160" width="160" height="160" class="profile-avatar"> 
        <img :src="getImgUrl('avatar')">
        <v-progress-circular :value="profileCompleteProgress" size="160" rotate="270" width="2"
          class="profile-complete-progress" color="white"> 
          <div class="value">{{profileCompleteProgress}}<span class="percent">%</span></div>
        </v-progress-circular>
      </v-avatar>
      <div class="buttons-left">
        <v-btn @click="copyPerformerNameToClipboard" icon
          title="Copy performer name to clipboard"><v-icon>mdi-content-copy</v-icon>
        </v-btn>
        <v-btn @click="showTags = !showTags" icon
          title="Toggle tags from videos visibilty"><v-icon>mdi-tag-outline</v-icon>
        </v-btn>
        <v-btn @click="showWebsites = !showWebsites" icon
          title="Toggle websites visibilty"><v-icon>mdi-web</v-icon>
        </v-btn>
        <v-btn v-if="tabId==='default'" @click="addNewTabPerformer" icon
          title="Open performer in a new tab"><v-icon>mdi-tab-plus</v-icon>
        </v-btn>
      </div>
      <div class="buttons-right">
        <v-btn @click="$store.state.Performers.dialogEditPerformerInfo = true"
          icon title="Edit info of performer">
          <v-icon>mdi-square-edit-outline</v-icon>
        </v-btn>
        <v-btn @click="$store.state.Performers.dialogEditPerformerImages = true"
          icon title="Edit images of performer">
          <v-icon>mdi-image-edit-outline</v-icon>
        </v-btn>
      </div>
      <v-expansion-panels focusable>
        <v-expansion-panel :style="profileBackground">
          <v-expansion-panel-header class="pa-6" ripple hide-actions>
            <div class="profile-name text-center">{{performer.name}}</div>
          </v-expansion-panel-header>
          <v-expansion-panel-content eager>
            <v-container class="pa-0">
              <v-row>
                <v-col cols="12" sm="4">
                  <div class="overline text-center">Main info</div>
                  <div class="param">
                    Rating
                    <v-rating
                      v-model="performer.rating" readonly dense
                      color="yellow darken-3" background-color="grey darken-1"
                      empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
                      half-increments size="20" style="display: inline;"
                    ></v-rating>
                  </div>
                  <div class="param ml-6">
                    Favorite
                    <v-icon v-if="performer.favorite" size="20" color="pink">
                      mdi-heart
                    </v-icon>
                    <v-icon v-else size="20" color="grey">
                      mdi-heart-outline 
                    </v-icon>
                  </div><br>
                  <div class="param">Category <b>{{category}}</b></div><br>
                  <div class="param"><b>Aliases</b> {{aliases}}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="overline text-center">Personal Information</div>
                  <div class="age-container">
                    <div class="age"><i>Age</i> <span>{{getAge}}</span>
                    <div class="last"><i>Last active age</i> <span>{{getLastActiveAge}}</span></div></div>
                    <div class="birth"><i>Date birth</i> <span>{{getBirthday}}</span></div>
                  </div>
                  <div class="nationality">
                    <country-flag :country='nation'/> <span class="country">{{country}}</span>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="overline text-center">Career</div>
                  <div class="career-status" :class="careerStatus.toLowerCase()">
                    {{careerStatus}}
                  </div>
                  <div class="career">
                    <div class="text">
                      <div class="bold-text"> 
                        <span v-if="totalCareer>0">{{totalCareer}}</span>
                        <span v-else>???</span>
                        year<span v-if="totalCareer>1">s</span>
                      </div> 
                      <br><div class="light-text">in the business</div>
                    </div>
                    <div class="start value">{{careerStart}}</div>
                    <div class="end value">{{careerEnd}}</div>
                    <div class="line"></div>
                  </div>
                </v-col>
                <v-col cols="12" class="pa-0">
                  <div class="overline text-center">Appearance</div>
                </v-col>
                <v-col cols="4" class="pb-0">
                  <v-icon left size="16">mdi-account-group</v-icon>
                  Ethnicity <b>{{ethnicity}}</b>
                </v-col>
                <v-col cols="4" class="pb-0">
                  <v-icon left size="16">mdi-face-woman-outline</v-icon>
                  Hair color <b>{{hair}}</b>
                </v-col>
                <v-col cols="4" class="pb-0">
                  <v-icon left size="16">mdi-eye</v-icon>
                  Eyes color <b>{{eyes}}</b>
                </v-col>
                <v-col cols="4" class="py-0">
                  <div class="param">Height <b>{{height}}</b> <i>cm</i></div>
                  <div class="param">Weight <b>{{weight}}</b> <i>kg</i></div><br>
                </v-col>
                <v-col cols="4" class="py-0">
                  <div class="param">Bra <b>{{bra}}</b> <i>cm</i></div>
                  <div class="param">Waist <b>{{waist}}</b> <i>cm</i></div>
                  <div class="param">Hip <b>{{hip}}</b> <i>cm</i></div><br>
                </v-col>
                <v-col cols="4" class="py-0">
                  <div class="param">Cups <b>{{cups}}</b></div>
                  <div class="param">Boobs <b>{{boobs}}</b></div>
                </v-col>
                <v-col v-if="params.length" cols="12" class="pb-0">
                  <div class="overline text-center">Custom parameters</div>
                </v-col>
                <v-col v-for="param in params" :key="param.name" cols="4" class="py-0">
                  <v-icon left size="16">mdi-shape</v-icon>
                  {{param.name}} <b>{{getCustomParamValue(param.name, param.type)}}</b>
                </v-col>
                <v-col cols="12" class="text-center pb-0">
                  <v-chip v-for="tag in performer.tags" :key="tag"
                    outlined class="mr-2 mb-1 px-2"
                    @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    >{{tag}}</v-chip>
                </v-col>
                <v-col v-if="tagsFromVideos.length && showTags" cols="12" class="text-center py-0">
                  <div class="mt-2 font-weight-light"> 
                    <v-tooltip left>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon v-bind="attrs" v-on="on" left small>mdi-help-circle-outline</v-icon>
                      </template>
                      <span>Click on tag for filter videos</span>
                    </v-tooltip>
                    <span>Tags from videos</span>
                    <v-btn v-if="activeTags.length" @click="activeTags=[]" 
                      x-small rounded class="ml-4">
                      <v-icon left small>mdi-cancel</v-icon> Show all
                    </v-btn>
                  </div>
                  <v-chip-group v-model="activeTags" active-class="active-chip"
                    multiple column class="tags-from-videos">
                    <v-chip v-for="tag in tagsFromVideos" :key="tag"
                      outlined small class="mr-2 mb-1 px-2"
                      @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                    >{{tag}}</v-chip>
                  </v-chip-group>
                </v-col>
                <v-col v-if="performer.websites.length && showWebsites" cols="12" class="text-center py-0">
                  <div class="mt-2 font-weight-light"> 
                    <v-tooltip left>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon v-bind="attrs" v-on="on" left small>mdi-help-circle-outline</v-icon>
                      </template>
                      <span>Click on website for filter videos</span>
                    </v-tooltip>
                    <span>Websites from videos</span>
                    <v-btn v-if="activeWebsites.length" @click="activeWebsites=[]" 
                      x-small rounded class="ml-4">
                      <v-icon left small>mdi-cancel</v-icon> Show all
                    </v-btn>
                  </div>
                  <v-chip-group v-model="activeWebsites" active-class="active-chip"
                    multiple column class="tags-from-videos">
                    <v-chip v-for="website in performer.websites" :key="website"
                      outlined small class="mr-2 mb-1 px-2"
                      @mouseover.stop="showImage($event, getWebsiteId(website), 'website')" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                      @click="$store.state.hoveredImage=false"
                      @click.middle="addNewTabWebsite(website)"
                    >{{website}}</v-chip>
                  </v-chip-group>
                </v-col>
              </v-row>
            </v-container>
            <v-progress-linear v-if="tagsFromVideos.length>0" :value="meter" 
              :height="meterHeight" class="performer-meter"/>
          </v-expansion-panel-content>
          <div class="profile-hover-btn show">Show Profile</div>
          <div class="profile-hover-btn hide">Hide Profile</div>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>

    <v-container fluid
      v-if="!$store.state.Videos.filteredEmpty" 
      class="pagination-container" 
    >
      <v-overflow-btn v-model="videosPerPage" hint="items per page" persistent-hint
        :items="videosPerPagePreset" dense height="36" solo disable-lookup hide-no-data
        class="items-per-page-dropdown"
      ></v-overflow-btn>
      <v-spacer></v-spacer>
      <v-pagination v-model="videosCurrentPage" :length="videosPagesSum"
        :total-visible="getNumberOfPagesLimit" style="z-index:1"/>
      <v-spacer></v-spacer>
      <v-overflow-btn v-if="videosPagesSum > 5"
        v-model="videosCurrentPage" :items="pages" dense height="36" solo
        class="items-per-page-dropdown jump-to-page-menu" 
        disable-lookup hint="jump to page" persistent-hint hide-no-data
        :menu-props="{ 
          auto:true, 
          contentClass:'jump-to-page-menu',
          nudgeBottom: -110,
          origin:'center center', 
          transition:'scale-transition'
        }"
      ></v-overflow-btn>
      <div v-else style="min-width:80px;"></div>
    </v-container>

    <div v-if="$store.state.Videos.filteredEmpty" class="text-center pt-10">
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching videos for the selected filters.
    </div>

    <Loading />

    <v-container fluid class="videos-grid" :class="[cardSize, gapSize]">
      <!-- Video Blocks parsing -->
      <VideoCard v-for="(video) in videosOnPage" :key="video.id" :video="video"/>
    </v-container>

    <v-pagination class="pt-10 pb-16"
      v-if="!$store.state.Videos.filteredEmpty"
      v-model="videosCurrentPage"
      :length="videosPagesSum"
      :total-visible="getNumberOfPagesLimit"
    ></v-pagination>
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>
    
    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    
    <DialogEditPerformerInfo v-if="$store.state.Performers.dialogEditPerformerInfo"/>
    <DialogEditPerformerImages v-if="$store.state.Performers.dialogEditPerformerImages"/>
  </vuescroll>
</template>


<script>
const fs = require("fs")
const path = require("path")
import CountryFlag from 'vue-country-flag'
import VideosGrid from '@/mixins/VideosGrid'
import Countries from '@/mixins/Countries'
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'PerformerPage',
  mixins: [VideosGrid, Countries, ShowImageFunction],
  components: {
    CountryFlag,
    DialogEditPerformerInfo: () => import('@/components/pages/performers/DialogEditPerformerInfo.vue'),
    DialogEditPerformerImages: () => import('@/components/pages/performers/DialogEditPerformerImages.vue'),
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
      this.updateMeter()
    })
  },
  data: () => ({
    currentYear: new Date().getFullYear(),
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    isScrollToTopVisible: false,
    percentValue: 5.263,
    meter: 0,
    header: '',
    isHeaderImageExists: true,
    activeTags: [],
    activeWebsites: [],
  }),
  computed: {
    gradient() {
      let color = this.$vuetify.theme.isDark ? '#121212' : '#fff'
      return `background: linear-gradient(to top, ${color}, rgba(0,0,0,.0) 30%)`
    },
    gradientImage() {
      let color = this.$vuetify.theme.isDark ? '#121212' : '#fff'
      return `90deg, ${color}, rgba(0,0,0,.0), ${color}`
    },
    profileBackground() {
      let color = this.$vuetify.theme.isDark ? '30,30,30':'255,255,255'
      return `background-color: rgba(${color},.3)`
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
    profileCompleteProgress() {
      let appParams = [
        'name', 
        'start', 
        'category',
        'birthday', 
        'nation', 
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
    // profile: {
    //   get() {
    //     return this.$store.state.Settings.performerProfile
    //   },
    //   set(profile) {
    //     this.$store.dispatch('updateSettingsState', {key:'performerProfile', value:profile})
    //   },
    // },
    // TODO: save profile expansion-panels state
    showTags: {
      get() {
        return this.$store.state.Settings.performerProfileTags
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'performerProfileTags', value})
      },
    },
    showWebsites: {
      get() {
        return this.$store.state.Settings.performerProfileWebsites
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'performerProfileWebsites', value})
      },
    },
    aliases() {      
      if (!this.performer.aliases.length) return 'none'
      return this.performer.aliases.join(', ')
    },
    nation() {
      if (!this.performer.nation) return ''
      let countryIndex = this.countries.findIndex(country => country.name === this.performer.nation)
      return this.countries[countryIndex].code
    },
    country() {
      if (!this.performer.nation) return 'Nationality unknown'
      let countryIndex = this.countries.findIndex(country => country.name === this.performer.nation)
      return this.countries[countryIndex].name
    },
    ethnicity() {
      if (!this.performer.ethnicity) return '??'
      return this.performer.ethnicity.join(", ")
    },
    hair() {
      if (!this.performer.hair) return '??'
      return this.performer.hair.join(", ")
    },
    eyes() {
      if (!this.performer.eyes) return '??'
      return this.performer.eyes.join(", ")
    },
    height() {
      if (!this.performer.height) return '??'
      return this.performer.height
    },
    weight() {
      if (!this.performer.weight) return '??'
      return this.performer.weight
    },
    bra() {
      if (!this.performer.bra) return '??'
      return Math.floor(this.performer.bra*2.54)
    },
    waist() {
      if (!this.performer.waist) return '??'
      return Math.floor(this.performer.waist*2.54)
    },
    hip() {
      if (!this.performer.hip) return '??'
      return Math.floor(this.performer.hip*2.54)
    },
    cups() {
      if (!this.performer.cups.length) return '??'
      return this.performer.cups.join(', ')
    },
    boobs() {
      if (!this.performer.boobs) return '??'
      return this.performer.boobs.join(', ')
    },
    category() {
      if (!this.performer.category.length) return '??'
      return this.performer.category.join(', ')
    },
    performer() {
      return this.$store.getters.performers.find({ id: this.performerId }).value()    
    },
    performerId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    videosOnPage() {
      return this.$store.getters.videosOnPage
    },
    totalCareer() {
      let years
      if (this.performer.start && this.performer.end) {
        years = this.performer.end - this.performer.start
      } else if (this.performer.start == this.currentYear) {
        years = 1
      } else if (this.performer.start && !this.performer.end) {
        years = this.currentYear - this.performer.start
      } else { years = 0 }
      return years
    },
    careerStatus() {
      let status
      if (this.performer.end) status = 'Retired'
      if (!this.performer.end && this.performer.start) status = 'Active'
      if (!this.performer.end && !this.performer.start) status = 'Unknown'
      return status
    },
    careerStart() {
      let value
      if (this.performer.start) value = this.performer.start
      if (!this.performer.start) value = '???'
      return value
    },
    careerEnd() {
      let value
      if (this.performer.end) value = this.performer.end
      if (!this.performer.end && this.performer.start) value = 'Now'
      if (!this.performer.end && !this.performer.start) value = '???'
      return value
    },
    getAge() {
      let age
      if(this.performer.birthday) {
        age = this.performer.birthday.match(/\d{4}/)[0]
        age = this.currentYear - age
      } else { age = '??' }
      return age
    },
    getLastActiveAge() {
      let age 
      if(this.performer.birthday) {
        age = this.performer.birthday.match(/\d{4}/)[0]
        if (this.performer.end) {
          age = this.performer.end - age
        } else if (this.performer.start && !this.performer.end) {
          age = this.currentYear - age
        } else {
          age = '??'
        }
      } else { age = '??' }
      return age
    },
    getBirthday() {
      if(this.performer.birthday) return this.performer.birthday
      else return '??'
    },
    cardSize() {
      return `card-size-${this.$store.state.Settings.videoCardSize}`
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    tabId() {
      return this.$route.query.tabId
    },
    filtersTab() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id:this.tabId}).value().filters    
      }
    },
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
    },
    params() {
      return this.$store.state.Settings.customParametersPerformer
    },
  },
  methods: {
    addNewTabPerformer() {
      let tabId = this.performerId
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
    getTagId(itemName) {
      return this.$store.getters.tags.find({name: itemName}).value().id
    },
    addNewTabWebsite(websiteName) {
      let tabId = this.getWebsiteId(websiteName)
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with website "${websiteName}" already exists`
        })
        return
      }
      let tab = { 
        name: websiteName,
        link: `/website/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'web'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    getWebsiteId(itemName) {
      return this.$store.getters.websites.find({name: itemName}).value().id
    },
    copyPerformerNameToClipboard() {
      navigator.clipboard.writeText(this.performer.name).then(function() {
        console.log('Async: Copying to clipboard was successful!');
      }, function(err) {
        console.error('Async: Could not copy text: ', err);
      });
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 500) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
      // parallax effect
      this.header = `top:${vertical.scrollTop * 0.7}px`
    },
    initFilters() {
      if (this.tabId === 'default' || typeof this.filtersTab === 'undefined') {
        this.$store.state.Settings.videoFilters = [{
          param: 'performers',
          cond: 'all',
          val: [this.performer.name],
          type: 'array',
          flag: null,
          lock: true,
        },{
          param: 'tags',
          cond: 'all',
          val: this.getFilteredTags(),
          type: 'array',
          flag: null,
          lock: true,
        },{
          param: 'website',
          cond: 'includes',
          val: this.getFilteredWebsites(),
          type: 'select',
          flag: null,
          lock: true,
        }]
        this.$store.dispatch('filterVideos', true)
      } else {
        this.$store.state.Settings.videoFilters = _.cloneDeep(this.filtersTab)
        this.$store.dispatch('filterVideos', true)
      }
    },
    getImgUrl(imgType) {
      let imgPath = path.join(this.pathToUserData, `/media/performers/${this.performerId}_${imgType}.jpg`)
      return this.checkHeaderImageExist(imgPath, imgType)
    },
    checkHeaderImageExist(imgPath, imgType) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else if (imgType === "avatar") {
        let imgMainPath = path.join(this.pathToUserData, `/media/performers/${this.performerId}_main.jpg`)
        if (fs.existsSync(imgMainPath)) {
          return imgMainPath
        } else {
          return path.join(this.pathToUserData, '/img/templates/avatar.png')
        }
      } else if (imgType === "header") {
        this.isHeaderImageExists = false
        let imgMainPath = path.join(this.pathToUserData, `/media/performers/${this.performerId}_main.jpg`)
        if (fs.existsSync(imgMainPath)) {
          return imgMainPath
        } else {
          return path.join(this.pathToUserData, '/img/templates/header.png')
        }
      } else if (imgType === "main") {
        return path.join(this.pathToUserData, '/img/templates/performer.png')
      } else if (imgType === "alt") {
        return path.join(this.pathToUserData, '/img/templates/performer_back.png')
      } else {
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    updateMeter(value) {
      if(this.tagsFromVideos.length>0) {
        this.meter = 0
        for (let i=0; i < this.tagsFromVideos.length; i++) {
          this.meter += this.tagInPercentsOfMeter(this.getTagValue(this.tagsFromVideos[i]))
        }
        this.meter = this.meter * (1 + this.meterMultiplier / 50)
      }
    },
    getTagValue(tagName) {
      return this.$store.getters.tags.find({name:tagName}).value().value
    },
    tagInPercentsOfMeter(tagValue) {
      if (tagValue != 0) {
        return (tagValue / this.$store.getters.sumOfTagsValue) * 100
      } else return 0
    },
    getFilteredTags() {
      let active = this.activeTags
      let all = this.tagsFromVideos
      let filtered = [] 
      for (let i=0; i<active.length; i++) {
        filtered.push(all[active[i]])
      }
      return filtered
    },
    getFilteredWebsites() {
      let active = this.activeWebsites
      let all = this.performer.websites
      let filtered = [] 
      for (let i=0; i<active.length; i++) {
        filtered.push(all[active[i]])
      }
      return filtered
    },
    updateFilters() {
      const defaults = [{
        param: 'performers',
        cond: 'all',
        val: [this.performer.name],
        type: 'array',
        flag: null,
        lock: true,
      },{
        param: 'tags',
        cond: 'one of',
        val: this.getFilteredTags(),
        type: 'array',
        flag: null,
        lock: true,
      },{
        param: 'website',
        cond: 'includes',
        val: this.getFilteredWebsites(),
        type: 'select',
        flag: null,
        lock: true,
      }]
      const others = _.filter(this.$store.state.Settings.videoFilters, {lock: false})
      this.$store.state.Settings.videoFilters = [...defaults, ...others]
      this.$store.dispatch('filterVideos')
    },
    getCustomParamValue(name, type) {
      if (type == 'array') {
        if (this.performer[name].length) {
          return this.performer[name].join(',')
        } else return '??'
      } else if (type == 'boolean') {
        if (this.performer[name]) {
          return 'Yes'
        } else return 'No'
      } else {
        if (this.performer[name].length) {
          return this.performer[name]
        } else return '??'
      }
    },
  },
  watch: {
    activeTags() {
      this.updateFilters()
    },
    activeWebsites() {
      this.updateFilters()
    },
    $route(newRoute) {
      if (!this.$route.path.includes('/performer/:')) return
      this.initFilters()
      this.updateMeter()
    },
    meterMultiplier() {
      this.updateMeter()
    },
  }
}
</script>


<style lang="less">
.header-images {
  &.header {
    position: absolute;
    width: 100%;
  }
  .images {
    display: flex;
    justify-content: space-between;
    position: absolute;
    width: 100%;
    overflow: hidden;
  }
}
.header-image {
  position: absolute;
  width: 100%;
  &-wrapper {
    .v-image__image {
      z-index: 1;
    }
  }
}
.header-gradient {
  position: absolute;
  width: 100%;
  height: 100%;
}
.profile-container {
  position: relative; 
  &.header {
    margin-top: -150px;
  }
  .buttons-left,
  .buttons-right {
    position: absolute;
    top: 25px;
    z-index: 2;
  }
  .buttons-left {
    left: 25px;
  }
  .buttons-right {
    right: 25px;
  }
  .profile-avatar {
    position: absolute;
    top: -70px;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 3;
    img {
      height: auto;
      border-radius: 0;
      position: absolute;
      top: 0;
    }
  }
  .profile-name {
    padding-top: 80px;
    font-size: 2rem;
    letter-spacing: 0.1666666667em !important;
    line-height: 2rem;
    text-transform: uppercase;
  }
  .profile-complete-progress {
    position: absolute;
    .value {
      position: absolute;
      bottom: 2px;
      font-size: 12px;
      padding: 0 3px;
      background-color: rgba(133, 133, 133, 0.3);
      border-radius: 10px;
      .percent {
        margin-left: 1px;
        font-size: 0.7em;
      }
    }
  }
  .profile-complete-label {
    position: absolute;
    right: 0;
  }
  .performer-meter {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
  }
  .v-expansion-panel-header {
    overflow: hidden;
    &--active {
      & + .v-expansion-panel-content {
        & + .profile-hover-btn {
          &.show {
            display: none;
          }
          & + .profile-hover-btn {
            &.hide {
              display: flex !important;
            }
          }
        }
      }
    }
    &:hover {
      & + .v-expansion-panel-content {
        & + .profile-hover-btn {
          opacity: 1;
          transform: translateY(0);
          & + .profile-hover-btn {
            opacity: 1;
            transform: translateY(0);
            &.hide {
              display: none;
            }
          }
        }
      }
    }
  }
  .profile-hover-btn {
    text-transform: uppercase;
    font-size: 14px;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 150px;
    height: 40px;
    bottom: -40px;
    left: 0;
    right: 0;
    margin: auto;
    border-radius: 0 0 5px 5px;
    border-right: 1px solid #5c5c5c;
    border-left: 1px solid #5c5c5c;
    border-bottom: 1px solid #5c5c5c;
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-10px);
    transition: .2s all ease;
    opacity: 0;
    z-index: -5;
  }
  .tags-from-videos {
    .v-slide-group__content {
      justify-content: center;
      .active-chip {
        background: #777 !important;
        color: #fff;
      }
    }
  }
}
.age-container {
  font-weight: 300;
  letter-spacing: 0.5px;
  .age {
    i {
      font-style: normal;
      font-size: 14px;
    }
    span {
      font-size: 17px;
      font-weight: bold;
    }
  }
  .last {
    i {
      font-size: 13px;
    }
  }
  .birth {
    margin-top: 5px;
    i {
      font-size: 14px;
      font-style: normal;
    }
    span {
      font-weight: bold;
    }
  }
}
.nationality {
  display: flex;
  align-items: center;
  .country {
    font-weight: 300;
    letter-spacing: 0.3px;
  }
}
.career-status {
  text-transform: uppercase;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #fff;
  padding: 4px 8px;
  border-radius: 5px;
  display: inline-flex;
  margin-bottom: 10px;
  &.active {
    background-color: rgb(8, 179, 51);
  }
  &.retired {
    background-color: rgb(255, 153, 0);
  }
  &.unknown {
    background-color: rgb(112, 112, 112);
  }
} 
.career {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 60px;
  .line {
    border-top: 2px solid var(--v-secondary-base);
    position: absolute;
    padding-bottom: 4px;
    bottom: 0;
    width: 100%;
    &:after,
    &:before {
      content: '';
      position: absolute;
      border: 2px solid var(--v-secondary-base);
      border-radius: 50%;
      width: 10px;
      height: 10px;
      bottom: 0;
      background-color: #fff;
    }
    &:after {
      right: 0;
    }
    &:before {
      left: 0;
    }
  }
  .start {
    left: 0;
  }
  .end {
    right: 0;
  }
  .text {
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    width: 100%;
    text-align: center;
  }
  .bold-text {
    font-weight: bold;
    display: inline-block;
  }
  .light-text {
    font-weight: 300;
    font-size: 14px;
  }
  .value {
    position: absolute;
    bottom: 20px;
    font-size: 18px;
  }
}
.param {
  font-weight: 300;
  display: inline-block;
  margin-right: 15px;
  b {
    font-weight: bold;
  }
  i {
    font-style: normal;
    font-size: 12px;
  }
}
</style>

<style lang="less" scoped>
.performer-header {
  text-transform: uppercase;
  color: #fff;
  font-size: 100px;
  opacity: 0.6;
  &-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.spacer {
  height: 150px;
}
</style>