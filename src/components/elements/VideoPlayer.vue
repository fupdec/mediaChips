<template>
  <div>
    <v-dialog v-model="$store.state.dialogVideoPlayer" scrollable persistent width="calc(100vw - 300px)">
      <v-card>
        <v-card-title class="py-1 px-3">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="playVideoInSystemPlayer" v-on="on" icon small class="mr-4">
                <v-icon>mdi-television-play</v-icon> 
              </v-btn>
            </template>
            <span>Play video in system player</span>
          </v-tooltip>
          <v-tooltip v-if="isVideoAvailable" bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="$store.state.Videos.dialogEditVideoInfo=true" v-on="on" icon small class="mr-4">
                <v-icon>mdi-movie-edit-outline</v-icon>
              </v-btn>
            </template>
            <span>Edit video</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="dialogEditThumb=true" v-on="on" icon small class="mr-4">
                <v-icon>mdi-image-edit-outline</v-icon> 
              </v-btn>
            </template>
            <span>Edit thumb</span>
          </v-tooltip>
          <v-tooltip v-if="isVideoAvailable" bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="setThumb" v-on="on" icon small class="mr-4">
                <v-icon>mdi-camera-outline</v-icon> 
              </v-btn>
            </template>
            <span>Set as thumb</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="dialogFileInfo=true" v-on="on" icon small class="mr-4">
                <v-icon>mdi-information-variant</v-icon> 
              </v-btn>
            </template>
            <span>File info</span>
          </v-tooltip>
          <v-menu v-if="isVideoAvailable" offset-y nudge-bottom="10" open-on-hover close-delay="1000">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on" icon small class="mr-4">
                <v-icon>mdi-tooltip-plus-outline</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-btn @click="openDialogMarkerTag" icon>
                <v-icon size="20">mdi-tag</v-icon> 
              </v-btn>
              <v-btn @click="addMarker('favorite')" icon>
                <v-icon size="20">mdi-heart</v-icon> 
              </v-btn>
              <v-btn @click="openDialogMarkerBookmark" icon>
                <v-icon size="20">mdi-bookmark</v-icon> 
              </v-btn>
              <v-divider></v-divider>
              <v-card-title v-if="isVideoAvailable && markers.length" @click="dialogEditMarkers=true" class="pa-0">
                <v-btn block x-small>edit markers</v-btn>
              </v-card-title>
            </v-card>
          </v-menu>
          <v-spacer></v-spacer>
          <v-menu v-if="video.performers.length" offset-y nudge-bottom="10" open-on-hover close-delay="500" :close-on-content-click="false">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on" icon small class="mr-4">
                <v-icon>mdi-account-outline</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-chip-group column>
                <v-chip v-for="performer in video.performers" :key="performer" outlined
                  @mouseover.stop="showImage($event, getPerformerId(performer), 'performer')" 
                  @mouseleave.stop="$store.state.hoveredImage=false"
                  @click="$store.state.hoveredImage=false" class="px-2 mx-2"
                > {{ performer }} </v-chip>
              </v-chip-group>
            </v-card>
          </v-menu>
          <v-menu v-if="video.tags.length" offset-y nudge-bottom="10" open-on-hover close-delay="500" :close-on-content-click="false">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on" icon small class="mr-4">
                <v-icon>mdi-tag-outline</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-chip-group column>
                <v-chip v-for="tag in video.tags" :key="tag" 
                  :color="getTagColor(tag)" outlined class="px-2 mx-2"
                  @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
                  @mouseleave.stop="$store.state.hoveredImage=false"
                  @click="$store.state.hoveredImage=false"
                > {{ tag }} </v-chip>
              </v-chip-group>
            </v-card>
          </v-menu>
          <v-menu v-if="video.website" offset-y nudge-bottom="10" open-on-hover close-delay="500" :close-on-content-click="false">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on" icon small class="mr-4">
                <v-icon>mdi-web</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <v-chip label outlined :color="getWebsiteColor(video.website)"
                  @mouseover.stop="showImage($event, getWebsiteId(video.website), 'website')" 
                  @mouseleave.stop="$store.state.hoveredImage=false"
                  @click="$store.state.hoveredImage=false"
                > {{ video.website }} </v-chip>
              </v-card-text>
            </v-card>
          </v-menu>
          <v-rating 
            v-model="video.rating" @input="changeRating($event)"
            color="yellow darken-2" background-color="grey"
            empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
            half-increments hover clearable dense class="mb-1"
          />
          <v-btn icon small @click="toggleFavorite" class="mx-4">
            <v-icon v-if="video.favorite===false" color="grey">mdi-heart-outline</v-icon>
            <v-icon v-else color="pink">mdi-heart</v-icon>
          </v-btn>
          <v-btn @click="$store.state.dialogVideoPlayer = false" small icon>
            <v-icon>mdi-close</v-icon> </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="pa-0">
            <video ref="videoPlayer" class="video-js"></video>
            <div class="thumb" style="display:none;"> 
              <canvas ref="canvas" :width="this.videoWidth/6" :height="this.videoHeight/6"/>
            </div>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    

    <v-dialog v-model="dialogMarkerTag" max-width="500" scrollable eager>
      <v-card>
        <v-card-title class="headline">
          Marker with tag on {{calcDur(seektime)}}
          <v-spacer></v-spacer>
          <v-icon>mdi-tooltip-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="pb-0">
            <v-card-actions>
              <v-spacer></v-spacer>
              <span class="caption mr-2">Sort list of tags by</span>
              <v-btn-toggle v-model="sortButtonsTags" mandatory color="primary">
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn small outlined value="name" v-on="on">
                      <v-icon>mdi-alphabetical-variant</v-icon>
                    </v-btn>
                  </template>
                  <span>name</span>
                </v-tooltip>
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn small outlined value="favorite" v-on="on">
                      <v-icon>mdi-heart-outline</v-icon>
                    </v-btn>
                  </template>
                  <span>favorite</span>
                </v-tooltip>
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn small outlined value="color" v-on="on">
                      <v-icon>mdi-palette</v-icon>
                    </v-btn>
                  </template>
                  <span>color</span>
                </v-tooltip>
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn small outlined value="date" v-on="on">
                      <v-icon>mdi-calendar-clock</v-icon>
                    </v-btn>
                  </template>
                  <span>date added</span>
                </v-tooltip>
              </v-btn-toggle>
            </v-card-actions>
            <v-autocomplete
              v-model="markerTag" outlined clearable hide-details
              :items="tagsAll" label="Tag for marker" placeholder="Choose a tag for marker"
              item-text="name" class="hidden-close"
              item-value="name" no-data-text="No more tags"
              :menu-props="{contentClass:'list-with-preview'}"
              :filter="filterItemsTags"
            >
              <template v-slot:selection="data">
                <v-chip
                  v-bind="data.attrs" :input-value="data.selected" 
                  @click="data.select" text-color="white" 
                  @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                  @mouseleave.stop="$store.state.hoveredImage=false"
                  :color="getTag(data.item.name).color" 
                > <span>{{ data.item.name }}</span>
                </v-chip>
              </template>
              <template v-slot:item="data">
                <div class="list-item"
                  @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                  @mouseleave.stop="$store.state.hoveredImage=false"
                > <v-icon :color="data.item.favorite===false ? 'grey':'pink'"
                    left size="14"> mdi-heart </v-icon>
                  <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
                  <span>{{data.item.name}}</span>
                  <span v-if="data.item.altNames.length" class="aliases"> 
                    {{data.item.altNames.join(', ').slice(0,50)}}
                  </span>
                </div>
              </template>
            </v-autocomplete>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="addMarker('tag')" :disabled="!markerTag" class="ma-4" color="primary">
            Add marker
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogMarkerBookmark" max-width="550" scrollable eager>
      <v-card>
        <v-card-title class="headline">
          Marker with bookmark on {{calcDur(seektime)}}
          <v-spacer></v-spacer>
          <v-icon>mdi-tooltip-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text>
            <v-textarea v-model="markerBookmarkText" label="Bookmark text" solo hide-details/>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="addMarker('bookmark')" :disabled="!markerBookmarkText" class="ma-4" color="primary">
            Add marker
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogEditMarkers" max-width="600" scrollable>
      <v-card>
        <v-card-title class="pt-2">
          <span class="headline">Edit markers</span>
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
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text style="flex-wrap: wrap;">
            <v-chip v-for="marker in markers" :key="marker.id"
              @click="jumpTo(marker.time)" @click:close="openDialogRemoveMarker(marker)"
              close-icon="mdi-close" :close="markersEditable"
              :title="marker.name" outlined small class="mr-1 mb-1"
            > 
              <v-icon v-if="marker.type.toLowerCase()=='favorite'" left small color="pink">mdi-heart</v-icon>
              <v-icon v-if="marker.type.toLowerCase()=='bookmark'" left small color="red">mdi-bookmark</v-icon>
              <v-icon v-if="marker.type.toLowerCase()=='tag'" left small :color="getTag(marker.name).color">mdi-tag</v-icon>
              {{calcDur(marker.time)}} 
              <span :class="markerNameClass">{{marker.name}}</span>
            </v-chip>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFileInfo" max-width="600" scrollable>
      <v-card class="mt-8">
        <v-card-title class="headline">File info</v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text>
            <v-simple-table dense>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">Parameter</th>
                    <th class="text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Path</td>
                    <td>{{video.path}}</td>
                  </tr>
                  <tr>
                    <td>Size</td>
                    <td>{{calcSize(video.size)}}</td>
                  </tr>
                  <tr>
                    <td>Framerate</td>
                    <td>{{fps}}</td>
                  </tr>
                  <tr>
                    <td>Resolution</td>
                    <td>{{resolution}}</td>
                  </tr>
                  <tr>
                    <td>Bitrate</td>
                    <td>{{bitrate}} kbps</td>
                  </tr>
                  <tr>
                    <td>Codec</td>
                    <td>{{codec}}</td>
                  </tr>
                  <tr>
                    <td>Date added</td>
                    <td>{{videoDateAdded}}</td>
                  </tr>
                  <tr>
                    <td>ID</td>
                    <td>{{video.id}}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogEditThumb" max-width="600" scrollable>
      <v-card>
        <vuescroll>
          <v-card-text>
            <v-col cols="12" align="center" justify="center" class="cropper-wrapper">
              <img id="clipboard" class="img-clipboard-temporary">
              <span class="overline">Thumb image</span>
              <Cropper
                :src="images.thumb.file"
                ref="thumb"
                class="cropper"
                :stencil-props="{aspectRatio: 16/9}"
                :min-height="20"
              />
              <v-btn @click="pasteImageFromClipboard('thumb')" class="mr-10" 
                outlined :color="images.thumb.btnColor">
                <v-icon left>mdi-clipboard-outline</v-icon> Paste from clipboard
              </v-btn>
              <v-btn v-if="images.thumb.display" 
                @click="crop(getImagePath('thumb',''),'thumb'),loader='imgThumbLoading'"  
                color="primary"  :loading="imgThumbLoading" :disabled="imgThumbLoading" 
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
  </div>
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
import LabelFunctions from '@/mixins/LabelFunctions'
import videojs from 'video.js'
import 'video.js/dist/video-js.min.css'
import markers from 'videojs-markers'
import 'videojs-markers/dist/videojs.markers.min.css'
import Functions from '@/mixins/Functions'


