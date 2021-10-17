<template>
  <v-lazy :key="cardKey" :data-id="video.id" class="select-item">
    <v-card v-if="view==0" @mousedown="stopSmoothScroll($event)" v-ripple="{ class: 'accent--text' }"
      @mousedown.right="$store.state.contextMenu=false" @contextmenu="showContextMenu"
      :class="{favorite: isFavorite, 'icons-in-card':ratingAndFavoriteInCard}" class="video-card meta-card"
      outlined hover :disabled="!reg && i>4"
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

      <!-- Video meta -->
      <v-chip v-if="!isFileInfoHidden" label class="props px-2 py-1 mt-0 mx-1">
        <div label outlined class="prop" :title="videoPath">
          <v-icon>mdi-folder-outline</v-icon>
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
      </v-chip>

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
      <div v-for="(m,i) in metaAssignedToVideos" :key="i">
        <div v-if="visibility[m.id]&&checkShowEmptyValue(m)" class="meta-in-card">
          <v-chip-group v-if="m.type=='complex'" column>
            <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
            <v-chip v-for="mc in video[m.id]" :key="mc" 
              :color="getColor(m.id,mc)" 
              :label="getMeta(m.id).settings.chipLabel"
              :outlined="getMeta(m.id).settings.chipOutlined"
              :title="`Open page with ${getMeta(m.id).settings.nameSingular.toLowerCase()}`"
              @click="openMetaCardPage(m.id,mc)"
              @click.middle="openMetaInNewTab(mc)"
              @mouseover.stop="showImage($event,mc,'meta',m.id)" 
              @mouseleave.stop="$store.state.hoveredImage=false"> 
                {{ getCard(mc).meta.name }} </v-chip>
          </v-chip-group>
          <div v-else-if="m.type=='simple'" class="simple-meta">
            <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
            <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id, 'video')}}</span>
            <span v-else-if="getMeta(m.id).dataType=='rating'">      
              <v-rating :value="video[m.id]" @input="changeMetaRating($event, m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable
                :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
            </span>
            <span v-else-if="getMeta(m.id).dataType=='boolean'">{{video[m.id]?'Yes':'No'}}</span>
            <span v-else>{{video[m.id]}}</span>
          </div>
        </div>
      </div>
      
      <v-icon v-if="video.bookmark" class="bookmark" color="red" :title="video.bookmark">mdi-bookmark</v-icon>

      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Videos.dialogEditVideoInfo=true"
        color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
    </v-card>
    <v-card v-else-if="view==1" @contextmenu="showContextMenu"
      @mousedown="stopSmoothScroll($event)" @mousedown.right="$store.state.contextMenu=false"
      class="video-card meta-card" outlined hover :disabled="!reg && i>4">
      <div @click="playVideo" @mousemove.capture="scrollStory($event)" @mouseleave="stopScrollStory" ref="story" class="story">
        <v-sheet v-if="!isFileNameHidden" class="video-card-title" v-html="fileName"/>
        <div v-if="!reg && i>4" class="reg-block">App not registered</div>
        <div v-if="!isVideoExist" class="path-error"> <div class="error">No video found. Please update the path.</div> </div>
        <div v-if="!isQualityLabelHidden" label outlined class="resolution">
          <div class="text text-no-wrap" :class="calcHeightTitle(video.resolution).toLowerCase()">
            {{calcHeightTitle(video.resolution)}}
          </div>
          <div class="value" v-html="calcHeightValue(video.resolution)"/>
        </div>
        <div class="wrapper" ref="storyWrapper" :class="{'hovered':isVideoHovered}">
          <div v-for="(p, i) in timeline" :key="i" class="frame">
            <img :src="getTimelineImgUrl(p)"/>
            <div v-if="!isDurationHidden" class="duration">{{calcDur(p/100*video.duration)}}</div>
          </div>
        </div>
      </div>

      <div class="content">
        <v-btn v-if="!isFavoriteHidden" @click="isFavorite = !isFavorite" icon color="pink" class="mx-1"> 
          <v-icon v-if="isFavorite" color="pink">mdi-heart</v-icon>
          <v-icon v-else color="grey">mdi-heart-outline</v-icon>
        </v-btn>
        <v-rating v-if="!isRatingHidden" :value="video.rating" @input="changeRating($event, video.id)"
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover clearable class="mx-1" />

        <v-chip v-if="!isFileInfoHidden" label class="px-2 py-1 mx-2">
          <div label outlined class="prop mr-2" :title="videoPath">
            <v-icon>mdi-folder-outline</v-icon>
            <span class="value">Path</span>
          </div>
          <div label outlined class="prop mr-2">
            <v-icon>mdi-monitor-screenshot</v-icon>
            {{video.resolution}}
          </div>
          <div label outlined class="prop mr-2">
            <v-icon>mdi-file-video</v-icon>
            {{fileExtension}}
          </div>
          <div label outlined class="prop">
            <v-icon>mdi-harddisk</v-icon>
            {{calcSize(video.size)}}
          </div>
        </v-chip>

        <!-- Parse meta -->
        <div v-for="(m,i) in metaAssignedToVideos" :key="i" class="d-flex">
          <div v-if="visibility[m.id]&&checkShowEmptyValue(m)" class="meta-in-card">
            <v-chip-group v-if="m.type=='complex'" column>
              <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
              <v-chip v-for="mc in video[m.id]" :key="mc" 
                :color="getColor(m.id,mc)" 
                :label="getMeta(m.id).settings.chipLabel"
                :outlined="getMeta(m.id).settings.chipOutlined"
                :title="`Open page with ${getMeta(m.id).settings.nameSingular.toLowerCase()}`"
                @click="openMetaCardPage(m.id,mc)"
                @click.middle="openMetaInNewTab(mc)"
                @mouseover.stop="showImage($event,mc,'meta',m.id)" 
                @mouseleave.stop="$store.state.hoveredImage=false"> 
                  {{ getCard(mc).meta.name }} </v-chip>
            </v-chip-group>
            <div v-else-if="m.type=='simple'" class="simple-meta">
              <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
              <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id, 'video')}}</span>
              <span v-else-if="getMeta(m.id).dataType=='rating'">      
                <v-rating :value="video[m.id]" @input="changeMetaRating($event, m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                  :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                  :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable
                  :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
              </span>
              <span v-else-if="getMeta(m.id).dataType=='boolean'">{{video[m.id]?'Yes':'No'}}</span>
              <span v-else>{{video[m.id]}}</span>
            </div>
          </div>
        </div>
      </div>

      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Videos.dialogEditVideoInfo=true"
        color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const { dialog } = require('electron').remote
