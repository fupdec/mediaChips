<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <v-container fluid>
      <v-row dense>
        <v-col cols="9">
          <video ref="video" controls width="100%" style="max-height:100vh;">
            <source :src="getVideoPath" type="video/mp4">
          </video>
          <div class="thumb" style="display:none;"> 
            <canvas ref="canvas" :width="this.videoWidth/6" :height="this.videoHeight/6"/>
          </div>
          <div class="video-details">
            <div>
              <v-chip-group column class="pa-2">
                <v-chip v-for="tag in video.tags" :key="tag" 
                  :color="getTagColor(tag)" outlined
                > {{ tag }} </v-chip>
              </v-chip-group>
              <v-subheader class="overline">
                Website
                <v-chip v-if="video.website" 
                  label outlined :color="getWebsiteColor(video.website)" class="ml-4"
                > {{ video.website }} 
                </v-chip>
              </v-subheader>
            </div>
            <div class="rating-favorite">
              <v-rating 
                v-model="video.rating" @input="changeRating($event)"
                color="yellow darken-2" background-color="grey"
                empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
                half-increments hover clearable dense class="mt-2"
              ></v-rating>
              <v-btn large icon @click="toggleFavorite" class="ml-4">
                <v-icon size="26" v-if="video.favorite===false" color="grey">
                  mdi-heart-outline
                </v-icon>
                <v-icon v-else size="26" color="pink">mdi-heart</v-icon>
              </v-btn>
            </div>
          </div>
        </v-col>
        <v-col cols="3">
          <v-btn block outlined class="mb-4" @click="playVideoInSystemPlayer">
            <v-icon left>mdi-play</v-icon> Play video in system player
          </v-btn>
          <v-btn block outlined class="mb-4" @click="dialogEditThumb = true">
            <v-icon left>mdi-image-edit</v-icon> Edit thumb
          </v-btn>
          <div v-if="isVideoAvailable">
            <v-btn block outlined class="mb-4" @click="setThumb">
              <v-icon left>mdi-camera</v-icon> Set as thumb
            </v-btn>
            
            <v-card class="mt-8" elevation="3">
              <v-card-actions>
                <span>Markers</span>
                <v-spacer></v-spacer>
                <v-tooltip v-if="markers.length>0" top>
                  <template v-slot:activator="{ on }">
                    <v-btn outlined class="ml-2" v-on="on"
                      height="32" width="32" min-width="10" :color="markerPlayableActive"
                      @click="toggleMarkerPlayable"
                    > <v-icon size="20">mdi-television-play</v-icon>
                    </v-btn>  
                  </template>
                  <span>Open markers in system player</span>
                </v-tooltip>
                <v-tooltip v-if="markers.length>0" top>
                  <template v-slot:activator="{ on }">
                    <v-btn outlined class="ml-2" v-on="on"
                      height="32" width="32" min-width="10" :color="markerNameActive"
                      @click="toggleMarkerNameVisibility"
                    > <v-icon size="20">mdi-card-text</v-icon>
                    </v-btn>  
                  </template>
                  <span>Show names</span>
                </v-tooltip>
                <v-tooltip v-if="markers.length>0" top>
                  <template v-slot:activator="{ on }">
                    <v-btn outlined class="ml-2" v-on="on"
                      height="32" width="32" min-width="10" :color="markerEditActive"
                      @click="toggleMarkerEditable" 
                    > <v-icon size="20">mdi-pencil</v-icon>
                    </v-btn>         
                  </template>
                  <span>Edit markers</span>
                </v-tooltip> 
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn outlined class="ml-2" v-on="on"
                      height="32" width="32" min-width="10" 
                      @click="openDialogAddMarker">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>      
                  </template>
                  <span>Add new</span>
                </v-tooltip>     
              </v-card-actions>
              <v-card-actions style="flex-wrap: wrap;">
                <v-chip v-for="marker in markers" :key="marker.id"
                  @click="jumpTo(marker.time)" @click:close="openDialogRemoveMarker(marker)"
                  close-icon="mdi-close" :close="markersEditable"
                  :title="marker.name" outlined small class="mr-1 mb-1"
                > 
                  <v-icon v-if="marker.type=='Favorite'" left small color="pink">mdi-heart</v-icon>
                  <v-icon v-if="marker.type=='Bookmark'" left small color="red">mdi-bookmark</v-icon>
                  <v-icon v-if="marker.type=='Tag'" left small :color="getTag(marker.name).color">mdi-tag</v-icon>
                  {{convertVideoTime(marker.time)}} 
                  <span :class="markerNameClass">{{marker.name}}</span>
                </v-chip>
              </v-card-actions>
            </v-card>
          </div>
          <div v-else class="text-center">
            <v-icon size="64" color="red" class="ma-4">mdi-alert</v-icon>
            <h4>This format video is not supported!</h4>
          </div>
        </v-col>
        <v-col cols="12">
          <v-divider></v-divider>
        </v-col>
        <v-col cols="6">
          <v-subheader class="overline pb-4">Starring</v-subheader>
          <div class="performers-starring-grid">
            <v-card 
              v-for="(performer,i) in video.performers" :key="i" 
              @click="openPerformerPage(performer)" class="performer-card"
            >
              <v-img :src="imgPerformer(performer)" :aspect-ratio="1" position="top">
                <div class="performer-ratings">
                  <v-rating
                    :value="getPerformer(performer).rating"
                    color="yellow darken-3" background-color="grey"
                    empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
                    dense half-increments hover size="18" readonly
                  ></v-rating>
                  <v-icon size="18" 
                    :color="getPerformer(performer).favorite ? 'pink':'grey'"
                  > mdi-heart </v-icon>
                </div>
              </v-img>
              <v-card-title class="body-2 pa-2">{{performer}}</v-card-title>
            </v-card>
          </div>
        </v-col>
        <v-col cols="1">
          <v-divider vertical></v-divider>
        </v-col>
        <v-col cols="5">
          <v-subheader class="overline">File info</v-subheader>
          <div class="body-2">
            <div style="position:relative">
              <v-btn icon x-small absolute style="left:-25px" @click="openDialogEditPath">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              Path: <i>{{video.path}}</i> 
            </div>
            <div>Size: <i>{{calcSize(video.size)+' '+calcSizeValue(video.size)}}</i></div>
            <div>Framerate: <i>{{fps}}</i></div>
            <div>Resolution: <i>{{resolution}}</i></div>
            <div>Bitrate: <i>{{bitrate}} kbps</i></div>
            <div>Codec: <i>{{codec}}</i></div>
            <div>Date added: <i>{{videoDateAdded}}</i></div>
            <div>ID: <i>{{video.id}}</i></div>
          </div>
        </v-col>
      </v-row>
    </v-container>
    
    <div v-show="$store.getters.navigationSide=='0'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>

    <v-dialog v-model="dialogEditThumb" max-width="800" scrollable>
      <v-card>
        <v-card-title class="headline py-1">Edit thumb image
          <v-spacer></v-spacer>
          <v-icon>mdi-pencil</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text>
            <v-col cols="12" align="center" justify="center" class="cropper-wrapper">
              <img id="clipboard" class="img-clipboard-temporary">
              <Cropper
                :src="images.thumb.file"
                ref="thumb"
                class="cropper"
                :stencil-props="{aspectRatio: 16/9}"
                :min-height="20"
              />
              <v-btn @click="pasteImageFromClipboard('thumb')" class="ma-4 mr-10" 
                outlined :color="images.thumb.btnColor">
                <v-icon left>mdi-clipboard-outline</v-icon> Paste from clipboard
              </v-btn>
              <v-btn v-if="images.thumb.display" 
                @click="crop(getImagePath('thumb',''),'thumb'),loader='imgThumbLoading'"  
                color="primary" large :loading="imgThumbLoading" :disabled="imgThumbLoading" 
              > <v-icon left>mdi-crop</v-icon> Crop / Save
                <template v-slot:loader>
                  <span class="custom-loader">
                    <v-icon>mdi-cached</v-icon>
                  </span>
                </template>
              </v-btn>
              <file-pond
                ref="pond" label-idle="Drop image here or click for upload"
                :allow-multiple="false" :files="uploadedImage" @addfile="handleFile"
                accepted-file-types="image/*" :dropValidation="true" class="mt-4"
              />
            </v-col>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogEditPath" max-width="1200" persistent>
      <v-card>
        <v-card-title class="headline">Change file path
          <v-spacer></v-spacer>
          <v-icon>mdi-pencil</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <v-text-field v-model="newPath" outlined label="File path" hide-details=""/>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogEditPath=false" class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="savePath" class="ma-4" color="primary" :disabled="newPath===''">
            <v-icon left>mdi-content-save</v-icon> Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogAddMarker" max-width="600" scrollable eager>
      <v-card>
        <v-card-title class="headline">
          Add time marker on {{seektime}}
          <v-spacer></v-spacer>
          <v-icon>mdi-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="pb-0">
            <v-form ref="form" v-model="valid">
              <v-container>
                <v-row>
                  <v-col cols="4">
                    <v-select v-model="markerType" :items="markerTypes"
                      label="Type of marker" outlined dense hide-details />
                  </v-col>
                  <v-col cols="8">
                    <v-autocomplete v-if="markerType=='Tag'"
                      v-model="markerTag" :items="tagsAll" item-text="name" item-value="name"
                      no-data-text="No more tags" hide-selected
                      dense outlined label="Tag" clearable 
                      validate-on-blur :rules="[getTagRules]"
                      :menu-props="{contentClass:'list-with-preview'}"
                      :filter="filterItemsTags"
                    >
                      <template v-slot:selection="data">
                        <v-chip
                          v-bind="data.attrs" outlined small
                          :input-value="data.selected" 
                          @click="data.select"
                          @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                          @mouseleave.stop="$store.state.hoveredImage=false"
                          :color="getTag(data.item.name).color" 
                        >{{ data.item.name }}
                        </v-chip>
                      </template>
                      <template v-slot:item="data">
                        <div class="list-item"
                          @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                          @mouseleave.stop="$store.state.hoveredImage=false"
                        > <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
                          <span>{{data.item.name}}</span>
                          <span v-if="data.item.altNames.length" class="aliases"> 
                            {{data.item.altNames.join(', ').slice(0,50)}}
                          </span>
                        </div>
                      </template>
                    </v-autocomplete>
                    <v-textarea v-if="markerType=='Bookmark'" solo hide-details
                      v-model="markerBookmarkText" label="Bookmark text" />
                    <div v-if="markerType=='Favorite'" class="text-center">No additional settings needed</div>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="addMarker" :disabled="!valid" class="ma-4" color="primary">
            Add marker
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogRemoveMarker" max-width="420">
      <v-card>
        <v-card-title class="headline red--text">Remove marker?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn @click="dialogRemoveMarker = false" class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="removeMarker" class="ma-4" dark color="red">
            <v-icon left>mdi-delete-alert</v-icon> Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </vuescroll>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shell = require('electron').shell
