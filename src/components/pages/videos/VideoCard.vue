<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" v-ripple="{ class: 'accent--text' }"
      :class="{favorite: isFavorite}" class="video-card meta-card"
      :data-id="video.id" outlined hover @contextmenu="showContextMenu"
      :key="cardKey" :disabled="!reg && i>4"
    >
      <v-responsive 
        @mouseover.capture="playPreview()" @mouseleave="stopPlayingPreview()"
        :aspect-ratio="16/9" class="video-preview-container"
      >
        <div v-if="!reg && i>4" class="reg-block"> <div>App not registered</div> </div>
        <v-img :src="getImgUrl()" :aspect-ratio="16/9" class="thumb" contain/>
        <v-btn @click="playVideo" icon outlined class="btn-play" :color="isVideoExist?'white':'red'">
          <v-icon>mdi-play</v-icon> </v-btn>

        <div v-if="errorThumb" class="error-load-thumb">
          unable to find thumb for this video
        </div>

        <v-rating v-if="!ratingAndFavoriteInCard && !isRatingHidden" 
          :value="video.rating" @input="changeRating($event, video.id)"
          class="rating rating-wrapper"
          color="yellow darken-2" background-color="grey darken-1"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover clearable />
        
        <v-btn v-if="!ratingAndFavoriteInCard && !isFavoriteHidden" 
          @click="isFavorite = !isFavorite" icon absolute 
          :color="isFavorite===false ? 'white' : 'pink'" class="fav-btn"
        > <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart-outline</v-icon>
        </v-btn>
        
        <div v-if="!isDurationHidden" class="duration">{{calcDur(video.duration)}}</div>

        <div v-if="!isQualityLabelHidden" label outlined class="resolution">
          <div class="text text-no-wrap" :class="calcHeightTitle(video.resolution).toLowerCase()">
            {{calcHeightTitle(video.resolution)}}
          </div>
          <div class="value">
            <span>{{calcHeightValue(video.resolution)}}</span>
          </div>
        </div>
        <div class="preview"
          :style="`animation-delay: ${delayVideoPreview}.7s`">
          <video ref="video" autoplay muted loop />
        </div>

        <div v-if="isVideoHovered && videoPreviewHover=='timeline'" class="timeline">
          <img :src="getTimelineImgUrl(timeline[hoveredSection])">
          <div class="sections">
            <div v-for="(item, i) in timeline" :key="i" @mouseover="hoveredSection=i" class="section"/>
          </div>
        </div>
      </v-responsive>

      <div v-if="!isFileNameHidden" class="video-card-title" :title="fileName" v-html="fileName"/>

      <v-divider></v-divider>

      <!-- Video meta -->
      <v-card-actions v-if="!isFileInfoHidden" class="props pa-1">
        <div label outlined class="prop" :title="videoPath">
          <v-icon>mdi-file-search</v-icon>
          <span class="value">Path</span>
        </div>
        <div label outlined class="prop">
          <v-icon>mdi-monitor-screenshot</v-icon>
          {{video.resolution}}
        </div>
        <div label outlined class="prop">
          <v-icon>mdi-file-video</v-icon>
          {{fileExtension}}
        </div>
        <div label outlined class="prop">
          <v-icon>mdi-harddisk</v-icon>
          {{calcSize(video.size)}}
        </div>
      </v-card-actions>
      
      <v-divider v-if="!isFileInfoHidden"></v-divider>
      <!-- END Video meta -->

      <v-card-actions v-if="ratingAndFavoriteInCard" class="px-1 py-0">
        <v-rating :value="video.rating" @input="changeRating($event, video.id)"
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover clearable />
        <v-spacer></v-spacer>
        <v-btn @click="isFavorite = !isFavorite" icon color="pink" x-small class="fav-in-card"> 
          <v-icon v-if="isFavorite" color="pink">mdi-heart</v-icon>
          <v-icon v-else color="grey">mdi-heart-outline</v-icon>
        </v-btn>
      </v-card-actions>
      <v-divider v-if="ratingAndFavoriteInCard"></v-divider>

      <!-- Parse meta -->
      <div v-for="(m,i) in metaInCard" :key="i">
        <div v-if="visibility[m.id]" class="meta-in-card">
          <v-chip-group v-if="m.type=='complex'" column>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-icon v-on="on">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
              </template>
              <span>{{getMeta(m.id).settings.name}}</span>
            </v-tooltip>
            <v-chip v-for="v in video[m.id]" :key="v" 
              :color="getColor(m.id,v)" 
              :label="getMeta(m.id).settings.chipLabel"
              :outlined="getMeta(m.id).settings.chipOutlined"
              @mouseover.stop="showImage($event,v,'meta',m.id)" 
              @mouseleave.stop="$store.state.hoveredImage=false"> 
                {{ getCard(v).meta.name }} </v-chip>
          </v-chip-group>
          <div v-else-if="m.type=='simple'" class="simple-meta">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-icon v-on="on">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
              </template>
              <span>{{getMeta(m.id).settings.name}}</span>
            </v-tooltip>
            <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id, 'video')}}</span>
            <span v-else-if="getMeta(m.id).dataType=='boolean'">{{video[m.id]?'Yes':'No'}}</span>
            <span v-else>{{video[m.id]}}</span>
          </div>
        </div>
      </div>
      
      <v-icon v-if="video.bookmark" class="bookmark" color="red" :title="bookmark">mdi-bookmark</v-icon>

      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Videos.dialogEditVideoInfo=true"
        color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const shell = require('electron').shell
const fs = require('fs')
const path = require('path')

