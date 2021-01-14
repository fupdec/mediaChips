<template>
  <div>
    <v-dialog v-model="$store.state.dialogVideoPlayer" content-class="video-player" persistent width="calc(100vw - 300px)">
      <v-card>
        <v-card-title class="pa-0 px-3">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="playVideoInSystemPlayer" v-on="on" icon tile>
                <v-icon>mdi-television-play</v-icon> 
              </v-btn>
            </template>
            <span>Play video in system player</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="editVideoInfo" v-on="on" icon tile>
                <v-icon>mdi-movie-edit-outline</v-icon>
              </v-btn>
            </template>
            <span>Edit video</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="openDialogEditThumb" v-on="on" icon tile>
                <v-icon>mdi-image-edit-outline</v-icon> 
              </v-btn>
            </template>
            <span>Edit thumb</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="dialogFileInfo=true" v-on="on" icon tile>
                <v-icon>mdi-information-variant</v-icon> 
              </v-btn>
            </template>
            <span>File info</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="watchLater" v-on="on" icon tile>
                <v-icon v-if="isWatchLater">mdi-bookmark-minus-outline</v-icon> 
                <v-icon v-else>mdi-bookmark-plus-outline</v-icon> 
              </v-btn>
            </template>
            <span v-if="isWatchLater">Remove from watch later</span>
            <span v-else>Watch later</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="dialogAddToPlaylist=true" v-on="on" icon tile>
                <v-icon>mdi-playlist-plus</v-icon> 
              </v-btn>
            </template>
            <span>Add to playlist</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="isPlaylistVisible=!isPlaylistVisible, scrollToNowPlaying()" v-on="on" icon tile>
                <v-icon>mdi-playlist-play</v-icon>
              </v-btn>
            </template>
            <span>Toggle playlist</span>
          </v-tooltip>
          <v-tooltip v-if="isVideoAvailable" bottom>
            <template v-slot:activator="{ on }">
              <v-btn @click="setThumb" v-on="on" icon tile>
                <v-icon>mdi-camera-outline</v-icon> 
              </v-btn>
            </template>
            <span>Set as thumb</span>
          </v-tooltip>
          <v-menu v-if="isVideoAvailable" offset-y nudge-bottom="10" open-on-hover close-delay="1000">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on" icon tile>
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
              <v-btn v-bind="attrs" v-on="on" icon tile>
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
              <v-btn v-bind="attrs" v-on="on" icon tile>
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
              <v-btn v-bind="attrs" v-on="on" icon tile>
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
          <v-btn icon tile @click="toggleFavorite">
            <v-icon v-if="video.favorite===false" color="grey">mdi-heart-outline</v-icon>
            <v-icon v-else color="pink">mdi-heart</v-icon>
          </v-btn>
          <v-btn @click="$store.state.dialogVideoPlayer = false" icon tile class="ml-4">
            <v-icon>mdi-close</v-icon> </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pa-0">
          <video ref="videoPlayer" class="video-js"></video>
          <!-- TODO: keep player ratio 16/9 for videos with ratio 4:3 and mobile videos -->
          <div class="thumb" style="display:none;"> 
            <canvas ref="canvas" :width="this.videoWidth/6" :height="this.videoHeight/6"/>
          </div>
        </v-card-actions>
        <v-card v-show="isPlaylistVisible" class="vjs-playlist" width="20vw" tile>
          <v-btn @click="isPlaylistVisible=!isPlaylistVisible" class="close" small fab>
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
          <vuescroll ref="playlist" class="playlist">
            <v-card-text class="pa-0">
              <v-list dense class="pa-0">
                <v-list-item-group v-model="selectedVideo" mandatory color="primary">
                  <v-list-item v-for="(video, i) in $store.state.videoPlayerPlaylist" 
                    :key="video.id" @click="play(i)" class="video-item" :ref="`videoItem${i}`">
                    <img :src="getPlaylistImgUrl(video.id)" class="thumb"/>
                    <span class="video-name">
                      <b>{{i+1}}.</b>
                      <span class="path">{{getFileNameFromPath(video.path)}}</span>
                    </span>
                    <span v-if="selectedVideo===i" class="play-state overline text--primary">
                      <v-icon class="pl-2 pr-1">mdi-play</v-icon>
                      <span class="pr-4">Now playing</span>
                    </span>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-card-text>
          </vuescroll>
        </v-card>
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
              <Cropper :src="images.thumb.file" ref="thumb" class="cropper"
                :stencil-props="{aspectRatio: 16/9}" :min-height="20"/>
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
    <v-dialog v-model="dialogAddToPlaylist" max-width="420">
      <v-card class="add-playlist">
        <v-card-title class="headline py-1">Add to playlist
          <v-spacer></v-spacer>
          <v-icon>mdi-playlist-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="py-0" v-if="playlists.length">
            <v-list dense>
              <v-list-item-group color="secondary" v-model="selectedPlaylist">
                <v-list-item v-for="(item, i) in playlists" :key="i">
                  <span>{{item.name}}</span>
                  <span>{{item.videos.length}}</span>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn @click="dialogAddToPlaylist=false" small class="ma-2">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="addToPlaylist" :disabled="typeof this.selectedPlaylist!=='number'" 
            small class="ma-2" color="primary">
            <v-icon left>mdi-plus</v-icon> Add
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
import Functions from '@/mixins/Functions'