export default {
  name: 'VideoPlayer',
  components: {
    FilePond,
    vuescroll,
  },
  mixins: [CropImage, ShowImageFunction, LabelFunctions, Functions],
  created() {
    this.$set(this.images, 'thumb', this.getImageObject())
  },
  mounted() {
    this.$nextTick(function () {
      ffmpeg.setFfmpegPath(path.join(this.pathToUserData, '/ffmpeg/ffmpeg.exe')) 
      ffmpeg.setFfprobePath(path.join(this.pathToUserData, '/ffmpeg/ffprobe.exe'))
      this.checkImageExist(this.getImagePath('thumb',''), 'thumb')
      let vm = this
      this.videoOptions.sources.push({
        src: this.video.path,
        type: "video/mp4",
      })
      this.player = videojs(this.$refs.videoPlayer, this.videoOptions, function onPlayerReady() {
        vm.getMarkers()
        this.markers({
          markerStyle: {
            'width':'4px',
            'background-color': 'grey'
          },
          markerTip:{
            display: true,
            text: marker => (marker.text),
          },
        })
      })
      this.player.on('error', function() {
        vm.isVideoAvailable = false
      })
      this.getVideoMetadata()
    })
  },
  beforeDestroy() {
    if (this.player) {
      this.player.dispose()
    }
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
    markerTag: '',
    markerBookmarkText: '',
    isVideoAvailable: true,
    imgThumbLoading: null,
    dialogFileInfo: false,
    dialogEditThumb: false,
    dialogEditMarkers: false,
    dialogMarkerTag: false,
    dialogMarkerBookmark: false,
    dialogRemoveMarker: false,
    markerForRemove: {},
    markersEditable: false,
    markerNameClass: 'marker-name-hide',
    markerNameActive: '',
    markerEditActive: '',
    markerPlayable: false,
    markerPlayableActive: '',
    uploadedImage: null,
    player: null,
    videoOptions: {
      autoplay: true,
      controls: true,
      fluid: true,
      sources: [],
      controlBar: {
        'pictureInPictureToggle': false
      },
    },
  }),
  computed: {
    videoId() {
      return this.$store.state.videoPlayerId
    },
    videoDateAdded() {
      return new Date(this.video.date).toLocaleString()
    },
    video() {
      return this.$store.getters.videos.find({ id: this.videoId }).value()
    },
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('video')))
      return this.sortItems(tags, 'Tags')
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    sortButtonsTags: {
      get() {
        return this.$store.state.Videos.videoEditTagsSortBy
      },
      set(value) {
        this.$store.dispatch('updateVideoEditTagsSortBy', value)
      },
    },
  },
  methods: {
    handleFile(imgType) {
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images.main.display = true
      this.images.main.file = imgBase64
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
    setThumb() {
      let canvas = this.$refs.canvas.getContext('2d')
      canvas.fillRect(0,0,this.videoWidth/6,this.videoHeight/6)
      canvas.drawImage(this.$refs.videoPlayer,0,0,this.videoWidth/6,this.videoHeight/6)
      let imgBuffer = this.$refs.canvas.toDataURL()
      imgBuffer = this.decodeBase64Image(imgBuffer)
      let outputImagePath = path.join(this.pathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      this.compressImage(imgBuffer.data, outputImagePath, 'thumb')
    },
    
    openDialogMarkerTag() {
      this.dialogMarkerTag = true
      this.seektime = this.$refs.videoPlayer.currentTime
    },
    openDialogMarkerBookmark() {
      this.dialogMarkerBookmark = true
      this.seektime = this.$refs.videoPlayer.currentTime
    },
    addMarker(type) {
      let classes = 'marker-' + type
      let text = ''
      let time = Math.floor(this.$refs.videoPlayer.currentTime)
      if (type === 'tag') {
        text = this.markerTag
        classes += ' color-' + this.getTag(this.markerTag).color.toLowerCase().replace('#', '')
        this.dialogMarkerTag = false
      }
      if (type === 'favorite') {
      }
      if (type === 'bookmark') {
        text = this.markerBookmarkText
        this.dialogMarkerBookmark = false
      }
    
      this.player.markers.add([{
        time: time,
        text: text,
        class: classes
      }])

      this.$store.getters.bookmarks.get('markers').push({
        id: shortid.generate(),
        videoId: this.videoId,
        type: type,
        name: text,
        time: time,
      }).write()
      if (type == 'tag') {
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
    },
    jumpTo(time) {
      if (this.markerPlayable) {
        let specificTime = this.convertVideoTimeWithHours(time)
        let mpcPath = this.$store.state.Settings.pathToSystemPlayer
        spawn(`${mpcPath}`, [`${this.video.path}`, '/startpos', specificTime])
      } else {
        this.$refs.videoPlayer.currentTime = time
      }
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
    getMarkers() {
      this.markers = this.$store.getters.bookmarks.get('markers')
        .filter(marker=>(marker.videoId == this.videoId))
        .orderBy('time', ['asc']).value()
      setTimeout(() => {
        this.getMarkersForTimeline()
      }, 1000)
    },
    getMarkersForTimeline() {
      const markers = this.markers.map(marker=>{
        let classes = 'marker-' + marker.type.toLowerCase()
        if (marker.name) {
          classes += ' color-' + this.getTag(marker.name).color.toLowerCase().replace('#', '')
        }
        let text = marker.type.toLowerCase()=='favorite'? '<3':marker.name
        return {
          time: marker.time, 
          text: text, 
          class: classes,
        }
      })
      this.player.markers.reset(markers)
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
    getVideoMetadata() {
      ffmpeg.ffprobe(this.video.path, (error, info) => {
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
    playVideoInSystemPlayer() {
      shell.openItem(this.video.path)
    },
    sortItems(items, type) {
      const sortBy = this[`sortButtons${type}`]
      let itemsSorted = items.orderBy(i=>(i.name.toLowerCase()),['asc'])
      if (sortBy !== 'name') {
        itemsSorted = itemsSorted.orderBy(i=>(i[sortBy]),['desc']).value()
        return itemsSorted
      } else return itemsSorted.value()
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
  },
}
</script>


<style lang="less">
.vjs-marker {
  &:before {
    font-family: "Material Design Icons";
    position: absolute;
    left: -100%;
    top: -100%;
  }
  &.marker {
    &-tag:before {
      content: "\F04F9";
    }
    &-favorite:before {
      content: "\F02D1";
      color: #e91e63;
    }
    &-bookmark:before {
      content: "\F00C0";
      color: #f13939;
    }
  }
  &.color {
    &-cc0e00 {color:#cc0e00;}
    &-e8004f {color:#e8004f;}
    &-ae0eff {color:#ae0eff;}
    &-2041f7 {color:#2041f7;}
    &-2196f3 {color:#2196f3;}
    &-00bcd4 {color:#00bcd4;}
    &-009688 {color:#009688;}
    &-2ac530 {color:#2ac530;}
    &-8bc34a {color:#8bc34a;}
    &-ff9800 {color:#ff9800;}
    &-ff5722 {color:#ff5722;}
    &-795548 {color:#795548;}
    &-9b9b9b {color:#9b9b9b;}
  }
}
</style>
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