import Functions from '@/mixins/Functions'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'
import { ipcRenderer } from 'electron'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'VideoCard',
  props: {
    video: Object,
    i: Number,
    reg: Boolean,
  },
  mixins: [ShowImageFunction, Functions, LabelFunctions, MetaGetters],
  mounted() {
    this.$nextTick(function () {
      this.cardKey = this.video.id
    })
  },
  beforeDestroy() {
    try { this.$refs.video.src = '' } catch (error) {}
  },
  destroyed() {
    for (const timeout in this.timeouts) clearTimeout(this.timeouts[timeout])
  },
  data: () => ({
    errorThumb: false,
    isVideoHovered: false,
    timeouts: {},
    cardKey: '',
    hoveredSection: 0,
    timeline: [10, 20, 30, 40, 50, 60, 70, 80, 90],
  }),
  computed: {
    updateCardIds() { return this.$store.state.Videos.updateCardIds},
    isChipsColored() {return this.$store.state.Settings.videoChipsColored},
    isEditBtnHidden() {return this.$store.state.Settings.videoEditBtnHidden },
    isFileNameHidden() {return this.$store.state.Settings.videoFileNameHidden },
    isFileInfoHidden() {return this.$store.state.Settings.videoFileInfoHidden },
    isRatingHidden() {return this.$store.state.Settings.videoRatingHidden },
    isFavoriteHidden() {return this.$store.state.Settings.videoFavoriteHidden},
    isQualityLabelHidden() {return this.$store.state.Settings.videoQualityLabelHidden},
    isDurationHidden() { return this.$store.state.Settings.videoDurationHidden },
    videoPath() { return path.parse(this.video.path).dir },
    fileName() { return path.parse(this.video.path).name },
    fileExtension() { return path.parse(this.video.path).ext.replace('.', '').toLowerCase() },
    isFavorite: {
      get() { return this.video.favorite },
      set(value) {
        this.video.favorite = value
        this.$store.getters.videos.find({id: this.video.id}).assign({
          favorite: value,
          edit: Date.now(),
        }).write()
      },
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    bookmark() { return this.$store.getters.bookmarks.get('videos').find({itemId:this.video.id}).value().text },
    videoPreviewStatic() { return this.$store.state.Settings.videoPreviewStatic },
    videoPreviewHover() { return this.$store.state.Settings.videoPreviewHover },
    delayVideoPreview() { return this.$store.state.Settings.delayVideoPreview },
    ratingAndFavoriteInCard() { return this.$store.state.Settings.ratingAndFavoriteInCard },
    isVideoExist() { return fs.existsSync(this.video.path) },
    metaInCard() { return this.$store.state.Settings.videoMetaInCard },
    visibility() { return this.$store.state.Settings.videoVisibility },
  },
  methods: {
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    setVideoProgress(percent) { this.$refs.video.currentTime = Math.floor(this.video.duration*percent) },
    playPreview() {
      if (this.isVideoHovered) return
      this.isVideoHovered = true
      if (this.videoPreviewHover !== 'video') return
      this.timeouts.z = setTimeout(()=>{
        // play original video
        if (!this.isVideoExist) return
        this.$refs.video.src = this.video.path
        this.setVideoProgress(0.2)
        this.timeouts.a = setTimeout(this.setVideoProgress, 3000, 0.4)
        this.timeouts.b = setTimeout(this.setVideoProgress, 6000, 0.6)
        this.timeouts.c = setTimeout(this.setVideoProgress, 9000, 0.8)
        this.timeouts.d = setTimeout(this.setVideoProgress, 12000, 0.2)
      }, this.delayVideoPreview * 1000 + 500)
    },
    stopPlayingPreview() {
      if (this.videoPreviewHover != 'none') this.isVideoHovered = false
      if (this.videoPreviewHover != 'video') return
      for (const timeout in this.timeouts) clearTimeout(this.timeouts[timeout])
      this.$refs.video.src = ''
    },
    getImgUrl() {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      let gridPath = path.join(this.pathToUserData, `/media/previews/${this.video.id}.jpg`)
      return 'file://' + this.checkImageExist(imgPath, gridPath)
    },
    checkImageExist(imgPath, gridPath) {
      if (this.videoPreviewStatic=='grid' && fs.existsSync(gridPath)) return gridPath
      else if (fs.existsSync(imgPath)) return imgPath
      else {
        this.errorThumb = true
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    getTimelineImgUrl(progress) {
      let imgPath = path.join(this.pathToUserData, `/media/timeline/${this.video.id}_${progress}.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      else return 'file://' + path.join(this.pathToUserData, '/img/templates/thumb.jpg')
    },
    playVideo() {
      const pathToVideo = this.video.path
      if (!this.isVideoExist) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pathToVideo
        return
      }
      if (this.$store.state.Settings.isPlayVideoInSystemPlayer) shell.openPath(pathToVideo) 
      else { 
        let data = { videos: this.$store.getters.videosOnPage, id: this.video.id }
        ipcRenderer.send('openPlayer', data)
      } 
    },
    changeRating(stars, videoID) { this.$store.getters.videos.find({id:videoID}).assign({rating:stars,edit:Date.now()}).write() },
    showContextMenu(e) {
      e.preventDefault()
      this.$store.state.menuTabs = false
      this.$store.state.Videos.menuCard = false
      setTimeout(() => {
        this.$store.state.x = e.clientX
        this.$store.state.y = e.clientY
        this.$store.state.Videos.menuCard = true
      }, 300)
    }, // TODO context menu
  },
  watch: {
    updateCardIds(newValue) {
      if (newValue.length === 0) this.cardKey = this.video.id + Date.now()
      if (newValue.includes(this.video.id)) this.cardKey = this.video.id + Date.now()
    }
  }
}
</script>