const { clipboard } = require('electron')
const shell = require('electron').shell
const fs = require('fs')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const pathToFfprobe = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')
ffmpeg.setFfprobePath(pathToFfprobe)

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
      this.isVideoExist = fs.existsSync(this.video.path)
    })
  },
  beforeDestroy() {
    try { this.$refs.video.src = '' } catch (error) {}
  },
  destroyed() {
    for (const timeout in this.timeouts) clearTimeout(this.timeouts[timeout])
  },
  data: () => ({
    isVideoExist: false,
    errorThumb: false,
    isVideoHovered: false,
    timeouts: {},
    cardKey: '',
    hoveredSection: 0,
    timeline: [5, 15, 25, 35, 45, 55, 65, 75, 85, 95],
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
    videoPreviewStatic() { return this.$store.state.Settings.videoPreviewStatic },
    videoPreviewHover() { return this.$store.state.Settings.videoPreviewHover },
    delayVideoPreview() { return this.$store.state.Settings.delayVideoPreview },
    ratingAndFavoriteInCard() { return this.$store.state.Settings.ratingAndFavoriteInCard },
    metaAssignedToVideos() { return this.$store.state.Settings.metaAssignedToVideos },
    view() { return this.$store.state.Settings.videoView || 0 },
    visibility() { return this.$store.state.Settings.videoVisibility },
    isSelectedSingleVideo() { return this.$store.getters.getSelectedVideos.length == 1 },
    complexMetaAssignedToVideo() { return this.$store.getters.settings.get('metaAssignedToVideos').filter({type:'complex'}).value() },
    metaForParsing() {  
      let ids = this.$store.getters.settings.get('metaAssignedToVideos').filter({type:'complex'}).map('id').value() 
      return this.$store.getters.meta.filter(i=>ids.includes(i.id)&&i.settings.parser).value()
    },
    showEmptyMetaValueInCard() { return this.$store.state.Settings.showEmptyMetaValueInCard },
  },
  methods: {
    openMetaCardPage(metaId, cardId) { this.$router.push(`/metacard/?metaId=${metaId}&cardId=${cardId}&tabId=default`) },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    checkShowEmptyValue(meta) {
      if (this.showEmptyMetaValueInCard) return true
      if (meta.type == 'complex') return this.video[meta.id]&&this.video[meta.id].length
      let valueType = typeof this.video[meta.id]
      let simpleMeta = this.getMeta(meta.id)
      if (valueType == 'undefined' && simpleMeta.dataType!=='rating') return false
      if (['object','string'].includes(valueType)) return this.video[meta.id].length
      else return true
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
    scrollStory(e) {
      let storyWidth = this.$refs.story.clientWidth
      let wrapperWidth = this.$refs.storyWrapper.clientWidth
      if (wrapperWidth <= storyWidth) return
      let x = e.layerX
      let ratio = storyWidth / (wrapperWidth - storyWidth)
      let offset = Math.ceil(x / ratio)
      this.$refs.storyWrapper.style.left = '-' + offset +'px'
    },
    stopScrollStory() { this.$refs.storyWrapper.style.left = 0 },
    getImgUrl() {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      let gridPath = path.join(this.pathToUserData, `/media/grids/${this.video.id}.jpg`)
      return 'file://' + this.checkImageExist(imgPath, gridPath)
    },
    checkImageExist(imgPath, gridPath) {
      if (this.videoPreviewStatic=='grid' && fs.existsSync(gridPath)) return gridPath
      else if (fs.existsSync(imgPath)) return imgPath
      else {
        this.errorThumb = true
        return path.join(__static, '/img/default.jpg')
      }
    },
    getTimelineImgUrl(progress) {
      let imgPath = path.join(this.pathToUserData, `/media/timelines/${this.video.id}_${progress}.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      else return 'file://' + path.join(__static, '/img/default.jpg')
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
      this.$store.getters.videos.find({id: this.video.id}).assign({
        views: (this.video.views||0)+1,
        viewed: Date.now(),
      }).write()
    },
    changeRating(stars, videoID) { this.$store.getters.videos.find({id:videoID}).assign({rating:stars,edit:Date.now()}).write() },
    showContextMenu(e) {
      e.preventDefault()
      const vm = this
      function getFilterMeta() {
        let menuMetaAssignedToVideo = []
        for (let m of vm.complexMetaAssignedToVideo) {
          const meta = vm.getMeta(m.id)
          let menuMetaCards = []
          let metaCardIds = vm.video[m.id]
          if (metaCardIds) for (let metaCardId of metaCardIds) {
            const card = vm.getCard(metaCardId)
            menuMetaCards.push({name: card.meta.name, type: 'item', icon: 'circle', color: card.meta.color, function: ()=>{vm.filterVideosBy(m.id,metaCardId)}})
          }
          if (menuMetaCards.length==0) menuMetaCards.push({name:'No added meta', type: 'item', function: ()=>{}, disabled: true})
          menuMetaAssignedToVideo.push({name: meta.settings.name, type: 'menu', icon: meta.settings.icon, disabled: !vm.isSelectedSingleVideo, menu:menuMetaCards})
        }
        if (menuMetaAssignedToVideo.length==0) menuMetaAssignedToVideo.push({name:'No assigned meta', type: 'item', function: ()=>{}, disabled: true})
        return menuMetaAssignedToVideo
      }
      function metaClipboard(metaId, type) {
        if (type === 'copy') {
          let metaCardIds = []
          vm.$store.getters.getSelectedVideos.map(videoId => {
            let video = vm.$store.getters.videos.find({id:videoId}).value()
            if (video[metaId]) metaCardIds = [...metaCardIds, ...video[metaId] || []] 
          })
          metaCardIds = metaCardIds.filter((value, index, self) => (self.indexOf(value) === index))
          vm.$store.state.clipboardMeta[metaId] = metaCardIds
          let names = []
          for (let i of vm.$store.state.clipboardMeta[metaId]) {
            names.push(vm.getCard(i).meta.name)
          }
          clipboard.writeText(names.join(', '))
        } else {
          let clipboard = vm.$store.state.clipboardMeta[metaId]
          let videoIds = vm.$store.getters.getSelectedVideos
          if ((clipboard===undefined || clipboard.length==0) && type!=='clear' || videoIds.length==0) return
          videoIds.map(videoId => {
            let newValues = []
            let video = vm.$store.getters.videos.find({ id: videoId })
            // replace video values with clipboard values
            if (type === 'add') {
              newValues = [...video.value()[metaId] || [], ...clipboard]
              newValues = [...new Set(newValues)]
            } else if (type === 'replace') newValues = clipboard
            // sort by name
            let meta = vm.getMeta(metaId)
            if (meta && meta.type === 'complex') newValues.sort((a,b)=>{
              a = vm.getCard(a).meta.name
              b = vm.getCard(b).meta.name
              return a.localeCompare(b)
            })
            video.assign({[metaId]:newValues,edit:Date.now()}).write()
          })
          vm.$store.commit('updateVideos', videoIds)
        }
      }
      function getMetaClipboard(type) {
        let items = []
        for (let m of vm.complexMetaAssignedToVideo) {
          const meta = vm.getMeta(m.id)
          items.push({name: meta.settings.name, type: 'item', icon: meta.settings.icon, function: ()=>{metaClipboard(m.id, type)}})
        }
        if (vm.complexMetaAssignedToVideo.length==0) items.push({name:'No added meta', type: 'item', function: ()=>{}, disabled: true})
        return items
      }
      setTimeout(() => {
        this.$store.state.x = e.clientX
        this.$store.state.y = e.clientY
        let contextMenu = [
          { name: `Edit Info`, type: 'item', icon: 'pencil', function: ()=>{this.$store.state.Videos.dialogEditVideoInfo=true}},
          { name: `Rating`, type: 'menu', icon: 'star', menu: [
            { name: `5`, type: 'item', icon: 'star', function: ()=>{this.changeRating(5)}},
            { name: `4.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(4.5)}},
            { name: `4`, type: 'item', icon: 'star', function: ()=>{this.changeRating(4)}},
            { name: `3.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(3.5)}},
            { name: `3`, type: 'item', icon: 'star', function: ()=>{this.changeRating(3)}},
            { name: `2.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(2.5)}},
            { name: `2`, type: 'item', icon: 'star', function: ()=>{this.changeRating(2)}},
            { name: `1.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(1.5)}},
            { name: `1`, type: 'item', icon: 'star', function: ()=>{this.changeRating(1)}},
            { name: `0.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(0.5)}},
            { name: `0`, type: 'item', icon: 'star-outline', function: ()=>{this.changeRating(0)}},
          ]},
          { name: `Favorite`, type: 'menu', icon: 'heart', menu: [
            { name: `Add to Favorite `, type: 'item', icon: 'heart-plus', function: ()=>{this.changeFavorite(true)}},
            { name: `Remove from Favorite`, type: 'item', icon: 'heart-remove', function: ()=>{this.changeFavorite(false)}},
          ]},
          { type: 'divider' },
          { name: `Copy Meta to Clipboard`, type: 'menu', icon: 'content-copy', menu: getMetaClipboard('copy')},
          { name: `Add Meta from Clipboard`, type: 'menu', icon: 'plus-circle-outline', menu: getMetaClipboard('add')},
          { name: `Replace Meta from Clipboard`, type: 'menu', icon: 'reload-alert', menu: getMetaClipboard('replace')},
          { name: `Clear Meta`, type: 'menu', icon: 'close-circle-outline', color: 'error', menu: getMetaClipboard('clear')},
          { type: 'divider' },
          { name: `Filter Videos by`, type: 'menu', icon: 'filter', disabled: !this.isSelectedSingleVideo, menu: getFilterMeta()},
          { name: `Parse Metadata`, type: 'item', icon: 'text-box-search', function: ()=>{this.parseMetadata()}},
          { name: `Update File Information`, type: 'item', icon: 'information-variant', function: ()=>{this.updateFileInfo()}},
          { type: 'divider' },
          { name: `Add to Playlist...`, type: 'item', icon: 'playlist-plus', function: ()=>{this.$store.state.Videos.dialogAddToPlaylist=true}, },
          { name: `Add to "Watch later"`, type: 'item', icon: 'bookmark-plus', function: ()=>{this.watchLater()}, },
          { type: 'divider' },
          { name: `Reveal in File Explorer`, type: 'item', icon: 'folder-open', function: ()=>{this.revealInFileExplorer()}, disabled: !this.isSelectedSingleVideo},
          { name: `Move File to...`, type: 'item', icon: 'file-move', function: ()=>{this.moveFile()},},
          { type: 'divider' },
          { name: `Delete Video`, type: 'item', icon: 'delete', color: 'error', function: ()=>{this.$store.state.Videos.dialogDeleteVideo=true},},
        ]
        this.$store.state.contextMenuContent = contextMenu
        this.$store.state.contextMenu = true
      }, 300)  // TODO create menu with playlists and place into it button "Watch later"
    },
    watchLater() {
      let playlist = this.$store.getters.playlists.find({name:'Watch later'}).value()
      let videosFromPlaylist = playlist.videos
      this.$store.getters.getSelectedVideos.map(videoId => {
        if (!videosFromPlaylist.includes(videoId)) videosFromPlaylist.push(videoId)
      })
      this.$store.getters.playlists.find({name:'Watch later'}).assign({
        videos: videosFromPlaylist,
        edit: Date.now(),
      }).write()
    },
    revealInFileExplorer() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      let videoPath = this.$store.getters.videos.find({id:videoId}).value().path
      shell.showItemInFolder(videoPath)
    },
    moveFile() {
      // TODO create progress line for this process. If file are moving to another disk this proc can be long
      dialog.showOpenDialog(null, { 
        properties: ['openDirectory'],
        defaultPath: path.dirname(this.video.path)
      }).then(result => {
        if (result.filePaths.length === 0) return
        let filePath = result.filePaths[0]
        let ids = this.$store.getters.getSelectedVideos
        let vids = this.$store.getters.videos
        const vm = this
        if (ids.length===0) return
        ids.map(i => {
          let oldPath = vids.find({id:i}).value().path
          let fileName = path.basename(oldPath)
          let newPath = path.join(filePath, fileName)
          fs.rename(oldPath, newPath, function (err) {
            if (err) {
              vm.$store.commit('addLog', { type: 'error', text: `Failed to move file "${fileName}".` })
              throw err
            } else {
              vids.find({id:i}).assign({ path: newPath, edit: Date.now() }).write()
              vm.$store.commit('addLog', { type: 'info', text: `File "${fileName}" successfully moved!` })
            }
          })
        })
      }).catch(err => { this.$store.commit('addLog', {type: 'error', text: err}); return })
    },
    filterVideosBy(metaId, metaCardId) {
      let filter = {
        by: metaId,
        cond: 'includes one of',
        val: [metaCardId],
        type: 'select',
        flag: null,
        lock: false,
      }
      this.$store.state.Settings.videoFilters.push(filter)
      this.$store.dispatch('filterVideos')
    },
    changeRating(stars) {
      this.$store.state.Videos.selectedVideos.map(id => {
        this.$store.getters.videos.find({ id }).assign({ rating: stars, edit: Date.now() }).write()
      })
      this.$store.commit('updateVideos', this.$store.state.Videos.selectedVideos)
    },
    changeMetaRating(stars, metaId) {
      this.$store.getters.videos.find({ id:this.video.id }).assign({edit:Date.now(), [metaId]:stars}).write()
    },
    changeFavorite(value) {
      this.$store.state.Videos.selectedVideos.map(id => {
        this.$store.getters.videos.find({ id }).assign({favorite: value,edit: Date.now()}).write()
      })
      this.$store.commit('updateVideos', this.$store.state.Videos.selectedVideos)
    },
    parseMetadata() {
      function filterString(string) {
        return string.replace(/[&\/\\#,+()$~%.'":*?<>{} ]/g, "").toLowerCase()
      }

      const vm = this
      
      function parseFilePath(filePath) {
        const string = filterString(filePath)

        let parsed = {}
        for (let m of vm.metaForParsing) {
          parsed[m.id] = vm.$store.getters.metaCards.filter(mc => {
            if (mc.metaId!==m.id) return false
            let foundName = string.includes(filterString(mc.meta.name))
            let foundSynonyms = false
            if (mc.meta.synonyms && mc.meta.synonyms.length) {
              for (let synonym of mc.meta.synonyms) {
                if (string.includes(filterString(synonym))) foundSynonyms = true
              }
            }
            return foundName || foundSynonyms
          }).value().map(mc => mc.id)
          parsed[m.id] = [...new Set(parsed[m.id])] // remove duplicates
        }
        return parsed
      }

      let ids = this.$store.getters.getSelectedVideos

      this.$store.getters.videos.filter(i=>ids.includes(i.id)).each(video => {
        const meta = parseFilePath(video.path)
        for (let m in meta) video[m] = _.union(video[m], meta[m])
      }).write()
    },
    updateFileInfo() {
      function getVideoMetadata (pathToFile) {
        return new Promise((resolve, reject) => {
          return ffmpeg.ffprobe(pathToFile, (error, info) => {
            if (error) return reject(error)
            else if (info.streams[0].duration < 1) return reject('duration less than 1 sec.')
            else return resolve(info)
          })
        })
      }
      let successfullyUpdatedIds = []
      this.$store.state.Videos.selectedVideos.map(async id => {
        let video = this.$store.getters.videos.find({ id }).value()
        if (!fs.existsSync(video.path)) {
          this.$store.commit('addLog', { type: 'error', text: `No such file "${video.path}"` })
          return
        } 
        try {
          let metadata = await getVideoMetadata(video.path)
          let duration = Math.floor(metadata.format.duration)
          let resolution
          for (let i = 0; i < metadata.streams.length; i++) {
            if (metadata.streams[i].codec_type === 'video') {
              resolution = metadata.streams[i].width + 'x' + metadata.streams[i].height
            } 
          }
          let updatedMetadata = {
            duration: duration,
            size: metadata.format.size,
            resolution: resolution,
            edit: Date.now(),
          }
          this.$store.getters.videos.find({ id }).assign(updatedMetadata).write()
          successfullyUpdatedIds.push(id)
        } catch (error) { console.log(error) }
      })
      if (successfullyUpdatedIds.length) this.$store.commit('updateVideos', successfullyUpdatedIds)
    },
    openMetaInNewTab(cardId) {
      let card = this.getCard(cardId)
      let tabId = cardId
      let tabName = card.meta.name
      let meta = this.getMeta(card.metaId)

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
  },
  watch: {
    updateCardIds(newValue) {
      if (newValue.length === 0) this.cardKey = this.video.id + Date.now()
      if (newValue.includes(this.video.id)) this.cardKey = this.video.id + Date.now()
    }
  }
}
</script>