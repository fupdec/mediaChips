<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)"
      :class="{favorite: isFavorite}" class="video-card" height="100%"
      :data-id="video.id" outlined hover @contextmenu="showContextMenu"
    >
      <v-img @click.middle="addNewTabVideo"
        @mouseover="playPreview" @mouseleave="stopPlayingPreview"
        :aspect-ratio="16/9" class="video-preview-container"
      >
        <v-img @click="openVideoPage" title="Open video page"
          :src="getImgUrl(video.id)" :aspect-ratio="16/9" class="thumb"
        />
        <v-btn
          icon x-large outlined
          class="btn-play" color="white"
          @click="playVideo(video.path)"
        >
          <v-icon size="40">mdi-play</v-icon>
        </v-btn>

        <div v-if="errorThumb" class="error-load-thumb">
          unable to find thumb for this video
        </div>

        <v-rating
          v-model="video.rating"
          @input="changeRating($event, video.id)"
          class="video-rating" :class="{hidden: isRatingHidden}"
          color="yellow darken-2"
          background-color="rgba(255,255,255,0.2)"
          empty-icon="mdi-star-outline"
          half-icon="mdi-star-half-full"
          dense half-increments hover size="18" clearable
        ></v-rating>
        
        <v-btn @click="isFavorite = !isFavorite" icon absolute small
          :color="isFavorite===false ? 'white' : 'pink'"
          class="fav-btn" :class="{hidden: isFavoriteHidden}"
        > <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart-outline</v-icon>
        </v-btn>
        
        <div class="video-info-duration" :class="{hidden: isDurationHidden}">
          {{calcDur(video.duration)}}
        </div>

        <div label outlined class="video-info-resolution"
          :class="{hidden: isQualityLabelHidden}">
          <div class="text text-no-wrap">{{calcHeightTitle(video.height)}}</div>
          <div class="value">
            <span v-if="video.height==2160">4K</span>
            <span v-else>{{video.height}}p</span>
          </div>
        </div>
        <div class="preview-mp4" v-if="!errorVideo" @click="openVideoPage">
          <video ref="preview">
            <source :src="getVideoUrl(video.id)" type="video/mp4">
          </video>
        </div>
      </v-img>
      <v-card-text class="pa-2 video-card-title" :class="{hidden: isFileNameHidden}">
        <span :title="fileName">{{ fileName }}</span> 
      </v-card-text>

      <v-divider></v-divider>

      <!-- Video meta -->
      <v-card-actions class="video-info-props pa-1" :class="{hidden: isFileInfoHidden}">
        <div label outlined class="video-info-prop" :title="videoPath">
          <v-icon size="16">mdi-file-search</v-icon>
          <span class="value">Path</span>
        </div>
        <div label outlined class="video-info-prop">
          <v-icon left class="mr-1" size="16">mdi-file-video</v-icon>
          {{getFileExtension()}}
        </div>
        <div label outlined class="video-info-prop">
          <v-icon left class="mr-1" size="16">mdi-harddisk</v-icon>
          {{calcSize(video.size)}}
          <span class="value">{{calcSizeValue(video.size)}}</span>
        </div>
        <div label outlined class="video-info-prop">
          <v-icon left class="mr-1" size="16">mdi-filmstrip-box</v-icon>
          {{Math.floor(video.bitrate/1000000)}}
          <span class="value">Mbps</span>
        </div>
      </v-card-actions>
      
      <v-divider v-if="!isFileInfoHidden"></v-divider>
      <!-- END Video meta -->

      <v-card-actions class="px-1 py-0 performers" :class="{hidden: isPerformersHidden}">
        <v-chip-group column >
          <span class="caption text--secondary mr-2">Performers</span>
          <v-chip v-for="performer in video.performers" :key="performer"
            :x-small="isChipsXS" :small="isChipsS"
            :color="colorDependsRating(performer)" :to="performerLink(performer)"
            @mouseover.stop="showImage($event, getPerformerId(performer), 'performer')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabPerformer(performer)"
          >
            <v-icon v-if="isFavoritePerformer(performer)" 
              class="mr-1" color="pink" size="11"
            > mdi-heart </v-icon> {{ performer }} 
          </v-chip>
        </v-chip-group>
      </v-card-actions>

      <v-card-actions class="px-1 py-0 video-tags" :class="{hidden: isTagsHidden}">
        <v-chip-group column>
          <span class="caption text--secondary mr-2">Tags</span>
          <v-chip v-for="tag in video.tags" :key="tag" :to="tagLink(tag)"
            :x-small="isChipsXS" :small="isChipsS" outlined :color="colorTag(tag)"
            @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabTag(tag)"
          > {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-card-actions>

      <v-card-actions class="px-1 py-0 website" :class="{hidden: isWebsiteHidden}">
        <span class="caption text--secondary mr-2">Website</span>
        <v-chip v-if="video.website" :x-small="isChipsXS" :small="isChipsS"
          label outlined :color="colorWebsite" :to="websiteLink(video.website)"
          @mouseover.stop="showImage($event, getWebsiteId(video.website), 'website')" 
          @mouseleave.stop="$store.state.hoveredImage=false"
          @click="$store.state.hoveredImage=false"
          @click.middle="addNewTabWebsite(video.website)"
        > {{ video.website }} </v-chip>
      </v-card-actions>
      
      <v-icon v-if="video.bookmark" class="bookmark" color="red" size="28">
        mdi-bookmark
      </v-icon>

      <v-btn @click="$store.state.Videos.dialogEditVideoInfo=true"
        color="secondary" fab x-small class="btn-edit" :class="{hidden: isEditBtnHidden}">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const { dialog } = require('electron').remote
const shell = require('electron').shell
const fs = require('fs')
const path = require('path')

import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'VideoCard',
  props: {
    video: Object,
  },
  mixins: [ShowImageFunction],
  mounted() {
    this.$nextTick(function () {
    })
  },
  updated() {
    this.getChipsSize()
  },
  data: () => ({
    errorThumb: false,
    errorVideo: false,
    isChipsXS: true,
    isChipsS: false,
  }),
  computed: {
    isChipsColored() {
      return this.$store.state.Videos.videoChipsColored
    },
    isEditBtnHidden() {
      return this.$store.state.Videos.videoEditBtnHidden 
    },
    isFileNameHidden() {
      return this.$store.state.Videos.videoFileNameHidden 
    },
    isFileInfoHidden() {
      return this.$store.state.Videos.videoFileInfoHidden 
    },
    isRatingHidden() {
      return this.$store.state.Videos.videoRatingHidden 
    },
    isFavoriteHidden() {
      return this.$store.state.Videos.videoFavoriteHidden
    },
    isQualityLabelHidden() {
      return this.$store.state.Videos.videoQualityLabelHidden
    },
    isDurationHidden() {
      return this.$store.state.Videos.videoDurationHidden
    },
    isPerformersHidden() {
      return this.$store.state.Videos.videoPerformersHidden
    },
    isTagsHidden() {
      return this.$store.state.Videos.videoTagsHidden
    },
    isWebsiteHidden() {
      return this.$store.state.Videos.videoWebsiteHidden
    },
    videoPath() {
      return path.parse(this.video.path).dir
    },
    colorWebsite() {
      if (this.isChipsColored) {
        return this.$store.getters.websites.find({name:this.video.website}).value().color
      } else return ''
    },
    fileName() {
      let filename = this.video.path.split("\\").pop()
      return filename.split('.').slice(0, -1).join('.')
    },
    isFavorite: {
      get() {
        return this.video.favorite
      },
      set(value) {
        this.video.favorite = value
        this.$store.getters.videos.find({id: this.video.id}).assign({favorite: value}).write()
        this.$store.commit('updateVideos')
      },
    },
    chipsSize() {
      return this.$store.state.Settings.videoCardSize
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    addNewTabVideo() {
      let tabId = this.video.id + new Date().getTime()
      let tab = { 
        name: this.fileName,
        link: `/video/:${this.video.id}?tabId=${tabId}`,
        id: tabId,
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    addNewTabPerformer(performerName) {
      let tabId = this.getPerformerId(performerName) + new Date().getTime()
      let tab = { 
        name: performerName,
        link: `/performer/:${this.getPerformerId(performerName)}?tabId=${tabId}`,
        id: tabId,
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    addNewTabTag(tagName) {
      let tabId = this.getTagId(tagName) + new Date().getTime()
      let tab = { 
        name: tagName,
        link: `/tag/:${this.getTagId(tagName)}?tabId=${tabId}`,
        id: tabId,
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    addNewTabWebsite(websiteName) {
      let tabId = this.getWebsiteId(websiteName) + new Date().getTime()
      let tab = { 
        name: websiteName,
        link: `/website/:${this.getWebsiteId(websiteName)}?tabId=${tabId}`,
        id: tabId,
        icon: 'web'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    getPerformerId(itemName) {
      return this.$store.getters.performers.find({name: itemName}).value().id
    },
    getTagId(itemName) {
      return this.$store.getters.tags.find({name: itemName}).value().id
    },
    getWebsiteId(itemName) {
      return this.$store.getters.websites.find({name: itemName}).value().id
    },
    openVideoPage() {
      this.$router.push(`/video/:${this.video.id}?tabId=default`)
    },
    playPreview() {
      if (this.$refs.preview) {
        this.$refs.preview.loop = true
        this.$refs.preview.play()
      } 
    },
    stopPlayingPreview() {
      if (this.$refs.preview) {
        // console.log(this.$refs.preview)
        this.$refs.preview.pause()
        this.$refs.preview.currentTime = 0
      }
    },
    calcSize(size) {
      let totalSize
      if (size > 1000000000) {
        totalSize = (size/1024/1024/1024-0.01).toFixed(2)
      } else {
        totalSize = (size/1024/1024-0.01).toFixed(0)
      }
      return totalSize
    },
    calcSizeValue(size) {
      let sizeValue = (size/1024/1024/1024-0.01).toFixed(2)
      if (sizeValue < 1) {
        sizeValue = 'Mb'
      } else {
        sizeValue = 'Gb'
      }
      return sizeValue
    },
    calcHeightTitle(height) {
      let title = {}
      if (height < 720) {
        title = 'SD'
      } else if (height >= 720 && height < 1080) {
        title = 'HD'
      } else if (height >= 1080 && height < 1800) {
        title = 'FHD'
      } else if (height >= 1800) {
        title = 'UHD'
      }
      return title
    },
    calcDur(duration) {
      var sec = Math.floor(duration);
      var h = sec/3600 ^ 0 ;
      var m = (sec-h*3600)/60 ^ 0 ;
      var s = sec-h*3600-m*60 ;
      h = h<10?"0"+h+":":h
      if (h === "00:") h = ""
      m = m<10?"0"+m:m
      s = s<10?"0"+s:s
      var total = h+m+":"+s
      return total
    },
    getFileExtension() {
      let filename = this.video.path.split("\\").pop()
      return filename.split('.').pop()
    },
    getImgUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return this.checkImageExist(imgPath)+'?lastmod='+Date.now()
    },
    getVideoUrl(videoId) {
      let videoPath = path.join(this.pathToUserData, `/media/previews/${videoId}.mp4`)
      return this.checkVideoExist(videoPath)+'?lastmod='+Date.now()
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        this.errorThumb = true
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    checkVideoExist(videoPath) {
      if (fs.existsSync(videoPath)) {
        return videoPath
      } else {
        this.errorVideo = true
        return path.join(this.pathToUserData, '/img/templates/preview.mp4')
      }
    },
    playVideo(pathToVideo) {
      shell.openItem(pathToVideo)
    },
    changeRating(stars, videoID) {
      this.$store.getters.videos
        .find({ id: videoID })
        .assign({ rating: stars })
        .write()
    },
    getPerformerByName(performer) {
      return this.$store.getters.performers.find({name:performer}).value()
    },
    performerLink(performer) {
      return `/performer/:${this.getPerformerByName(performer).id}`
    },
    tagLink(tag) {
      return `/tag/:${this.getTagId(tag)}`
    },
    websiteLink(website) {
      return `/website/:${this.getWebsiteId(website)}`
    },
    colorDependsRating(performer) {
      let rating = this.getPerformerByName(performer).rating
      if (this.isChipsColored) {
        if (rating === 0) {
          return `rgba(150, 150, 150, 0.1)`
        } else {
          return `rgba(255, 190, 0, ${0.1 * rating})`
        }
      } else return ''
    },
    isFavoritePerformer(performer) {
      return this.getPerformerByName(performer).favorite
    },
    colorTag(tag) {
      if (this.isChipsColored) {
        return this.$store.getters.tags.find({name:tag}).value().color
      } else return ''
    },
    showContextMenu(e) {
      e.preventDefault()
      this.$store.state.Videos.menuCard = false
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
      this.$nextTick(() => {
        this.$store.state.Videos.menuCard = true
      })
    },
    getChipsSize() {
      switch(this.chipsSize) {
        case 1: this.isChipsXS = true; this.isChipsS = false; break;
        case 2: this.isChipsXS = true; this.isChipsS = false; break;
        case 3: this.isChipsXS = false; this.isChipsS = true; break;
        case 4: this.isChipsXS = false; this.isChipsS = true; break;
        case 5: this.isChipsXS = false; this.isChipsS = false; break;
      }
    },
  },
  watch: {
    chipsSize(newSize, oldSize) {
      this.getChipsSize()
    }
  }
}
</script>

<style lang="less">
.video-card {
  box-shadow: 0px 3px 3px 2px rgba(0, 0, 0, 0.12);
  cursor: default;
  .v-image {
    cursor: pointer;
  }
  &:hover {
    .bookmark {
      opacity: 0.7;
      &:hover {
        opacity: 1;
      }
    }
    .btn-edit {
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }
  }
  .btn-edit {
    position: absolute;
    right: 5px;
    bottom: 5px;
    opacity: 0;
    &.hidden {
      display: none;
    }
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
    .video-preview-container {
      &:before {
        opacity: 1;
      }
    }
  }
  .v-input__append-inner {
    display: none;
  }
  .v-text-field input {
    font-size: 12px;
  }
  .v-chip {
    margin: 1px 2px !important;
    padding: 0 5px;
  }
  .performers {
    padding-left: 20px;
    .caption {
      letter-spacing: 0 !important;
    }
    &.hidden {
      display: none;
    }
  }
  &.theme--dark {
    .video-card-title {
      &:before {
        background-image: linear-gradient(to right, transparent, #1e1e1e);
      }
    }
  }
  .theme--light.v-text-field > .v-input__control > .v-input__slot:before {
    border-color: rgba(0, 0, 0, 0.1);
  }
  .theme--dark.v-text-field > .v-input__control > .v-input__slot:before {
    border-color: rgba(255, 255, 255, 0.05);
  }
  .website {
    padding-top: 2px !important;
    padding-bottom: 2px !important;
    .caption {
      letter-spacing: 0 !important;
    }
    &.hidden {
      display: none;
    }
  }
  .v-chip-group .v-slide-group__content {
    padding: 2px 0;
  }
  .bookmark {
    position: absolute;
    top: -6px;
    right: 0;
    left: 0;
    margin: auto;
    opacity: 0.4;
    pointer-events: none;
  }
}
.error-load-thumb {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
  color: #fff;
  pointer-events: none;
  user-select: none;
}
.video-preview-container {
  transition: .2s all ease;
  border-radius: 5px 5px 0 0;
  &:before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1;
    opacity: 0;
    background-image: linear-gradient(225deg, #ff004b 0%, rgba(0, 0, 0, 0) 13%, rgba(0, 0, 0, 0));
    transition: 1s all ease;
    pointer-events: none;
  }
  .thumb {
    width: 100%;
    position: absolute;
  }
  .preview-mp4 {
    opacity: 0;
    width: 100%;
    height: 100%;
    display: flex;
    transition: .35s all ease;
    overflow: hidden;
    position: absolute;
    video {
      min-width: 100%;
      min-height: 100%;
      object-fit: cover;
    }
  }
  .video-rating,
  .video-info-duration,
  .video-info-resolution,
  .btn-play {
    z-index: 5;
  }
  .video-info-duration,
  .video-info-resolution {
    pointer-events: none;
  }
  &:hover {
    .preview-mp4 {
      opacity: 1;
    }
    .btn-play {
      opacity: 0.2;
      &:hover {
        opacity: 1;
      }
    }
    .v-icon.mdi-star:not(.yellow--text) {
      color: rgba(255, 255, 255, 0.5) !important;
    }
  }
}
.video-rating {
  position: absolute;
  bottom: 0;
  left: 0;
  line-height: 1;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  &.hidden {
    display: none;
  }
}
.btn-play {
  opacity: 0;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}
.video-info {
  &-duration {
    position: absolute;
    right: 3px;
    bottom: 3px;
    padding-right: 5px;
    font-weight: 300;
    font-size: 12px;
    border-radius: 3px;
    padding-left: 5px;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.5);
    user-select: none;
    &.hidden {
      display: none;
    }
  }
  &-resolution {
    position: absolute;
    min-width: 32px;
    left: 1px;
    top: 1px;
    font-weight: 300;
    color: #fff !important;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: stretch;
    text-align: center;
    border-radius: 2px;
    overflow: hidden;
    opacity: .7;
    &.hidden {
      display: none;
    }
    .text {
      font-size: 9px;
      font-weight: 600;
      width: 100%;
      background-color: rgb(236, 197, 22);
      color: #000;
      line-height: 1;
    }
    .value {
      font-size: 10px;
      width: 100%;
      background-color: #000;
      color: #ffffff;
      line-height: 1.1;
    }
  }
  &-prop {
    display: flex;
    align-items: center;
    font-weight: 300;
    font-size: 10px;
    user-select: none;
    .v-icon {
      opacity: 0.65;
    }
    .value {
      margin-left: 2px;
    }
    &s {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      &.hidden {
        display: none;
      }
    }
  }
}
.video-card-title {
  font-size: 12px;
  letter-spacing: -0.2px !important;
  overflow:hidden;
  white-space: nowrap;
  position: relative;
  &:before {
    content: '';
    position: absolute;
    right: 0;
    height: 100%;
    width: 20px;
    background-image: linear-gradient(to right, transparent, #fff);
  }
  &.hidden {
    display: none;
  }
}
.video-tags {
  .caption {
    letter-spacing: 0 !important;
  }
  &.hidden {
    display: none;
  }
}
.tag-with-favorite-performer {
  border: 1px solid rgba(255, 0, 85, 0.5) !important;
}
</style>