<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" v-ripple="{ class: 'accent--text' }"
      :class="{favorite: isFavorite}" class="video-card" height="100%"
      :data-id="video.id" outlined hover @contextmenu="showContextMenu"
      :key="cardKey"
    >
      <v-responsive @click.middle="addNewTabVideo"
        @mouseover.capture="playPreview()" @mouseleave="stopPlayingPreview()"
        :aspect-ratio="16/9" class="video-preview-container"
      >
        <v-img @click="openVideoPage" title="Open video page"
          :src="getImgUrl(video.id)" :aspect-ratio="16/9" class="thumb"
        />
        <v-btn @click="playVideo" icon x-large outlined class="btn-play" color="white">
          <v-icon size="40">mdi-play</v-icon>
        </v-btn>

        <div v-if="errorThumb" class="error-load-thumb">
          unable to find thumb for this video
        </div>

        <v-rating v-if="!$store.state.Settings.ratingAndFavoriteInCard" 
          :value="video.rating" @input="changeRating($event, video.id)"
          class="rating" :class="{hidden: isRatingHidden}"
          color="yellow darken-2" background-color="grey darken-1"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover size="18" clearable />
        
        <v-btn v-if="!$store.state.Settings.ratingAndFavoriteInCard" 
          @click="isFavorite = !isFavorite" icon absolute small
          :color="isFavorite===false ? 'white' : 'pink'"
          class="fav-btn" :class="{hidden: isFavoriteHidden}"
        > <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart-outline</v-icon>
        </v-btn>
        
        <div class="duration" :class="{hidden: isDurationHidden}">
          {{calcDur(video.duration)}}
        </div>

        <div label outlined class="resolution"
          :class="{hidden: isQualityLabelHidden}">
          <div class="text text-no-wrap">{{calcHeightTitle(video.resolution)}}</div>
          <div class="value">
            <span>{{calcHeightValue(video.resolution)}}</span>
          </div>
        </div>
        <div @click="openVideoPage" class="preview"
          :style="`animation-delay: ${delayVideoPreview}.7s`">
          <video ref="video" autoplay muted loop />
        </div>
      </v-responsive>
      <v-card-text class="px-2 py-1 video-card-title" :class="{hidden: isFileNameHidden}">
        <span :title="fileName">{{ fileName }}</span> 
      </v-card-text>

      <v-divider></v-divider>

      <!-- Video meta -->
      <v-card-actions class="props pa-1" :class="{hidden: isFileInfoHidden}">
        <div label outlined class="prop" :title="videoPath">
          <v-icon size="16">mdi-file-search</v-icon>
          <span class="value">Path</span>
        </div>
        <div label outlined class="prop">
          <v-icon left class="mr-1" size="16">mdi-monitor-screenshot</v-icon>
          {{video.resolution}}
        </div>
        <div label outlined class="prop">
          <v-icon left class="mr-1" size="16">mdi-file-video</v-icon>
          {{getFileExtension()}}
        </div>
        <div label outlined class="prop">
          <v-icon left class="mr-1" size="16">mdi-harddisk</v-icon>
          {{calcSize(video.size)}}
        </div>
      </v-card-actions>
      
      <v-divider v-if="!isFileInfoHidden"></v-divider>
      <!-- END Video meta -->

      <v-card-actions v-if="$store.state.Settings.ratingAndFavoriteInCard" class="px-1 py-0">
        <v-rating :value="video.rating" @input="changeRating($event, video.id)"
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover size="18" clearable />
        <v-spacer></v-spacer>
        <v-btn @click="isFavorite = !isFavorite" small icon color="pink"> 
          <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart</v-icon>
        </v-btn>
      </v-card-actions>
      <v-divider v-if="$store.state.Settings.ratingAndFavoriteInCard"></v-divider>

      <v-card-actions class="px-1 py-0 performers" :class="{hidden: isPerformersHidden}">
        <v-chip-group column >
          <v-icon left>mdi-account-outline</v-icon>
          <v-chip v-for="performer in video.performers" :key="performer"
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
          <v-icon left>mdi-tag-outline</v-icon>
          <v-chip v-for="tag in video.tags" :key="tag" :to="tagLink(tag)"
            outlined :color="colorTag(tag)"
            @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabTag(tag)"
          > {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-card-actions>

      <v-card-actions class="px-1 py-0 website" :class="{hidden: isWebsiteHidden}">
        <v-icon left>mdi-web</v-icon>
        <v-chip v-if="video.website" label outlined :color="colorWebsite" :to="websiteLink(video.website)"
          @mouseover.stop="showImage($event, getWebsiteId(video.website), 'website')" 
          @mouseleave.stop="$store.state.hoveredImage=false"
          @click="$store.state.hoveredImage=false"
          @click.middle="addNewTabWebsite(video.website)"
        > {{ video.website }} </v-chip>
      </v-card-actions>
      
      <v-icon v-if="video.bookmark" class="bookmark" color="red" size="28" :title="bookmark">
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

import Functions from '@/mixins/Functions'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'
import { ipcRenderer } from 'electron'

export default {
  name: 'VideoCard',
  props: {
    video: Object,
    i: Number,
  },
  mixins: [ShowImageFunction, Functions, LabelFunctions],
  mounted() {
    this.$nextTick(function () {
      this.cardKey = this.video.id
    })
  },
  beforeDestroy() {
    try {
      this.$refs.video.src = ''
    } catch (error) {}
  },
  destroyed() {
    for (const timeout in this.timeouts) {
      clearTimeout(this.timeouts[timeout])
    }
  },
  data: () => ({
    errorThumb: false,
    errorPreview: false,
    isVideoHovered: false,
    timeouts: {},
    cardKey: '',
  }),
  computed: {
    updateCard() {
      return this.$store.state.Videos.updateCard
    },
    getVideoPath() {
      return this.video.path
    },
    isChipsColored() {
      return this.$store.state.Settings.videoChipsColored
    },
    isEditBtnHidden() {
      return this.$store.state.Settings.videoEditBtnHidden 
    },
    isFileNameHidden() {
      return this.$store.state.Settings.videoFileNameHidden 
    },
    isFileInfoHidden() {
      return this.$store.state.Settings.videoFileInfoHidden 
    },
    isRatingHidden() {
      return this.$store.state.Settings.videoRatingHidden 
    },
    isFavoriteHidden() {
      return this.$store.state.Settings.videoFavoriteHidden
    },
    isQualityLabelHidden() {
      return this.$store.state.Settings.videoQualityLabelHidden
    },
    isDurationHidden() {
      return this.$store.state.Settings.videoDurationHidden
    },
    isPerformersHidden() {
      return this.$store.state.Settings.videoPerformersHidden
    },
    isTagsHidden() {
      return this.$store.state.Settings.videoTagsHidden
    },
    isWebsiteHidden() {
      return this.$store.state.Settings.videoWebsiteHidden
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
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    bookmark() {
      return this.$store.getters.bookmarks.get('videos').find({itemId:this.video.id}).value().text
    },
    videoPreviewEnabled() {
      return this.$store.state.Settings.videoPreviewEnabled
    },
    videoPreviewGridEnabled() {
      return this.$store.state.Settings.videoPreviewGridEnabled
    },
    delayVideoPreview() {
      return this.$store.state.Settings.delayVideoPreview
    },
    ratingInCard() {
      return this.$store.state.Settings.videoRatingInCard
    },
  },
  methods: {
    addNewTabVideo() {
      let tabId = this.video.id
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with video ${this.fileName} already exists`
        })
        return
      }
      let tab = { 
        name: this.fileName,
        link: `/video/:${tabId}?tabId=${tabId}`,
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
    openVideoPage() {
      this.$router.push(`/video/:${this.video.id}?tabId=default`)
    },
    setVideoProgress(percent) {
      this.$refs.video.currentTime = Math.floor(this.video.duration*percent)
    },
    playPreview() {
      if (this.isVideoHovered || !this.videoPreviewEnabled) return
      this.isVideoHovered = true
      this.timeouts.z = setTimeout(()=>{
        if (!this.errorPreview) {
          // play preview
          let videoPath = path.join(this.pathToUserData, `/media/previews/${this.video.id}.mp4`)
          if (fs.existsSync(videoPath)) {
            this.$refs.video.src = videoPath
            return
          } else {
            this.errorPreview = true
          }
        }

        // play original video
        if (!fs.existsSync(this.video.path)) return
        this.$refs.video.src = this.video.path
        this.setVideoProgress(0.2)
        this.timeouts.a = setTimeout(this.setVideoProgress, 3000, 0.4)
        this.timeouts.b = setTimeout(this.setVideoProgress, 6000, 0.6)
        this.timeouts.c = setTimeout(this.setVideoProgress, 9000, 0.8)
        this.timeouts.d = setTimeout(this.setVideoProgress, 12000, 0.2)
      }, this.delayVideoPreview * 1000 + 500)
    },
    stopPlayingPreview() {
      if (!this.videoPreviewEnabled) return
      this.isVideoHovered = false
      for (const timeout in this.timeouts) {
        clearTimeout(this.timeouts[timeout])
      }
      this.$refs.video.src = ''
    },
    getFileExtension() {
      let filename = this.video.path.split("\\").pop()
      return filename.split('.').pop()
    },
    getImgUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      let gridPath = path.join(this.pathToUserData, `/media/previews/${videoId}.jpg`)
      return this.checkImageExist(imgPath, gridPath)
    },
    checkImageExist(imgPath, gridPath) {
      if (this.videoPreviewGridEnabled && fs.existsSync(gridPath)) {
        return gridPath
      } else if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        this.errorThumb = true
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    playVideo() {
      const pathToVideo = this.video.path
      if (!fs.existsSync(pathToVideo)) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pathToVideo
        return
      }
      if (this.$store.state.Settings.playerType === '0') {
        let data = {
          videos: this.$store.getters.videosOnPage,
          id: this.video.id,  
        }
        ipcRenderer.send('openPlayer', data)
      } else shell.openPath(pathToVideo)
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
      return `/performer/:${this.getPerformerByName(performer).id}?tabId=default`
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
      this.$store.state.menuTabs = false
      this.$store.state.Videos.menuCard = false
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
      this.$nextTick(() => {
        this.$store.state.Videos.menuCard = true
      })
    },
  },
  watch: {
    updateCard() {
      this.cardKey = this.video.id + Date.now()
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
    padding: 3px 4px;
    line-height: 1;
    height: auto !important;
  }
  .v-card__actions {
    .v-chip {
      .v-icon.mdi-heart {
        font-size: 1em !important;
      }
    }
  }
  .v-rating .v-icon::before {
    font-size: 1.3em !important;
  }
  .duration {
    position: absolute;
    right: 2px;
    bottom: 2px;
    padding: 1px;
    line-height: 1;
    font-weight: 300;
    font-size: 12px;
    border-radius: 3px;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.3);
    user-select: none;
    &.hidden {
      display: none;
    }
  }
  .resolution {
    position: absolute;
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
      padding: 0px 2px;
    }
    .value {
      font-size: 10px;
      width: 100%;
      background-color: #000;
      color: #ffffff;
      line-height: 1.1;
      padding: 0px 2px;
    }
  }
  .prop {
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
    right: 25%;
    opacity: 0.4;
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
  .preview {
    opacity: 0;
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    position: absolute;
    animation-fill-mode: both;
    animation-duration: 0.5s;
    animation-delay: 0.7s;
    video {
      min-width: 100%;
      min-height: 100%;
      object-fit: cover;
    }
  }
  .rating,
  .duration,
  .resolution,
  .btn-play {
    z-index: 1;
  }
  .duration,
  .resolution {
    pointer-events: none;
  }
  &:hover {
    .preview {
      animation-name: preview;
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
.rating {
  position: absolute;
  bottom: 0;
  left: 0;
  line-height: 1;
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
@keyframes preview {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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