import videojs from 'video.js'
import 'video.js/dist/video-js.min.css'
import playlist from 'videojs-playlist'
import markers from 'videojs-markers'
import 'videojs-markers/dist/videojs.markers.min.css'


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
      this.selectedVideo = this.getIndexOfCurrentVideo()
      const vm = this
      this.videoOptions.sources.push({
        src: this.video.path,
        type: "video/mp4",
      })
      this.videos = this.$store.state.videoPlayerPlaylist.map(video=>({
        sources: [{
          src: video.path,
          type: 'video/mp4'
        }],
      }))
      this.player = videojs(this.$refs.videoPlayer, this.videoOptions, function onPlayerReady() {
        const player = this
        let Button = videojs.getComponent('Button')
        let PrevButton = videojs.extend(Button, {
          constructor: function() {
            Button.apply(this, arguments)
            this.addClass('vjs-prev')
            this.controlText("Previous")
          },
          handleClick: function() {
            player.playlist.previous()
            let id = vm.$store.state.videoPlayerPlaylist[player.playlist.currentItem()].id
            vm.$store.state.videoPlayerVideoId = id
            vm.getMarkers()
            vm.selectedVideo = player.playlist.currentItem()
          }
        })
        let NextButton = videojs.extend(Button, {
          constructor: function() {
            Button.apply(this, arguments)
            this.addClass('vjs-next')
            this.controlText("Next")
          },
          handleClick: function() {
            player.playlist.next()
            let id = vm.$store.state.videoPlayerPlaylist[player.playlist.currentItem()].id
            vm.$store.state.videoPlayerVideoId = id
            vm.getMarkers()
            vm.selectedVideo = player.playlist.currentItem()
          }
        })
        videojs.registerComponent('NextButton', NextButton)
        videojs.registerComponent('PrevButton', PrevButton)
        this.getChild('controlBar').addChild('PrevButton', {}, 0)
        this.getChild('controlBar').addChild('NextButton', {}, 2)

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
        this.playlist(vm.videos)
        this.playlist.currentItem(vm.selectedVideo)
      })
      this.player.on('error', function() {
        vm.isVideoAvailable = false
      })
      this.player.on('loadeddata', function() {
        vm.isVideoAvailable = true
        vm.getMarkers()
      })
      this.player.on('playlistitem', function() {
        let id = vm.$store.state.videoPlayerPlaylist[vm.player.playlist.currentItem()].id
        vm.$store.state.videoPlayerVideoId = id
        vm.selectedVideo = vm.player.playlist.currentItem()
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
    dialogAddToPlaylist: false,
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
    videos: [],
    selectedVideo: 1,
    isPlaylistVisible: false,
    selectedPlaylist: null,
  }),
  computed: {
    video() {
      return this.$store.getters.videos.find({id: this.$store.state.videoPlayerVideoId}).value()
    },
    playlists() {
      return this.$store.getters.playlists.filter(list=>(list.name!='Watch later')).value()
    },
    videoDateAdded() {
      return new Date(this.video.date).toLocaleString()
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
    isWatchLater() {
      let playlist = this.$store.getters.playlists.find({name:'Watch later'}).value()
      return playlist.videos.includes(this.video.id)
    },
  },
  methods: {
    handleFile(imgType) {
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images.main.display = true
      this.images.main.file = imgBase64
    },
    changeRating(stars,) {
      this.$store.getters.videos
        .find({ id: this.video.id })
        .assign({ rating: stars })
        .write()
    },
    toggleFavorite() {
      this.$store.getters.videos
        .find({ id: this.video.id })
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
        videoId: this.video.id,
        type: type,
        name: text,
        time: time,
      }).write()
      if (type == 'tag') {
        if (!this.video.tags.includes(this.markerTag)) {
          this.video.tags.push(this.markerTag)
          this.video.tags.sort()
          this.$store.getters.videos.find({ id: this.video.id }).assign({ 
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
        .filter(marker=>(marker.videoId == this.video.id))
        .orderBy('time', ['asc']).value()
      setTimeout(() => {
        this.getMarkersForTimeline()
      }, 500) // TODO: add markers after video ready
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
    getIndexOfCurrentVideo() {
      return _.findIndex(this.$store.state.videoPlayerPlaylist, {id: this.$store.state.videoPlayerVideoId})
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
            this.$store.getters.videos.find({ id: this.video.id })
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
    getTag(tagName) {
      return this.$store.getters.tags.find({name:tagName}).value()
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
    getFileNameFromPath(videoPath) {
      return videoPath.split("\\").pop().split('.').slice(0, -1).join('.')
    },
    watchLater() {
      let playlist = this.$store.getters.playlists.find({name:'Watch later'}).value()
      if (playlist.videos.includes(this.video.id)) {
        this.$store.getters.playlists.find({name:'Watch later'}).assign({
          videos: playlist.videos.filter(video=>(video !== this.video.id)),
          edit: Date.now(),
        }).write()
      } else {
        let videosFromPlaylist = playlist.videos
        videosFromPlaylist.push(this.video.id)
        this.$store.getters.playlists.find({name:'Watch later'}).assign({
          videos: videosFromPlaylist,
          edit: Date.now(),
        }).write()
      }
    },
    getPlaylistImgUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return this.checkPlaylistImageExist(imgPath)+'?lastmod='+Date.now()
    },
    checkPlaylistImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        this.errorThumb = true
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    play(number) {
      this.player.playlist.currentItem(number)
      this.$store.state.videoPlayerVideoId = this.$store.state.videoPlayerPlaylist[number].id
      this.getMarkers()
    },
    scrollToNowPlaying() {
      const height = `${this.selectedVideo * document.documentElement.clientWidth / 10}`
      this.$refs.playlist.scrollTo({ y: height }, 50)
    },
    addToPlaylist() {
      let id = this.playlists[this.selectedPlaylist].id
      let playlist = this.$store.getters.playlists.find({id: id}).value()
      if (!playlist.videos.includes(this.video.id)) {
        let videosFromPlaylist = playlist.videos
        videosFromPlaylist.push(this.video.id)
        this.$store.getters.playlists.find({id: id}).assign({
          videos: videosFromPlaylist,
          edit: Date.now(),
        }).write()
      }
      this.dialogAddToPlaylist = false
    },
    editVideoInfo() {
      this.$store.commit('updateSelectedVideos', [this.video.id])
      this.$store.state.Videos.dialogEditVideoInfo = true
    },
    openDialogEditThumb() {
      this.checkImageExist(this.getImagePath('thumb',''), 'thumb')
      this.dialogEditThumb = true
    },
  },
}
</script>


<style lang="less">
.video-player {
  overflow: hidden !important;
}
.vjs-playlist {
  position: absolute;
  top: 64px;
  right: 0;
  bottom: 50px;
  z-index: 1000;
  .close {
    position: absolute;
    left: -45px;
    top: 0;
    bottom: 0;
    margin: auto;
  }
  .video-item {
    position: relative;
    overflow: hidden;
    height: 10vw;
  }
  .video-name {
    font-size: 1.8vh;
    line-height: 1.2;
    word-break: keep-all;
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    overflow: hidden;
    .path {
      padding-left: 4px;
      position: absolute;
    }
  }
  .play-state {
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
    font-weight: bold;
    position: absolute;
    bottom: 5px;
    left: 5px;
    &::before {
      content: '';
      position: absolute;
      background-color: currentColor;
      width: 100%;
      height: 100%;
      border-radius: 50px;
      filter: invert(1);
      z-index: -1;
    }
  }
  .thumb {
    position: absolute;
    min-height: 100%;
    width: 100%;
    left: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    mask-image: linear-gradient(to top, rgba(0, 0, 0, 1), transparent);
  }
}
.add-playlist {
  .v-list-item {
    display: flex;
    justify-content: space-between;
    &:after {
      display: none;
    }
  }
}
.video-js {
  .vjs-control-text {
    height: 0;
  }
}
.vjs-prev {
  width: 40px;
  cursor: pointer;
  &:before {
    content: "\F04AE";
    font-family: "Material Design Icons";
    font-size: 2em;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
.vjs-next {
  width: 40px;
  cursor: pointer;
  &:before {
    content: "\F04AD";
    font-family: "Material Design Icons";
    font-size: 2em;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
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

