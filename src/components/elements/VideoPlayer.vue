<template>
  <div class="video-player-wrapper">
    <v-card class="video-player" :outlined="!maximized">
      <v-card-title class="pa-0 title-bar" :class="{maximized:maximized}">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="playVideoInSystemPlayer" v-on="on" icon tile width="46">
              <v-icon>mdi-television-play</v-icon> 
            </v-btn>
          </template>
          <span>Play video in system player</span>
        </v-tooltip>
        <!-- <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="editVideoInfo" v-on="on" icon tile>
              <v-icon>mdi-movie-edit-outline</v-icon>
            </v-btn>
          </template>
          <span>Edit video</span>
        </v-tooltip> -->
        <!-- <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="openDialogEditThumb" v-on="on" icon tile>
              <v-icon>mdi-image-edit-outline</v-icon> 
            </v-btn>
          </template>
          <span>Edit thumb</span>
        </v-tooltip> -->
        <!-- <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="openDialogFileInfo" v-on="on" icon tile width="46">
              <v-icon>mdi-information-variant</v-icon> 
            </v-btn>
          </template>
          <span>File info</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="watchLater" v-on="on" icon tile width="46">
              <v-icon v-if="isWatchLater">mdi-bookmark-minus-outline</v-icon> 
              <v-icon v-else>mdi-bookmark-plus-outline</v-icon> 
            </v-btn>
          </template>
          <span v-if="isWatchLater">Remove from watch later</span>
          <span v-else>Watch later</span>
        </v-tooltip> -->
        <!-- <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="dialogAddToPlaylist=true" v-on="on" icon tile>
              <v-icon>mdi-playlist-plus</v-icon> 
            </v-btn>
          </template>
          <span>Add to playlist</span>
        </v-tooltip> -->
        <!-- <v-tooltip v-if="isVideoAvailable" bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="setThumb" v-on="on" icon tile>
              <v-icon>mdi-camera-outline</v-icon> 
            </v-btn>
          </template>
          <span>Set as thumb</span>
        </v-tooltip> -->
        <!-- <v-menu v-if="isVideoAvailable" offset-y nudge-bottom="10" open-on-hover close-delay="1000">
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" icon tile width="46">
              <v-icon>mdi-map-marker</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title v-if="isVideoAvailable && markers.length" class="pa-0">
              <v-btn @click="dialogEditMarkers=true" block icon tile small>edit markers</v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn @click="openDialogMarkerTag" v-on="on" icon tile width="46" height="36">
                  <v-icon size="20">mdi-tag-outline</v-icon> 
                </v-btn>
              </template>
              <span>Add Marker with Tag</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn @click="addMarker('favorite')" v-on="on" icon tile width="46" height="36">
                  <v-icon size="20">mdi-heart-outline</v-icon> 
                </v-btn>
              </template>
              <span>Add Favorite Marker</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn @click="openDialogMarkerBookmark" v-on="on" icon tile width="46" height="36">
                  <v-icon size="20">mdi-bookmark-outline</v-icon> 
                </v-btn>
              </template>
              <span>Add Marker with Text</span>
            </v-tooltip>
          </v-card>
        </v-menu> -->
        <v-spacer></v-spacer>
        <span class="now-playing-title">{{getFileNameFromPath(nowPlaying)}}</span>

        <v-spacer></v-spacer>
        <!-- <v-menu v-if="video.performers.length" offset-y nudge-bottom="10" open-on-hover close-delay="500" :close-on-content-click="false">
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
        <v-rating v-model="video.rating" 
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          half-increments hover clearable dense class="mb-1"/>
        <v-btn icon tile>
          <v-icon v-if="video.favorite===false" color="grey">mdi-heart-outline</v-icon>
          <v-icon v-else color="pink">mdi-heart</v-icon>
        </v-btn> -->
        <div class="window-controls">
          <v-btn text tile small width="46" height="36" @click="minimize">
            <v-icon size="16">mdi-minus</v-icon>
          </v-btn>
          <v-btn v-if="maximized" text tile small width="46" height="36" @click="unmaximize">
            <v-icon size="18">mdi-window-restore</v-icon>
          </v-btn>
          <v-btn v-else text tile small width="46" height="36" @click="maximize">
            <v-icon size="14">mdi-square-outline</v-icon>
          </v-btn>
          <v-btn text tile small width="46" height="36" @click="close" 
            class="close-app-btn" color="#d70000"> 
            <v-icon size="18">mdi-window-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <div class="video-player-container">
        <VlcPlayer ref="player" autoplay controls enableStatusText 
          @togglePlaylist="togglePlaylist" @toggleMarkers="toggleMarkers" 
          @nowPlaying="updateNowPlaying($event)" @next="next" @prev="prev"
          :src="videoSrc" :playlist="playlist" :playIndex="playIndex" 
          :markers="markers" />

        <!-- <video ref="videoPlayer" class="video-js" preload="none"></video> -->
        <div class="thumb" style="display:none;"> 
          <canvas ref="canvas" :width="videoWidth/6" :height="videoHeight/6"/>
        </div>
        <v-card v-show="isMarkersVisible" class="markers-wrapper" outlined tile>
          <v-tabs v-model="markerTab" height="36" grow>
            <v-tabs-slider></v-tabs-slider>
            <v-tab href="#tab-1">
              <v-icon>mdi-tag</v-icon>
            </v-tab>
            <v-tab href="#tab-2">
              <v-icon>mdi-account</v-icon>
            </v-tab>
            <v-tab href="#tab-3">
              <v-icon>mdi-heart</v-icon>
            </v-tab>
            <v-tab href="#tab-4">
              <v-icon>mdi-bookmark</v-icon>
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="markerTab">
            <v-tab-item value="tab-1">
              <vuescroll>
                <v-card-text class="pa-0">
                  <v-list dense class="pa-0">
                    <v-list-item> Marker 1
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </vuescroll>
            </v-tab-item>
            <v-tab-item value="tab-2">
              <vuescroll>
                <v-card-text class="pa-0">
                  <v-list dense class="pa-0">
                    <v-list-item> Marker 1
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </vuescroll>
            </v-tab-item>
            <v-tab-item value="tab-3">
              <vuescroll>
                <v-card-text class="pa-0">
                  <v-list dense class="pa-0">
                    <v-list-item> Marker 1
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </vuescroll>
            </v-tab-item>
            <v-tab-item value="tab-4">
              <vuescroll>
                <v-card-text class="pa-0">
                  <v-list dense class="pa-0">
                    <v-list-item> Marker 1
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </vuescroll>
            </v-tab-item>
          </v-tabs-items>
        </v-card>
        <v-card v-show="isPlaylistVisible" class="playlist-wrapper" outlined tile>
          <vuescroll ref="playlist" class="playlist">
            <v-card-text class="pa-0">
              <v-list dense class="pa-0">
                <v-list-item-group v-model="selectedVideo" mandatory color="primary">
                  <v-list-item v-for="(video, i) in videos" 
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
      </div>
    </v-card>
    

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
      <v-card>
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
        <v-card-text class="mt-6 text-center" v-if="markerForRemove.time">
          <v-chip @click="jumpTo(markerForRemove.time)" outlined> 
            <v-icon v-if="markerForRemove.type.toLowerCase()=='favorite'" 
              left size="20" color="pink">mdi-heart</v-icon>
            <v-icon v-if="markerForRemove.type.toLowerCase()=='bookmark'" 
              left size="20" color="red">mdi-bookmark</v-icon>
            <v-icon v-if="markerForRemove.type.toLowerCase()=='tag'"
               left size="20" :color="getTag(markerForRemove.name).color">mdi-tag</v-icon>
            {{calcDur(markerForRemove.time)}} 
            <span class="ml-2">{{markerForRemove.name}}</span>
          </v-chip>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogRemoveMarker = false" class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="removeMarker" class="ma-4" dark color="red">
            <v-icon left>mdi-delete-alert</v-icon> Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- <v-dialog v-model="dialogAddToPlaylist" max-width="420">
      <v-card class="add-playlist">
        <v-card-title class="headline py-1">Add to playlist
          <v-spacer></v-spacer>
          <v-icon>mdi-playlist-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="py-0" v-if="playlists.length">
            <v-list dense>
              <v-list-item-group color="primary" v-model="selectedPlaylist">
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
    </v-dialog> -->
  </div>
