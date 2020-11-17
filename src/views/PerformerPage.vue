<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <v-img 
      :src="getImgUrl(performerId, 'header')" position="top" :aspect-ratio="2.3"
      :gradient="gradient"
    >
      <!-- TODO: ADD PARALLAX EFFECT -->
    </v-img>

    <v-container class="profile-container">
      <v-avatar max-width="160" width="160" height="160" class="profile-avatar"> 
        <v-img :src="getImgUrl(performerId, 'avatar')" position="top"></v-img>
      </v-avatar>
      <!-- TODO: add progress card complete status. maybe line on top card -->
      <v-btn @click="addNewTabPerformer" icon class="new-tab-btn" 
        title="Open performer in a new tab"><v-icon>mdi-tab-plus</v-icon>
      </v-btn>
      <v-btn @click="copyPerformerNameToClipboard" icon class="copy-name-btn" 
        title="Copy performer name to clipboard"><v-icon>mdi-content-copy</v-icon>
      </v-btn>
      <v-btn @click="$store.state.Performers.dialogEditPerformerInfo = true"
        icon class="profile-edit-btn" title="Edit info of performer">
        <v-icon>mdi-square-edit-outline</v-icon>
      </v-btn>
      <v-btn @click="$store.state.Performers.dialogEditPerformerImages = true"
        icon class="images-edit-btn" title="Edit images of performer">
        <v-icon>mdi-image-edit-outline</v-icon>
      </v-btn>
      <v-expansion-panels v-model="profile" focusable>
        <v-expansion-panel :style="profileBackground">
          <v-expansion-panel-header class="pa-6" ripple hide-actions>
            <div class="profile-name text-center">{{performer.name}}</div>
          </v-expansion-panel-header>
          <v-expansion-panel-content eager>
            <v-container>
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
                    <!-- TODO:FIX LAST ACTIVE AGE. IF NO INFO ABOUT CAREER -->
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
                <v-col cols="12" sm="4">
                  <div class="param">
                    <v-icon left size="16">mdi-account-group</v-icon>
                    Ethnicity <b>{{ethnicity}}</b>
                  </div><br>
                  <div class="param">
                    <v-icon left size="16">mdi-face-woman-outline</v-icon>
                    Hair color <b>{{hair}}</b>
                  </div><br>
                  <div class="param">
                    <v-icon left size="16">mdi-eye</v-icon>
                    Eyes color <b>{{eyes}}</b>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="param">Height <b>{{height}}</b> <i>cm</i></div>
                  <div class="param">Weight <b>{{weight}}</b> <i>kg</i></div><br>
                  <div class="param">Bra <b>{{bra}}</b> <i>cm</i></div>
                  <div class="param">Waist <b>{{waist}}</b> <i>cm</i></div>
                  <div class="param">Hip <b>{{hip}}</b> <i>cm</i></div><br>
                  <div class="param">Cup size <b>{{cup}}</b></div>
                  <div class="param">Boobs <b>{{boobs}}</b></div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="param">
                  <v-icon left size="16">mdi-human-handsdown</v-icon>
                    Body type <b>{{bodyType}}</b></div><br>
                  <div class="param">Pussy type <b>{{pussy}}</b></div>
                  <div class="param">Pussy lips size <b>{{pussyLips}}</b></div>
                  <div class="param">Pussy hair <b>{{pussyHair}}</b></div>
                </v-col>
                <v-col cols="12" class="text-center pb-0">
                  <v-chip v-for="tag in performer.tags" :key="tag" :to="tagLink(tag)"
                    outlined class="mr-2 mb-1 px-2"
                    @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    @click="$store.state.hoveredImage=false"
                    @click.middle="addNewTabTag(tag)"
                    >{{tag}}</v-chip>
                </v-col>
                <v-col v-if="tagsFromFVideos.length" cols="12" class="text-center py-0">
                  <div class="my-2 font-weight-light">Tags from videos</div>
                  <v-chip v-for="tag in tagsFromFVideos" :key="tag" :to="tagLink(tag)"
                    outlined small class="mr-2 mb-1 px-2"
                    @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    @click="$store.state.hoveredImage=false"
                    @click.middle="addNewTabTag(tag)"
                  >{{tag}}</v-chip>
                </v-col>
              </v-row>
            </v-container>
          </v-expansion-panel-content>
          <div class="profile-hover-btn show">Show Profile</div>
          <div class="profile-hover-btn hide">Hide Profile</div>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>

    <v-container fluid
      v-if="!$store.state.Videos.filteredEmpty" 
      class="pagination-container pt-16 mb-6" 
    >
      <v-overflow-btn class="items-per-page-dropdown"
        :items="videosPerPagePreset" dense height="36" solo
        @change="changeItemsPerPage()" disable-lookup hide-no-data
        v-model="videosPerPage" hint="items per page" persistent-hint
      ></v-overflow-btn>
      <v-spacer></v-spacer>
      <v-pagination 
        v-model="videosCurrentPage"
        :length="videosPagesSum"
        :total-visible="getNumberOfPagesLimit"
      ></v-pagination>
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

    <v-container fluid class="videos-grid" :class="cardSize">
      <!-- Video Blocks parsing -->
      <VideoCard v-for="(video) in videosOfPerformer" :key="video.id" :video="video"/>
    </v-container>

    <v-pagination class="pt-10 pb-16"
      v-if="!$store.state.Videos.filteredEmpty"
      v-model="videosCurrentPage"
      :length="videosPagesSum"
      :total-visible="getNumberOfPagesLimit"
    ></v-pagination>
    
    <div v-show="$store.getters.navigationSide=='0'" class="py-6"></div>
    
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
  },
  mounted() {
    this.$nextTick(function () {
      this.$store.commit('resetFilteredVideos')
      this.filterVideosByPerformer()
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
  }),
  computed: {
    gradient() {
      let color = this.$vuetify.theme.isDark ? '#121212' : '#fff'
      return `to top, ${color}, rgba(0,0,0,.0) 30%`
    },
    profileBackground() {
      let color = this.$vuetify.theme.isDark ? '30,30,30':'255,255,255'
      return `background-color: rgba(${color},.3)`
    },
    tagsFromFVideos() {
      let vids = this.$store.getters.videos
      vids = vids.filter(v=>v.performers.includes(this.performer.name)).map('tags').value()
      let tags = []
      vids.map(video=>{ if (video.length>0) video.map(tag=>tags.push(tag)) })
      tags = tags.filter((x, i, a) => a.indexOf(x) === i) // get unique values
      tags = tags.filter(el => (el !== null && el !== undefined))
      return tags.sort((a, b) => a.localeCompare(b))
    },
    profile: {
      get() {
        return eval(this.$store.getters.performerProfile)
      },
      set(profile) {
        this.$store.dispatch('changePerformerProfile', String(profile))
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
      return this.performer.bra
    },
    waist() {
      if (!this.performer.waist) return '??'
      return this.performer.waist
    },
    hip() {
      if (!this.performer.hip) return '??'
      return this.performer.hip
    },
    cup() {
      if (!this.performer.cup) return '??'
      return this.performer.cup
    },
    boobs() {
      if (!this.performer.boobs) return 'unknown'
      return this.performer.boobs
    },
    bodyType() {
      if (!this.performer.body.length) return '??'
      return this.performer.body.join(', ')
    },
    pussy() {
      if (!this.performer.pussy) return '??'
      return this.performer.pussy
    },
    pussyLips() {
      if (!this.performer.pussyLips) return '??'
      return this.performer.pussyLips
    },
    pussyHair() {
      if (!this.performer.pussyHair.length) return '??'
      return this.performer.pussyHair.join(', ')
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
    videosOfPerformer: {
      get() {
        return this.$store.getters.videosOnPage
      },
      set(value) {
        // this.$store.dispatch('rearrangeVideos', filteredVideos)
      },
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
        age = this.performer.birthday.match(/\d{4}$/)[0]
        age = this.currentYear - age
      } else { age = '??' }
      return age
    },
    getLastActiveAge() {
      let age 
      if(this.performer.birthday) {
        age = this.performer.birthday.match(/\d{4}$/)[0]
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
      let birthday
      if(this.performer.birthday) {
        let day = this.performer.birthday.match(/\d{2}/)[0]
        let month = this.performer.birthday.charAt(2)
        month += this.performer.birthday.charAt(3)
        let year = this.performer.birthday.match(/\d{4}$/)[0]
        birthday = `${day} ${this.months[month-1]} ${year}`
      } else { birthday = 'unknown' }
      return birthday
    },
    cardSize() {
      return `card-size-${this.$store.state.Settings.videoCardSize}`
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    addNewTabPerformer() {
      let tab = { 
        name: this.performer.name, 
        link: `/performer/:${this.performerId}`,
        id: this.performerId + new Date().getTime(),
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    addNewTabTag(tagName) {
      let tab = { 
        name: tagName,
        link: this.tagLink(tagName),
        id: this.getTagId(tagName) + new Date().getTime(),
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    tagLink(tag) {
      return `/tag/:${this.getTagId(tag)}`
    },
    getTagId(itemName) {
      return this.$store.getters.tags.find({name: itemName}).value().id
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
    },
    tagLink(tag) {
      return `/tag/:${this.getTagId(tag)}`
    },
    getTagId(itemName) {
      return this.$store.getters.tags.find({name: itemName}).value().id
    },
    filterVideosByPerformer() {
      this.updateFiltersOfVideos('performers', [this.performer.name])
    },
    updateFiltersOfVideos(key, value){
      this.$store.commit('updateFiltersOfVideos', {key, value})
      this.$store.dispatch('filterVideos')
    },
    getImgUrl(performerId, imgType) {
      let imgPath = path.join(this.pathToUserData, `/media/performers/${performerId}_${imgType}.jpg`)
      return this.checkHeaderImageExist(imgPath, imgType)+'?lastmod='+Date.now()
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
        let imgMainPath = path.join(this.pathToUserData, `/media/performers/${this.performerId}_main.jpg`)
        if (fs.existsSync(imgMainPath)) {
          return imgMainPath
        } else {
          return path.join(this.pathToUserData, '/img/templates/header.png')
        }
      } else {
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
  },
  watch: {
    performerId() {
      this.filterVideosByPerformer()
    },
  }
}
</script>


<style lang="less">
.profile-container {
  position: relative;
  margin-top: -150px; 
  .new-tab-btn {
    position: absolute;
    top: 25px;
    left: 25px;
    z-index: 2;
  }
  .copy-name-btn {
    position: absolute;
    top: 25px;
    left: 70px;
    z-index: 2;
  }
  .profile-edit-btn {
    position: absolute;
    top: 25px;
    right: 25px;
    z-index: 2;
  }
  .images-edit-btn {
    position: absolute;
    top: 25px;
    right: 70px;
    z-index: 2;
  }
  .profile-avatar {
    position: absolute;
    top: -70px;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 5;
    .v-image__image {
      border-radius: 50%;
    }
  }
  .profile-name {
    padding-top: 84px;
    font-size: 2rem;
    letter-spacing: 0.1666666667em !important;
    line-height: 2rem;
    text-transform: uppercase;
  }
  .v-expansion-panel-header {
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
</style>