const shortid = require('shortid')
const ffmpeg = require('fluent-ffmpeg')
const { spawn } = require( 'child_process' )

import vueFilePond from 'vue-filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginFileEncode from 'filepond-plugin-file-encode'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
const FilePond = vueFilePond(FilePondPluginFileEncode, FilePondPluginFileValidateType)

import vuescroll from 'vuescroll'
import CropImage from '@/mixins/CropImage'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'VideoPage',
  components: {
    FilePond,
    vuescroll,
  },
  mixins: [CropImage, ShowImageFunction],
  created() {
    this.$set(this.images, 'thumb', this.getImageObject())
  },
  mounted() {
    this.$nextTick(function () {
      ffmpeg.setFfmpegPath(path.join(this.pathToUserData, '/ffmpeg/ffmpeg.exe')) 
      ffmpeg.setFfprobePath(path.join(this.pathToUserData, '/ffmpeg/ffprobe.exe'))
      this.checkImageExist(this.getImagePath('thumb',''), 'thumb')
      this.$refs.video.src = this.getVideoPath
      let vm = this
      this.$refs.video.addEventListener("error", function (e) {
        vm.isVideoAvailable = false
      })
      this.getVideoMetadata()
      this.getMarkers()
      this.newPath = this.video.path
    })
  },
  updated() {
    this.validate()
  },
  data: () => ({
    videoWidth: 480,
    videoHeight: 320,
    fps: null,
    resolution: null,
    codec: null,
    bitrate: null,
    seektime: 0,
    markers: [],
    markerType: 'Tag',
    markerTypes: ['Tag','Bookmark','Favorite'],
    markerTag: '',
    markerBookmarkText: '',
    isVideoAvailable: true,
    imgThumbLoading: null,
    dialogEditThumb: false,
    dialogEditPath: false,
    newPath: '',
    dialogAddMarker: false,
    dialogRemoveMarker: false,
    markerForRemove: {},
    markersEditable: false,
    markerNameClass: 'marker-name-hide',
    markerNameActive: '',
    markerEditActive: '',
    markerPlayable: false,
    markerPlayableActive: '',
    valid: false,
    isScrollToTopVisible: false,
    uploadedImage: null,
  }),
  computed: {
    videoId() {
      return this.$route.params.id.replace(/:/g, '')
    },
    videoDateAdded() {
      return new Date(this.video.date).toLocaleString()
    },
    video() {
      return this.$store.getters.videos.find({ id: this.videoId }).value()
    },
    getVideoPath() {
      return this.video.path
    },
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('video')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    handleFile(imgType) {
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images.main.display = true
      this.images.main.file = imgBase64
    },
    filterItemsTags(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const alternateNames = item.altNames
      let found = false
      for (let i=0;i<alternateNames.length;i++) {
        if (alternateNames[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    changeRating(stars, videoId) {
      this.$store.getters.videos
        .find({ id: this.videoId })
        .assign({ rating: stars })
        .write()
    },
    toggleFavorite() {
      this.$store.getters.videos
        .find({ id: this.videoId })
        .assign({ favorite: this.video.favorite })
        .write()
      this.video.favorite = !this.video.favorite
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
    setThumb() {
      let canvas = this.$refs.canvas.getContext('2d')
      canvas.fillRect(0,0,this.videoWidth/6,this.videoHeight/6)
      canvas.drawImage(this.$refs.video,0,0,this.videoWidth/6,this.videoHeight/6)
      let imgBuffer = this.$refs.canvas.toDataURL()
      imgBuffer = this.decodeBase64Image(imgBuffer)
      let outputImagePath = path.join(this.pathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      this.compressImage(imgBuffer.data, outputImagePath, 'thumb')
    },
    jumpTo(time) {
      if (this.markerPlayable) {
        let specificTime = this.convertVideoTimeWithHours(time)
        let mpcPath = this.$store.state.Settings.pathToSystemPlayer
        spawn(`${mpcPath}`, [`${this.video.path}`, '/startpos', specificTime])
      } else {
        this.$refs.video.currentTime = time
      }
    },
    convertVideoTime(time) {
      let mins = Math.floor(time / 60)
      let secs = Math.floor(time % 60)
      if (secs < 10) { secs = '0' + String(secs) }
      return mins + ':' + secs
    },
    convertVideoTimeWithHours(time) {
      let hours = Math.floor(time / 3600)
      let mins = Math.floor(time / 60)
      let secs = Math.floor(time % 60)
      if (hours < 10) { hours = '0' + String(hours) }
      if (mins < 10) { mins = '0' + String(mins) }
      if (secs < 10) { secs = '0' + String(secs) }
      return hours + ':' + mins + ':' + secs
    },
    openDialogAddMarker() {
      this.seektime = this.convertVideoTime(this.$refs.video.currentTime)
      this.dialogAddMarker = true
    },
    getMarkers() {
      this.markers = this.$store.getters.bookmarks.get('markers')
        .filter(marker=>(marker.videoId == this.videoId))
        .orderBy('time', ['asc']).value()
    },
    toggleMarkerPlayable() {
      if (this.markerPlayable) {
        this.markerPlayableActive = ''
      } else {
        this.markerPlayableActive = 'primary'
      }
      this.markerPlayable = !this.markerPlayable
    },
    toggleMarkerNameVisibility() {
      if (this.markerNameClass == 'marker-name') {
        this.markerNameClass = 'marker-name-hide'
        this.markerNameActive = ''
      } else {
        this.markerNameClass = 'marker-name'
        this.markerNameActive = 'primary'
      }
    },
    toggleMarkerEditable() {
      if (this.markersEditable) {
        this.markerEditActive = ''
      } else {
        this.markerEditActive = 'primary'
      }
      this.markersEditable = !this.markersEditable
    },
    openDialogRemoveMarker(marker) {
      this.dialogRemoveMarker = true
      this.markerForRemove = marker
    },
    removeMarker() {
      if (this.markerForRemove.type == 'Tag') {
        if (this.video.tags.includes(this.markerForRemove.name)) {
          // check if no more markers with type "Tag" and with the same name
          let isLastMarker = this.$store.getters.bookmarks.get('markers')
            .filter(marker=>(marker.type=='Tag'&&marker.name==this.markerForRemove.name))
            .value().length == 1
          if (isLastMarker) {
            this.video.tags = this.video.tags.filter(t => t!==this.markerForRemove.name)
            this.$store.getters.videos.find({ id: this.videoId })
              .assign({ tags: this.video.tags }).write()
            this.$store.commit('updateVideos')
          }
        }
      }
      let markerId = this.markerForRemove.id
      this.$store.getters.bookmarks.get('markers').remove({'id':markerId}).write()
      this.dialogRemoveMarker = false
      this.getMarkers()
    },
    addMarker() {
      this.validate()
      if (this.valid === false) {
        return false
      }
      let markerName
      if (this.markerType=='Tag') {
        markerName = this.markerTag
      }
      if (this.markerType=='Bookmark') {
        markerName = this.markerBookmarkText
      }
      if (this.markerType=='Favorite') {
        markerName = ''
      }
      this.$store.getters.bookmarks.get('markers').push({
        id: shortid.generate(),
        videoId: this.videoId,
        type: this.markerType,
        name: markerName,
        time: Math.floor(this.$refs.video.currentTime),
      }).write()
      if (this.markerType == 'Tag') {
        if (!this.video.tags.includes(this.markerTag)) {
          this.video.tags.push(this.markerTag)
          this.video.tags.sort()
          this.$store.getters.videos.find({ id: this.videoId }).assign({ 
            tags: this.video.tags,
          }).write()
          this.$store.commit('updateVideos')
        }
      }
      this.markerTag = ''
      this.markerBookmarkText = ''
      this.getMarkers()
      this.dialogAddMarker = false
    },
    getVideoMetadata() {
      ffmpeg.ffprobe(this.getVideoPath, (error, info) => {
        if (error) {
          console.error(error)
        }
        for(let i = 0; i < info.streams.length; i++) {
          if (info.streams[i].height !== undefined) {
            this.videoHeight = info.streams[i].height
          } 
          if (info.streams[i].width !== undefined) {
            this.videoWidth = info.streams[i].width
          } 
          if (info.streams[i].codec_type == 'video') {
            let meta = info.streams[i]
            this.fps = eval(meta.avg_frame_rate).toFixed(0)
            this.resolution = meta.width + 'x' + meta.height
            this.codec = meta.codec_name
            this.bitrate = (meta.bit_rate/1000).toFixed(0)
          }
        }
      })
    },
    imgPerformer(performer) {
      let performerId = this.getPerformer(performer).id
      if (performerId == undefined) {
        return path.join(this.pathToUserData, '/img/templates/performer.png')
      } else {
        let imgMainPath = path.join(this.pathToUserData, `/media/performers/${performerId}_main.jpg`)
        let imgAvatarPath = path.join(this.pathToUserData, `/media/performers/${performerId}_avatar.jpg`)
        if (fs.existsSync(imgAvatarPath)) {
          return imgAvatarPath
        } else if (fs.existsSync(imgMainPath)) {
          return imgMainPath
        } else {
          return path.join(this.pathToUserData, '/img/templates/performer.png')
        }
      }
    },
    getPerformer(performerName) {
      return this.$store.getters.performers.find({name:performerName}).value()
    },
    openPerformerPage(performerName) {
      this.$router.push(`/performer/:${this.getPerformer(performerName).id}?tabId=default`)
    },
    getTag(tagName) {
      return this.$store.getters.tags.find({name:tagName}).value()
    },
    getTagImgUrl(tagId) {
      let imgTag = path.join(this.pathToUserData, `/media/tags/${tagId}_.jpg`)
      return this.checkTagImageExist(imgTag)
    },
    checkTagImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/tag.png')
      }
    },
    getTagColor(tagName) {
      return this.$store.getters.tags.find({name:tagName}).value().color
    },
    getWebsiteColor(websiteName) {
      return this.$store.getters.websites.find({name:websiteName}).value().color
    },
    openDialogEditPath() {
      this.newPath = this.video.path
      this.dialogEditPath = true
    },
    savePath() {
      this.dialogEditPath = false
      this.video.path = this.newPath
      this.$store.getters.videos
        .find({ id: this.videoId })
        .assign({ path: this.video.path })
        .write()
    },
    playVideoInSystemPlayer() {
      shell.openItem(this.video.path)
    },
    validate () {
      this.$refs.form.validate()
    },
    getTagRules(tag) {
      if (tag == '' && this.markerType == 'Tag') {
        return 'Choose any tag'
      } else if (tag == undefined && this.markerType == 'Tag') {
        return 'Choose any tag'
      } else return true
    },
  },
}
</script>


<style lang="less" scoped>
.performers-starring-grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: repeat(auto-fill, minmax(164px, 1fr));
}
.performer-card {
  &:hover {
    .performer-ratings {
      opacity: 1;
    }
  }
}
.performer-ratings {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 0 5px 3px;
  opacity: 0;
  transition: .3s all ease;
}
.video-details {
  display: flex;
  justify-content: space-between;
  .rating-favorite {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    padding: 10px;
  }
}
.marker-name {
  margin-left: 5px;
  &-hide {
    display: none;
  }
}
</style>