</template>


<script>
const _ = require("lodash")
const fs = require("fs")
const path = require("path")
const shortid = require('shortid')
const ffmpeg = require('fluent-ffmpeg')
const { spawn } = require( 'child_process' )
const { ipcRenderer, shell } = require('electron')
const remote = require('electron').remote
const win = remote.getCurrentWindow()

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

// import videojs from 'video.js'
// import hotkeys from 'videojs-hotkeys'
// import 'video.js/dist/video-js.min.css'
// import playlist from 'videojs-playlist'
// import markers from 'videojs-markers'
// import 'videojs-markers/dist/videojs.markers.min.css'
import VlcPlayer from '@/components/app/player/VlcPlayer'

export default {
  name: 'VideoPlayer',
  components: {
    FilePond,
    vuescroll,
    VlcPlayer,
  },
  mixins: [CropImage, ShowImageFunction, LabelFunctions, Functions],
  async beforeCreate() {
    // get databases from main window
    await this.$store.dispatch('getDb', 'videos')
    await this.$store.dispatch('getDb', 'tags')
    await this.$store.dispatch('getDb', 'playlists')
    await this.$store.dispatch('getDb', 'markers')
    await this.$store.dispatch('getDb', 'settings')
    // window events
    win.on('maximize', ()=>{
      this.maximized = true
    })
    win.on('unmaximize', ()=>{
      this.maximized = false
    })
  },
  created() {
    this.$set(this.images, 'thumb', this.getImageObject())
  },
  mounted() {
    this.$nextTick(function () {
      // include ffmpeg
      ffmpeg.setFfmpegPath(path.join(this.pathToUserData, '/ffmpeg/ffmpeg.exe')) 
      ffmpeg.setFfprobePath(path.join(this.pathToUserData, '/ffmpeg/ffprobe.exe'))
      // this.initVideoPlayer()
      ipcRenderer.on('getDataForPlayer', (event, data) => {
        this.updateVideoPlayer(data)
      })
    })
  },
  beforeDestroy() {
    // if (this.player) {
    //   this.player.dispose()
    // }
    win.removeAllListeners()
  },
  data: () => ({
    videoSrc: null,
    video: null,
    playlist: [],
    playIndex: 0,
    videos: null,
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
    selectedVideo: 1,
    isPlaylistVisible: false,
    isMarkersVisible: false,
    selectedPlaylist: null,
    maximized: win.isMaximized(),
    markerTab: null,
    nowPlaying: '',
  }),
  computed: {
    playlists() {
      if (this.playlistsDb === null) return []
      return _.filter(this.playlistsDb, list=>(list.name!='Watch later'))
    },
    videoDateAdded() {
      if (this.video === null) {
        return ''
      } else {
        return new Date(this.video.date).toLocaleString()
      }
    },
    tagsAll() {
      if (this.tagsDb === null) return []
      return _.filter(this.tagsDb, t=>(t.category.includes('video')))
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    isWatchLater() {
      if (this.video === null) {
        return false
      } else {
        if (this.playlistsDb === null) return false
        let playlist = _.find(this.playlistsDb, {name:'Watch later'})
        console.log(this.video.id)
        return playlist.videos.includes(this.video.id)
      }
    },
    videosDb() {
      return this.$store.state.videosDb
    },
    tagsDb() {
      return this.$store.state.tagsDb
    },
    playlistsDb() {
      return this.$store.state.playlistsDb
    },
    markersDb() {
      return this.$store.state.markersDb
    },
    settingsDb() {
      return this.$store.state.settingsDb
    },
  },
  methods: {
    initVideoPlayer() {
      const vm = this
      const options = {
        autoplay: true,
        controls: true,
        fluid: true,
        controlBar: {
          pictureInPictureToggle: false,
        },
      }
      this.player = videojs(this.$refs.videoPlayer, options, function onPlayerReady() {
        const player = this
        // console.log('init player')
        // init playlist
        player.playlist([])
        player.hotkeys({
          seekStep: 10,
        })
        // add nav buttons
        let Button = videojs.getComponent('Button')
        let PrevButton = videojs.extend(Button, {
          constructor: function() {
            Button.apply(this, arguments)
            this.addClass('vjs-prev')
            this.controlText("Previous")
          },
          handleClick: function() {
            player.playlist.previous()
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
          }
        })
        videojs.registerComponent('NextButton', NextButton)
        videojs.registerComponent('PrevButton', PrevButton)
        player.getChild('controlBar').addChild('PrevButton', {}, 0)
        player.getChild('controlBar').addChild('NextButton', {}, 2)
        // init markers
        player.markers({
          markerStyle: {
            'width':'4px',
            'background-color': 'grey'
          },
          markerTip: {
            display: true,
            text: marker => (marker.text),
          },
          markers: [],
        })
        // player events
        player.on('error', function() {
          vm.isVideoAvailable = false
          player.pause()
        })
        player.on('loadeddata', function() { // when video loaded
          vm.isVideoAvailable = true
          // console.log('loadeddata')
          
          setTimeout(() => {
            vm.getMarkers() // add markers
          }, 100)
        })
        player.on('playlistchange', function() {
          // console.log('playlistchange')
          player.playlist.currentItem(vm.newPlaylistStartVideoIndex)
        })
        player.on('playlistitem', function() { // when click on playlist item 
          // console.log('playlistitem')
          const index = player.playlist.currentItem()
          vm.updateCurrentVideo(index)
          vm.selectedVideo = index
        })
      })
    },
    updateVideoPlayer(data) {
      // console.log('update video player')
      // console.log(data)
      this.videoSrc = 'file:///'+ data.videos[0].path
      this.videos = data.videos
      this.video = _.find(this.videosDb, {id: data.id})
      this.playIndex = _.findIndex(data.videos, {id: data.id})
      this.selectedVideo = this.playIndex
      this.playlist = data.videos.map(video=>'file:///'+video.path)
      this.getMarkers()
      setTimeout(() => {
        console.log(this.video.path)
        // this.player.playlist(this.playlist)
      }, 1000)
    },
    loadeddata(event) {
      console.log(event)
    },
    updateCurrentVideo(index) {
      this.video = this.videos[index]
    },
    handleFile(imgType) {
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images.main.display = true
      this.images.main.file = imgBase64
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

      const marker = {
        id: shortid.generate(),
        videoId: this.video.id,
        type: type,
        name: text,
        time: time,
      } 

      // TODO fix when add new tag to the video replaces all tags
      ipcRenderer.send('addMarker', marker, this.markerTag, this.video)

      this.markerTag = ''
      this.markerBookmarkText = ''
      this.getMarkers()
    },
    jumpTo(time) {
      if (this.markerPlayable) {
        let specificTime = new Date(1000*time).toISOString().substr(11, 8)
        let mpcPath = this.$store.state.settingsDb.pathToSystemPlayer
        spawn(`${mpcPath}`, [`${this.video.path}`, '/startpos', specificTime])
      } else {
        this.$refs.videoPlayer.currentTime = time
      }
    },
    async getMarkers() {
      // console.log('get markers')
      // console.log(this.video)
      await this.$store.dispatch('getDb', 'markers')
      let video = this.videos[this.playIndex]
      console.log(video)
      let markers = _.filter(this.markersDb, marker=>marker.videoId == video.id)
      this.markers = _.orderBy(markers, 'time', ['asc'])
      // this.addMarkersToTimeline()
    },
    addMarkersToTimeline() {
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
      ipcRenderer.send('removeMarker', this.markerForRemove, this.video)
      this.markerForRemove = {}
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
    openDialogFileInfo() {
      this.getVideoMetadata()
      this.dialogFileInfo = true
    },
    getTag(tagName) {
      return _.find(this.tagsDb, {name:tagName})
    },
    getTagColor(tagName) {
      return _.find(this.tagsDb, {name:tagName}).color
    },
    getWebsiteColor(websiteName) {
      return _.find(this.websitesDb, {name:websiteName}).color
    },
    playVideoInSystemPlayer() {
      shell.openPath(this.video.path)
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
      ipcRenderer.send('watchLater', this.video.id)
      this.$store.dispatch('getDb', 'playlists')
    },
    getPlaylistImgUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return this.checkPlaylistImageExist(imgPath)
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
      // this.videoSrc = 'file:///'+ this.videos[number].path
      this.playIndex = number
      this.getMarkers()
    },
    next() {
      this.playIndex = this.playIndex + 1
      this.selectedVideo = this.selectedVideo + 1
      this.getMarkers()
    },
    prev() {
      this.playIndex = this.playIndex - 1
      this.selectedVideo = this.selectedVideo - 1
      this.getMarkers()
    },
    togglePlaylist() {
      this.isPlaylistVisible=!this.isPlaylistVisible
      // console.log(this.selectedVideo)
      if (!this.isPlaylistVisible) return
      const height = `${this.selectedVideo * document.documentElement.clientWidth / 10}`
      this.$refs.playlist.scrollTo({ y: height }, 50)
    },
    toggleMarkers() {
      this.isMarkersVisible=!this.isMarkersVisible
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
    updateNowPlaying(event) {
      if (event) {
        this.nowPlaying = event.mrl
      }
    },
    editVideoInfo() {
      this.$store.commit('updateSelectedVideos', [this.video.id])
      this.$store.state.Videos.dialogEditVideoInfo = true
    },
    openDialogEditThumb() {
      this.checkImageExist(this.getImagePath('thumb',''), 'thumb')
      this.dialogEditThumb = true
    },
    minimize() {
      win.minimize()
    },
    maximize() {
      this.maximized = !this.maximized
      win.maximize()
    },
    unmaximize() {
      this.maximized = !this.maximized
      win.unmaximize()
    },
    close() {
      this.playlist = []
      this.videoSrc = null
      this.$refs.player.stop()
      ipcRenderer.send('closePlayer')
    },
  },
}
</script>


<style lang="less">
.video-player {
  border-radius: 0 !important;
  overflow: hidden !important;
  height: 100%;
  &-wrapper {
    height: 100%;
  }
  &-container {
    display: flex;
    height: calc(100% - 36px);
  }
  .v-card__title {
    padding: 0;
    padding-right: 108px !important;
    position: relative;
    z-index: 5;
    &:before {
      content: '';
      position: absolute;
      height: 100%;
      top: 3px;
      left: 15px;
      right: 80px;
      background-color: transparent;
      -webkit-app-region: drag;
      pointer-events: none;
    }
    &.maximized:before {
      top: 0;
    }
    .v-btn, .v-rating, .v-icon {
      -webkit-app-region: no-drag !important;
    }
  }
  .now-playing-title {
    font-size: 12px;
    overflow: hidden;
    max-width: calc(100vw - 350px);
    white-space: nowrap;
  }
}
.playlist-wrapper {
  min-width: 18vw;
  height: calc(100vh - 36px);
  box-shadow: none !important;
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
    font-weight: bold;
    line-height: 1;
    position: absolute;
    bottom: 5px;
    left: 5px;
    z-index: 1;
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
.markers-wrapper {
  min-width: 20vw;
  height: calc(100vh - 36px);
  border-left: 1px solid #5c5c5c;
  box-shadow: none !important;
  .v-tab {
    min-width: 30px;
    padding: 0;
  }
  .v-slide-group__prev,
  .v-slide-group__next {
    display: none !important;
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
  font-size: 11px;
  padding-top: calc(100vh - 36px) !important;
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
.vjs-tip {
  font-size: 12px;
  bottom: 18px;
}
.vjs-marker {
  &:before {
    font-family: "Material Design Icons";
    position: absolute;
    left: -200%;
    top: -120%;
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
.window-controls {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  .v-btn:not(.v-btn--round).v-size--small {
    min-width: 0;
  }
  .v-btn.close-app-btn:hover::before {
    opacity: 1;
  }
  .v-btn.close-app-btn .v-icon {
    color: #fff;
  }
  .v-btn.close-app-btn:hover .v-icon {
    color: #fff;
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

