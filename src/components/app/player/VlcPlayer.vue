<template>
  <div ref="player" class="vlc-player" :class="{fullscreen}"
    @mousedown="stopSmoothScroll($event)" @mousemove="moveOverPlayer">
    <div class="player-wrapper" :class="{markers:isMarkersVisible, playlist:isPlaylistVisible}">
      <div class="canvas-wrapper" @click="paused ? play() : pause()" 
        @dblclick="toggleFullscreen" @click.middle="toggleFullscreen" 
        @mousedown="handleMouseCanvas($event)" @contextmenu="showContextMenu($event)"
        @wheel="changeVolume" @keydown="handleKey" tabindex="-1">
        <video ref="videoPlayer" class="video-player"></video>
        <div v-if="isVideoFormatNotSupported" class="video-error">
          <v-icon size="60" color="red">mdi-alert</v-icon>
          <div>{{getFileFromPath(videos[playIndex].path)}}</div>
          <div class="mb-4">Video format not supported.</div>
          <v-btn @click="playVideoInSystemPlayer" color="primary" small>
            <v-icon left>mdi-television-play</v-icon>
            <span>Play in the system player</span>
          </v-btn>
        </div>
        <div v-if="demo && playIndex>3" class="demo-block">
          <div class="ma-4 title">demo mode</div>
          <div class="caption">limited number of videos</div>
        </div>
        <div v-if="isVideoNotExist" class="video-error">
          <v-icon size="60" color="red">mdi-alert</v-icon>
          <div>{{getFileFromPath(videos[playIndex].path)}}</div>
          <div class="mb-4">The video file is missing.</div>
        </div>
        <div class="status-text">{{statusText}}</div>
      </div>
      <v-card class="vlc-controls" tile 
        @mouseenter="mouseOverControls = true" @mouseleave="mouseOverControls = false"
        :style="{opacity:fullscreen&&hideControls&&!mouseOverControls&&!paused?0:fullscreen?0.7:1}">
        <v-card-actions class="timeline py-1 px-0 mx-3">
          <v-slider @start="seek($event)" :value="currentTime" 
            @mousedown="handleMouseSeek($event)" 
            min="0" step="0.1" :max="duration" hide-details/>
          <div v-for="(marker,i) in markers" :key="i" class="marker"
            :style="{left: `${marker.time/duration*100}%`}"
            @mouseup="jumpTo(marker.time)">
            <div class="tooltip text-center">
              <v-img :src="getMarkerImgUrl(marker.id)" :aspect-ratio="16/9" class="thumb"/>
              <div>
                <v-icon v-if="marker.type.toLowerCase()=='tag'" small :color="getTagColor(marker.name)">mdi-tag</v-icon>
                <v-icon v-if="marker.type.toLowerCase()=='performer'" small>mdi-account</v-icon>
                <v-icon v-if="marker.type.toLowerCase()=='favorite'" small color="pink">mdi-heart</v-icon>
                <v-icon v-if="marker.type.toLowerCase()=='bookmark'" small color="red">mdi-bookmark</v-icon>
                {{marker.name}}
              </div>
              <div>{{msToTime(marker.time*1000)}}</div>
            </div>
          </div>
        </v-card-actions>
        <v-card-actions class="pa-1">
          <v-btn-toggle class="remove-active">
            <v-btn @click="paused ? play() : pause()" small class="ml-1">
              <v-icon v-if="paused">mdi-play</v-icon>
              <v-icon v-else>mdi-pause</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="mx-2 remove-active">
            <v-btn @click="prev" small :disabled="isPrevDisabled">
              <v-icon>mdi-skip-previous</v-icon>
            </v-btn>
            <v-btn @click="stop" small>
              <v-icon>mdi-stop</v-icon>
            </v-btn>
            <v-btn @click="next" small :disabled="isNextDisabled">
              <v-icon>mdi-skip-next</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="remove-active">
            <v-btn v-if="!controlsList.includes('nofullscreen')" @click="toggleFullscreen" small>
              <v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
              <v-icon v-else>mdi-fullscreen</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="mx-2 remove-active marker-buttons">
            <v-btn @click="toggleMarkers" :color="isMarkersVisible? 'primary':''" small>
              <v-icon>mdi-map-marker</v-icon>
            </v-btn>
            <v-btn @click="jumpToPrevMarker" small class="marker-prev">
              <v-icon>mdi-map-marker-left</v-icon>
            </v-btn>
            <v-btn @click="jumpToNextMarker" small class="marker-next">
              <v-icon>mdi-map-marker-right</v-icon>
            </v-btn>
            <v-menu offset-y nudge-top="40" nudge-right="282" attach=".vlc-controls">
              <template v-slot:activator="{ on, attrs }">
                <v-btn v-bind="attrs" v-on="on" small>
                  <v-icon>mdi-map-marker-plus</v-icon>
                </v-btn>
              </template>
              
              <v-btn-toggle class="remove-active">
                <v-btn @click="openDialogMarkerTag">
                  <v-icon size="20">mdi-tag</v-icon>
                </v-btn>
                <v-btn>
                  <v-icon @click="openDialogMarkerPerformer" size="20">mdi-account</v-icon> 
                </v-btn>
                <v-btn @click="addMarker('favorite')">
                  <v-icon size="20">mdi-heart</v-icon> 
                </v-btn>
                <v-btn @click="openDialogMarkerBookmark">
                  <v-icon size="20">mdi-bookmark</v-icon> 
                </v-btn>
              </v-btn-toggle>
            </v-menu>
          </v-btn-toggle>
          <v-btn-toggle class="remove-active">
            <v-btn @click="togglePlaylist" :color="isPlaylistVisible? 'primary':''" small>
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn-toggle class="mx-2 remove-active">
              <v-btn @click="setAsThumb" v-on="on" small>
                <v-icon>mdi-image</v-icon>
              </v-btn>
            </v-btn-toggle>
          </template>
          <span>Set Frame as Thumb</span>
        </v-tooltip>
          <v-spacer></v-spacer>
          <div class="duration mx-2">
            <div class="time-start">{{ msToTime(currentTime * 1000) }}</div>
            <span class="mx-1">/</span>
            <div class="time-end">{{ msToTime(duration * 1000) }}</div>
          </div>
          <v-slider v-model="volume" value="1" min="0" step="0.1" max="1" hide-details 
            :prepend-icon="volumeIcon" @click:prepend="toggleMute" class="volume"/>
        </v-card-actions>
      </v-card>
    </div>

    <v-card v-show="isMarkersVisible" class="markers-wrapper" outlined tile>
      <v-card-actions class="pa-1">
        <v-icon left>mdi-map-marker</v-icon>
        <span>Markers</span> 
        <v-spacer></v-spacer>
        <v-btn @click="isMarkersVisible=false" icon>
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>
      <v-card-actions class="pa-0">
        <v-btn-toggle v-model="markersType" tile dense mandatory multiple color="primary" class="toggle">
          <v-btn value="tag">
            <v-icon>mdi-tag</v-icon>
          </v-btn>
          <v-btn value="performer">
            <v-icon>mdi-account</v-icon>
          </v-btn>
          <v-btn value="favorite">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
          <v-btn value="bookmark">
            <v-icon>mdi-bookmark</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-card-actions>
      <vuescroll class="items">
        <v-card-text class="pa-0">
          <div v-if="markers.length">
            <div v-for="marker in markers" :key="marker.id">
              <div @click="jumpTo(marker.time)" v-if="(markersType.includes(marker.type.toLowerCase()))" class="marker">
                <v-img :src="getMarkerImgUrl(marker.id)" :aspect-ratio="16/9" class="thumb" :gradient="markerGradient">
                  <span class="time">{{msToTime(marker.time*1000)}}</span>
                  <div class="name">
                    <v-icon v-if="marker.type.toLowerCase()=='tag'" left small :color="getTagColor(marker.name)">mdi-tag</v-icon>
                    <v-icon v-if="marker.type.toLowerCase()=='performer'" left small>mdi-account</v-icon>
                    <v-icon v-if="marker.type.toLowerCase()=='favorite'" left small color="pink">mdi-heart</v-icon>
                    <v-icon v-if="marker.type.toLowerCase()=='bookmark'" left small color="red">mdi-bookmark</v-icon>
                    <span>{{marker.name}}</span>
                  </div>
                  <v-btn @click="openDialogRemoveMarker(marker)" height="25" width="25" outlined icon color="red" class="delete">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-img>
              </div>
            </div>
          </div>
          <div v-else class="text-center pt-6">
            <span>No markers</span><br>
            <v-icon size="60">mdi-close</v-icon>
          </div>
        </v-card-text>
      </vuescroll>
    </v-card>
    <v-card v-show="isPlaylistVisible" class="playlist-wrapper" outlined tile>
      <v-card-actions class="pa-1">
        <v-icon left>mdi-format-list-bulleted</v-icon>
        <span>Playlist</span> 
        <v-spacer></v-spacer>
        <v-btn @click="isPlaylistVisible=false" icon>
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>
      <v-card-actions class="pa-0">
        <v-btn-toggle v-model="playlistMode" tile dense multiple color="primary" class="toggle">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn value="loop" v-on="on">
                <v-icon>mdi-sync</v-icon>
              </v-btn>
            </template>
            <span>Loop</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn value="autoplay" v-on="on">
                <v-icon>mdi-play-pause</v-icon>
              </v-btn>
            </template>
            <span>Autoplay</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn value="shuffle" v-on="on">
                <v-icon>mdi-shuffle-variant</v-icon>
              </v-btn>
            </template>
            <span>Shuffle</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-card-actions>
      <vuescroll ref="playlist" class="items">
        <v-card-text class="pa-0">
          <v-list dense class="pa-0">
            <v-list-item-group v-model="playIndex" mandatory color="primary">
              <v-list-item v-for="(video, i) in videos" :key="video.id" :ref="`videoItem${i}`"
                @click="playItemFromPlaylist(i)" class="video-item">
                <img :src="getPlaylistImgUrl(video.id)" class="thumb"/>
                <span class="video-name">
                  <b>{{i+1}}.</b>
                  <span class="path">{{getFileNameFromPath(video.path)}}</span>
                </span>
                <span v-if="playIndex===i" class="play-state overline text--primary">
                  <v-icon class="pl-2 pr-1">mdi-play</v-icon>
                  <span class="pr-4 text">Now playing</span>
                </span>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card-text>
      </vuescroll>
    </v-card>


    <v-dialog v-model="dialogMarkerTag" max-width="500" scrollable eager>
      <v-card>
        <v-card-title class="headline">
          Marker with tag on {{msToTime(seekTime*1000)}}
          <v-spacer></v-spacer>
          <v-btn @click="dialogMarkerTag=false" icon>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="pb-0">
            <v-autocomplete
              v-model="markerTag" outlined clearable hide-details
              :items="tagsAll" label="Tag" placeholder="Choose a tag for the marker"
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
                  :color="getTagColor(data.item.name)" 
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
            <v-icon left>mdi-plus</v-icon> Add marker
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogMarkerPerformer" max-width="500" scrollable eager>
      <v-card>
        <v-card-title class="headline">
          Marker with performer on {{msToTime(seekTime*1000)}}
          <v-spacer></v-spacer>
          <v-btn @click="dialogMarkerPerformer=false" icon>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="pb-0">
            <v-autocomplete
              v-model="markerPerformer" outlined clearable hide-details
              :items="performersAll" label="Performer" placeholder="Choose a performer for the marker"
              item-text="name" class="hidden-close"
              item-value="name" no-data-text="No more performers"
              :menu-props="{contentClass:'list-with-preview'}"
              :filter="filterItemsPerformers"
            >
              <template v-slot:selection="data">
                <v-chip
                  v-bind="data.attrs" :input-value="data.selected" 
                  @click="data.select" text-color="white" 
                  @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                  @mouseleave.stop="$store.state.hoveredImage=false"
                > <span>{{ data.item.name }}</span>
                </v-chip>
              </template>
              <template v-slot:item="data">
                <div class="list-item"
                  @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                  @mouseleave.stop="$store.state.hoveredImage=false"> 
                  <v-icon left size="14" :color="data.item.favorite==false?'grey':'pink'">mdi-heart</v-icon>
                  <v-rating v-model="data.item.rating" class="rating-inline small mr-2"
                    color="yellow darken-3" background-color="grey darken-1"
                    empty-icon="$ratingFull" half-icon="mdi-star-half-full"
                    dense half-increments readonly size="12"/>
                  <span>{{data.item.name}}</span>
                  <span v-if="data.item.aliases.length" class="aliases"> 
                    aka {{data.item.aliases.join(', ').slice(0,50)}}
                  </span>
                </div>
              </template>
            </v-autocomplete>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="addMarker('performer')" :disabled="!markerPerformer" class="ma-4" color="primary">
            <v-icon left>mdi-plus</v-icon> Add marker
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogMarkerBookmark" max-width="550" scrollable eager>
      <v-card>
        <v-card-title class="headline">
          Marker with bookmark on {{msToTime(seekTime*1000)}}
          <v-spacer></v-spacer>
          <v-btn @click="dialogMarkerBookmark=false" icon>
            <v-icon>mdi-close</v-icon>
          </v-btn>
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
            <v-icon left>mdi-plus</v-icon> Add marker
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
        <v-card-text class="text-center" v-if="markerForRemove.time">
          <div @click="jumpTo(markerForRemove.time)">
            <v-chip outlined class="my-2">
              <v-icon v-if="markerForRemove.type.toLowerCase()=='tag'" small :color="getTagColor(markerForRemove.name)">mdi-tag</v-icon>
              <v-icon v-if="markerForRemove.type.toLowerCase()=='performer'" small>mdi-account</v-icon>
              <v-icon v-if="markerForRemove.type.toLowerCase()=='favorite'" small color="pink">mdi-heart</v-icon>
              <v-icon v-if="markerForRemove.type.toLowerCase()=='bookmark'" small color="red">mdi-bookmark</v-icon>
              <span class="ml-2">{{markerForRemove.name}}</span>
            </v-chip> 
            <v-img :src="getMarkerImgUrl(markerForRemove.id)" :aspect-ratio="16/9" class="thumb"/>
            <div class="mt-2">
              <span class="mr-2">at time</span> 
              <v-chip outlined label>
                <b>{{msToTime(markerForRemove.time*1000)}}</b>
              </v-chip>
            </div>
          </div>
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
    
    <v-menu v-model="menu" :position-x="$store.state.x" leave-absolute
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item class="pr-1" link @mouseup="pause">
          <v-list-item-title>
            <v-icon left size="18">mdi-pause</v-icon> Pause
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="play">
          <v-list-item-title>
            <v-icon left size="18">mdi-play</v-icon> Play
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="stop">
          <v-list-item-title>
            <v-icon left size="18">mdi-stop</v-icon> Stop
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="increaseVolume">
          <v-list-item-title>
            <v-icon left size="18">mdi-volume-plus</v-icon> Increase Volume
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="decreaseVolume">
          <v-list-item-title>
            <v-icon left size="18">mdi-volume-minus</v-icon> Decrease Volume
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>


<script>
const { ipcRenderer } = require('electron')
const fs = require("fs")
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const shortid = require('shortid')
const shell = require('electron').shell

// import { chimera } from './webchimera/wrapper'
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'

export default {
  name: "VlcPlayer",
  components: {
    vuescroll,
  },
  mixins: [ShowImageFunction, LabelFunctions],
  beforeDestroy() {
    document.removeEventListener("mousemove", this.controlsMove)
    document.removeEventListener("mouseup", this.controlsUp)
    window.removeEventListener('resize', this.getCanvasSizes)
  },
  async mounted() {
    this.initPlayer()

    document.addEventListener("mousemove", this.controlsMove, false)
    document.addEventListener("mouseup", this.controlsUp, false)

    ipcRenderer.on('getDataForPlayer', (event, data) => {
      this.updateVideoPlayer(data)
    })
    ipcRenderer.on('closePlayer', () => {
      this.player.stop()
    })
    ipcRenderer.on('updateDb', async (event, dbType) => {
      await this.$store.dispatch('getDb', dbType)
      if (dbType == 'tags') setTimeout(() => {this.getMarkers()}, 1000)
    })
    window.addEventListener('resize', this.getCanvasSizes)
    
    // include ffmpeg
    ffmpeg.setFfmpegPath(path.join(this.pathToUserData, '/ffmpeg/ffmpeg.exe')) 
    ffmpeg.setFfprobePath(path.join(this.pathToUserData, '/ffmpeg/ffprobe.exe'))
  },
  data: () => ({
    canvasSizes: '',
    menu: false,
    player: null,
    interval: null,
    moveTimeout: -1,
    hideControls: false,
    mouseOverControls: false,
    statusText: '',
    statusTextTimeout: null,
    demo: false,
    // Video element properties //
    duration: 1,
    volume: 1,
    muted: false,
    paused: false,
    currentTime: 0,
    currentTimeTracker: null,
    controlsList: [],
    crossOrigin: "",
    defaultMuted: false,
    isVideoFormatNotSupported: null,
    isVideoNotExist: null,
    seeking: false,
    srcObject: null,
    seekTime: 0,
    // Playlist
    isPlaylistVisible: false,
    selectedPlaylist: null,
    videos: [],
    playlist: [],
    playlistShuffle: [],
    playIndex: null,
    playlistMode: ['autoplay'],
    // Markers
    isMarkersVisible: false,
    markers: [],
    markerTag: '',
    markerPerformer: '',
    markerBookmarkText: '',
    dialogMarkerTag: false,
    dialogMarkerPerformer: false,
    dialogMarkerBookmark: false,
    dialogRemoveMarker: false,
    dialogAddToPlaylist: false,
    markerForRemove: {},
    markersType: ['tag','performer','favorite','bookmark'],
  }),
  computed: {
    fullscreen: {
      get() {
        return this.$store.state.fullscreen
      },
      set(value) {
        this.$store.state.fullscreen = value
      },
    },
    currentSrc() {
      return this.src;
    },
    volumeIcon() {
      if (this.muted) {
        return 'mdi-volume-mute'
      }
      if (this.volume > 0.7) {
        return 'mdi-volume-high'
      }
      if (this.volume > 0.3) {
        return 'mdi-volume-medium'
      }
      return 'mdi-volume-low'
    },
    // data from main window
    tagsAll() {
      if (this.tagsDb === null) return []
      let tags = _.filter(this.tagsDb, t=>(t.type.includes('video')))
      return _.orderBy(tags, 'name', ['asc'])
    },
    performersAll() {
      if (this.performersDb === null) return []
      return this.performersDb
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    videosDb() {
      return this.$store.state.videosDb
    },
    performersDb() {
      return this.$store.state.performersDb
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
    markerGradient() {
      if (this.$vuetify.theme.dark) return 'to bottom, rgba(0, 0, 0, 0.5), transparent'
      else return 'to bottom, rgba(255, 255, 255, 0.5), transparent'
    },
    isPrevDisabled() {
      if (this.playlistMode.includes('shuffle')) {
        let shuffleIndex = this.playlistShuffle.indexOf(this.playIndex)
        return shuffleIndex==0 && !this.playlistMode.includes('loop')
      } else return this.playIndex==0 && !this.playlistMode.includes('loop')
    },
    isNextDisabled() {
      if (this.playlistMode.includes('shuffle')) {
        let shuffleIndex = this.playlistShuffle.indexOf(this.playIndex)
        return shuffleIndex+1>=this.videos.length && !this.playlistMode.includes('loop')
      } else return this.playIndex+1>=this.videos.length && !this.playlistMode.includes('loop')
    },
  },
  methods: {
    initPlayer() {
      this.player = this.$refs.videoPlayer
      this.player.addEventListener('loadedmetadata', (event) => {
        this.loadSrc()
        console.log('loadedmetadata')
      })
      this.player.addEventListener('ended', (event) => {
        if (this.playlistMode.includes('autoplay')) {
          this.next()
        }
        console.log('ended')
      })
      this.player.addEventListener('error', (event) => {
        this.$emit("nowPlaying", _.cloneDeep(this.videos[this.playIndex]))
        if (fs.existsSync(this.videos[this.playIndex].path)) {
          this.isVideoFormatNotSupported = true
          this.isVideoNotExist = false
        } else {
          this.isVideoFormatNotSupported = false
          this.isVideoNotExist = true
        }
      })
    },
    getCanvasSizes() {
      let windowWidth = document.documentElement.clientWidth
      let windowHeight = document.documentElement.clientHeight
      if (this.$refs.canvas) {
        let canvasRatio = this.$refs.canvas.width / this.$refs.canvas.height
        let heightOffset = this.fullscreen ? 0 : 114
        let widthOffset = (this.isMarkersVisible ? (windowWidth/100*18) : 0) + (this.isPlaylistVisible ? (windowWidth/100*18) : 0)
        let windowRatio = (windowWidth - widthOffset) / (windowHeight - heightOffset)
        this.canvasSizes = canvasRatio > windowRatio ? '':'width:auto;height:100%;'
      } else this.canvasSizes = ''
    },
    updateVideoPlayer(data) {
      // console.log('update video player')
      // console.log(data)
      this.videos = data.videos
      this.playIndex = _.findIndex(data.videos, {id: data.id})
      
      this.player.src = path.join('file://', this.videos[this.playIndex].path)
      this.player.play()
    }, 
    loadSrc() {
      clearTimeout(this.statusTextTimeout)
      this.statusText = `${this.playIndex+1}. ${this.getFileNameFromPath(this.videos[this.playIndex].path)}`
      this.statusTextTimeout = setTimeout(() => {this.statusText = ''}, 3000)
      this.$emit("nowPlaying", _.cloneDeep(this.videos[this.playIndex]))
      this.isVideoFormatNotSupported = false
      this.isVideoNotExist = false
      this.duration = this.player.duration
      this.trackCurrentTime()
      this.getMarkers()
      if (this.demo && this.playIndex>3) {
        this.player.src = ''
      }
    },
    moveOverPlayer(e) {
      if (e.movementX > 0 || e.movementY > 0) {
        this.hideControls = false;
        clearTimeout(this.moveTimeout);
        this.moveTimeout = setTimeout(() => {
          this.hideControls = true;
        }, 1000);
      }
    },
    msToTime(ms, keepMs = false) {
      if (isNaN(ms)) return `00:00` + keepMs ? ".00" : "";
      let hms = new Date(ms)
        .toISOString()
        .substr(11, keepMs ? 11 : 8)
        .replace(/^0+/, "");
      hms = hms.startsWith(":") ? hms.substr(1) : hms;
      return hms.startsWith("00") ? hms.substr(1) : hms;
    },
    loadPlaylist() {
      return
      this.currentTime = 0
      this.error = null

      if (this.playlist !== [] && this.playlist !== null) {
        let playlist = this.playlist
        this.player.playlist.clear()
        for (let i=0; i<playlist.length; i++) {
          this.player.playlist.add(playlist[i])
        }
        this.player.playlist.playItem(this.playIndex)
        this.videos.length = this.player.playlist.items.length
        this.$emit("nowPlaying", this.player.playlist.items[this.playIndex])
      
        if (this.playlistMode.includes('shuffle')) {
          let index = []
          for (let i = 0; i < this.videos.length; i++) {
            index.push(i)
          }
          this.playlistShuffle = _.shuffle(index)
        }
      }
      
      this.$emit("loadstart");
    },
    toggleFullscreen() {
      this.$emit("toggleFullscreen")
      setTimeout(() => {
        this.getCanvasSizes()
      }, 100)
      setTimeout(() => {
        this.getCanvasSizes()
      }, 500)
      setTimeout(() => {
        this.getCanvasSizes()
      }, 1000)
    },
    iconUrl(icon) {
      return `https://fonts.gstatic.com/s/i/materialicons/${icon}/v6/24px.svg?download=true`;
    },
    setAsThumb() {
      let video = this.videos[this.playIndex]
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${video.id}.jpg`)
      let specificTime = new Date(this.currentTime*1000).toISOString().substr(11, 8)
      this.createMarkerThumb(specificTime, video.path, imgPath, 320)
        .then(result => {
          console.log('thumb created')
        })
        .catch(error => {
          console.log(error)
        })
    },
    trackCurrentTime() {
      let timeout = 100
      if (this.duration > 200) timeout = 1000
      this.currentTimeTracker = setInterval(() => {
        this.currentTime = this.player.currentTime
      }, timeout)
    },
    playVideoInSystemPlayer() {
      shell.openPath(this.videos[this.playIndex].path)
    },
    // CONTROLS
    play() {
      this.player.play()
      this.paused = false
      this.trackCurrentTime()
    },
    pause() {
      this.player.pause()
      this.paused = true
      clearInterval(this.currentTimeTracker)
    },
    stop() {
      this.player.pause()
      this.player.currentTime = 0
      this.paused = true
      clearInterval(this.currentTimeTracker)
    },
    prev() {
      if (this.isPrevDisabled) return
      let isLoopMode = this.playlistMode.includes('loop')

      if (this.playlistMode.includes('shuffle')) {
        let shuffleIndex = this.playlistShuffle.indexOf(this.playIndex)
        shuffleIndex = shuffleIndex - 1
        if (isLoopMode && shuffleIndex < 0) { // if loop mode
          shuffleIndex = shuffleIndex = this.videos.length-1
        } 
        this.playIndex = this.playlistShuffle[shuffleIndex]
      } else {
        this.playIndex = this.playIndex - 1
        if (isLoopMode && this.playIndex < 0) this.playIndex = this.videos.length-1 // if loop
      }
      this.player.src = path.join('file://', this.videos[this.playIndex].path)
      this.player.play()
      
      if (this.isPlaylistVisible) { // scroll to now playing in playlist
        const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
        this.$refs.playlist.scrollTo({ y: height }, 50)
      }
    },
    next() {
      if (this.isNextDisabled) return
      let isLoopMode = this.playlistMode.includes('loop')

      if (this.playlistMode.includes('shuffle')) {
        let shuffleIndex = this.playlistShuffle.indexOf(this.playIndex)
        shuffleIndex = shuffleIndex + 1
        if (isLoopMode && shuffleIndex == this.videos.length) shuffleIndex = 0 // if loop mode
        this.playIndex = this.playlistShuffle[shuffleIndex]
      } else {
        this.playIndex = this.playIndex + 1
        if (isLoopMode && this.playIndex > this.videos.length-1) this.playIndex = 0 // if loop mode
      }
      this.player.src = path.join('file://', this.videos[this.playIndex].path)
      this.player.play()

      if (this.isPlaylistVisible) { // scroll to now playing in playlist
        const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
        this.$refs.playlist.scrollTo({ y: height }, 50)
      }
    },
    seek(e) {
      console.log(e)
      this.player.currentTime = e
      this.currentTime = e
    },
    jumpTo(e) {
      this.player.currentTime = e
      this.currentTime = e
    },
    jumpToPrevMarker() {
      let markers = _.orderBy(this.markers, 'time', ['desc'])
      let currentTime = this.player.currentTime - 5
      for (let i=0; i<markers.length; i++) {
        let markerTime = markers[i].time
        if (markerTime < currentTime) {
          this.player.currentTime = markerTime
          break
        }
      }
    },
    jumpToNextMarker() {
      let markers = this.markers
      let currentTime = this.player.currentTime
      for (let i=0; i<markers.length; i++) {
        let markerTime = markers[i].time
        if (markerTime > currentTime) {
          this.player.currentTime = markerTime
          break
        }
      }
    },
    showContextMenu(e) {
      e.preventDefault()
      this.menu = true
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
    },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    toggleMute() {
      this.player.muted = !this.player.muted
      this.muted = this.player.muted
    },
    increaseVolume() {
      if (this.player.volume >= 1) return
      this.player.volume += 0.1
      this.volume = this.player.volume
    },
    decreaseVolume() {
      if (this.player.volume == 0) return
      this.player.volume -= 0.1
      this.volume = this.player.volume
    },
    changeVolume(e) {
      if (e.deltaY>0) {
        if (this.player.volume == 0) return
      } else {
        if (this.player.volume >= 1) return
      }
      this.player.volume = (this.player.volume - e.deltaY / 1000).toFixed(1)
      this.volume = this.player.volume
    },
    handleKey(e) {
      switch (true) {
        case e.key === ' ': this.player.togglePause()
          break
        case e.key === 'ArrowRight': this.player.currentTime += 10
          break
        case e.key === 'ArrowLeft': this.player.currentTime -= 10
          break
        case e.key === 'ArrowUp': this.changeVolume({deltaY:-100})
          break
        case e.key === 'ArrowDown': this.changeVolume({deltaY:+100})
          break
        case e.key === 'f': this.toggleFullscreen()
          break
        case e.key === 'p': this.togglePlaylist()
          break
        case e.key === 'm': this.toggleMarkers()
          break
        case e.key === ',': this.jumpToPrevMarker()
          break
        case e.key === '.': this.jumpToNextMarker()
          break
        case e.key === 'z': this.prev()
          break
        case e.key === 'c': this.next()
          break
        case e.key === 'x': this.stop()
          break
        case e.key === '1': this.openDialogMarkerTag()
          break
        case e.key === '2': this.openDialogMarkerPerformer()
          break
        case e.key === '3': this.addMarker('favorite')
          break
        case e.key === '4': this.openDialogMarkerBookmark()
          break
      }
    },
    handleMouseCanvas(e) {
      let btnCode = e.button
      switch (btnCode) {
        case 3: this.prev()
        break
        case 4: this.next()
        break
      }
    },
    handleMouseSeek(e) {
      let btnCode = e.button
      switch (btnCode) {
        // case 0: // clearInterval(this.currentTimeTracker)
        //   break
        // case 1: // clearInterval(this.currentTimeTracker)
        //   break
        // case 2: // clearInterval(this.currentTimeTracker)
        //   break
        case 3: this.jumpToPrevMarker()
          break
        case 4: this.jumpToNextMarker()
          break
      }
    },
    // MARKERS
    toggleMarkers() {
      this.isMarkersVisible=!this.isMarkersVisible
      setTimeout(() => {
        this.getCanvasSizes()
      }, 100)
    },
    async getMarkers() {
      // console.log('get markers')
      await this.$store.dispatch('getDb', 'markers')
      let video = this.videos[this.playIndex]
      let markers = _.filter(this.markersDb, marker=>marker.videoId == video.id)
      this.markers = _.orderBy(markers, 'time', ['asc'])
      // create marker thumb
      for (let i=0; i<markers.length; i++) {
        let imgPath = path.join(this.pathToUserData, `/media/markers/${markers[i].id}.jpg`)
        if (fs.existsSync(imgPath)) continue
        let specificTime = new Date(1000*markers[i].time).toISOString().substr(11, 8)
        this.createMarkerThumb(specificTime, video.path, imgPath, 180)
          .then(result => {
            console.log('thumb created')
          })
          .catch(error => {
            console.log(error)
          })
      }
    },
    createMarkerThumb(timestamp, inputPath, outputPath, width) {
      return new Promise((resolve, reject) => {
        ffmpeg()
          .addOption('-ss', timestamp)
          .addOption('-i', inputPath)
          .addOption('-frames:v', '1')
          .addOption('-vf',`scale=-1:${width}`)
          .save(outputPath)
          .on('end', function(e) {
            resolve(e)
          })
          .on('error', function(e) {
            reject(e)
          })
      })
    },
    getMarkerImgUrl(markerId) {
      let imgPath = path.join(this.pathToUserData, `/media/markers/${markerId}.jpg`)
      return 'file://' + this.checkMarkerImageExist(imgPath)
    },
    checkMarkerImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    getTag(tagName) {
      return _.find(this.tagsDb, {name:tagName})
    },
    getTagColor(tagName) {
      let tag = _.find(this.tagsDb, {name:tagName})
      if (tag) return tag.color 
      else return ''
    },
    openDialogMarkerTag() {
      this.dialogMarkerTag = true
      this.seekTime = this.player.currentTime
    },
    openDialogMarkerPerformer() {
      this.dialogMarkerPerformer = true
      this.seekTime = this.player.currentTime
    },
    openDialogMarkerBookmark() {
      this.dialogMarkerBookmark = true
      this.seekTime = this.player.currentTime
    },
    addMarker(type) { 
      let text = ''
      let time = Math.floor(this.seekTime)
      if (type === 'tag') {
        text = this.markerTag
        this.dialogMarkerTag = false
      }
      if (type === 'performer') {
        text = this.markerPerformer
        this.dialogMarkerPerformer = false
      }
      if (type === 'favorite') {}
      if (type === 'bookmark') {
        text = this.markerBookmarkText
        this.dialogMarkerBookmark = false
      }
    
      let videoId = _.cloneDeep(this.videos[this.playIndex].id)
      const marker = {
        id: shortid.generate(),
        videoId: videoId,
        type: type,
        name: text,
        time: time,
      } 

      ipcRenderer.send('addMarker', marker, videoId)

      this.markerTag = ''
      this.markerBookmarkText = ''
      this.getMarkers()
    },
    openDialogRemoveMarker(marker) {
      this.dialogRemoveMarker = true
      this.markerForRemove = marker
    },
    removeMarker() {
      let video = _.cloneDeep(this.videos[this.playIndex])
      ipcRenderer.send('removeMarker', this.markerForRemove, video)
      this.markerForRemove = {}
      this.dialogRemoveMarker = false
      this.getMarkers()
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
    filterItemsPerformers(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const aliases = item.aliases
      let found = false
      for (let i=0;i<aliases.length;i++) {
        if (aliases[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    // PLAYLIST
    playItemFromPlaylist(index) {
      // console.log(this.player.playlist.items.map(i=>i.mrl))
      
      if (this.playlistMode.includes('shuffle')) {
        let indices = []
        for (let i = 0; i < this.videos.length; i++) {
          indices.push(i)
        }
        this.playlistShuffle = _.shuffle(indices)
        const i = this.playlistShuffle.indexOf(index)
        this.playlistShuffle.splice(i, 1)
        this.playlistShuffle.unshift(index)
        this.player.playlist.playItem(index)

        if (this.isPlaylistVisible) { // scroll to now playing in playlist
          const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
          this.$refs.playlist.scrollTo({ y: height }, 50)
        }
      } else this.player.src = this.videos[index].path
      this.player.play()
    },
    togglePlaylist() {
      this.isPlaylistVisible=!this.isPlaylistVisible
      setTimeout(() => {
        this.getCanvasSizes()
      }, 100)
      if (!this.isPlaylistVisible) return
      const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
      this.$refs.playlist.scrollTo({ y: height }, 50)
    },
    getPlaylistImgUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return 'file://' + this.checkPlaylistImageExist(imgPath)
    },
    checkPlaylistImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        this.errorThumb = true
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    getFileNameFromPath(videoPath) {
      return path.parse(videoPath).name
    },
    getFileFromPath(videoPath) {
      return path.basename(videoPath)
    },
  },
  watch: {
    volume(newValue, oldValue) {
      if (newValue !== oldValue) this.player.volume = newValue
    },
    // playlist() {
    //   this.loadPlaylist()
    // },
    playIndex() {
      this.getMarkers()
    },
    playlistMode(mode, oldMode) {
      if (mode.includes('shuffle') && !oldMode.includes('shuffle')) {
        let index = []
        for (let i = 0; i < this.videos.length; i++) {
          index.push(i)
        }
        this.playlistShuffle = _.shuffle(index)
        this.playIndex = this.playlistShuffle[0]
        this.player.src = path.join('file://', this.videos[this.playIndex].path)

        if (this.isPlaylistVisible) { // scroll to now playing in playlist
          const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
          this.$refs.playlist.scrollTo({ y: height }, 50)
        }
      }
    },
  },
};
</script>


<style lang="less">
.vlc-player {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  &.fullscreen {
    .vlc-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 80%;
      min-width: 800px;
      border-radius: 5px 5px 0 0 !important;
      margin: auto;
    }
    .canvas-wrapper {
      max-height: 100%;
    }
    .markers-wrapper,
    .playlist-wrapper {
      .items {
        height: calc(100vh - 80px) !important;
      }
    }
  }
  .player-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    &.markers {
      width: calc(100% - 18vw);
    }
    &.playlist {
      width: calc(100% - 18vw);
    }
    &.markers.playlist {
      width: calc(100% - 36vw);
    }
  }
  .remove-active {
    .v-btn {
      opacity: 0.8 !important;
    }
    .v-btn--active:before {
      opacity: 0 !important;
    }
  }
  .canvas-wrapper {
    width: 100%;
    height: 100%;
    max-height: calc(100vh - 34px - 80px);
    display: flex;
    place-items: center;
    justify-content: center;
    background-color: #000;
  }
  .canvas {
    background: #fff;
    width: 100%;
    height: auto;
  }
  .demo-block {
    position: absolute;
    right: 5px;
    top: 5px;
    z-index: 3;
    background-color: hsla(335, 100%, 50%, 0.7);
    text-transform: uppercase;
    text-align: center;
    padding: 5px;
  }
}
.video-error {
  position: absolute;
  color: rgb(255, 50, 50);
  margin: auto;
  left: calc(50% - 150px);
  top: 30%;
  width: 300px;
  text-align: center;
}
.vlc-controls {
  position: relative;
  .timeline {
    position: relative;
    &:hover {
      .marker {
        width: 2vw;
        height: 10px;
        transform: translateX(-1vw) translateY(-15px);
        border-radius: 0 0 2px 2px;
      }
    }
    .v-slider {
      margin: 0;
    }
    .marker {
      cursor: pointer;
      position: absolute;
      width: 3px;
      height: 10px;
      background-color: #777;
      transition: .2s all ease;
      &:hover {
        .tooltip {
          display: block;
        }
      }
    }
    .tooltip {
      position: absolute;
      bottom: 10px;
      width: 10vw;
      left: -4vw;
      display: none;
      background-color: rgba(10, 10, 10, 0.75);
      border-radius: 2px 2px 0 0;
      font-size: 12px;
    }
  }
  .duration {
    display: flex;
  }
  .volume {
    max-width: 100px;
    .v-input__prepend-outer {
      margin-right: 0;
    }
  }
  // .hoverable {
  //   &:hover {
  //     .hidden {
  //       width: 50px !important;
  //       border-width: 1px !important;
  //       .v-btn__content {
  //         display: flex;
  //       }
  //     }
  //   }
  // }
  // .hidden {
  //   min-width: 0 !important;
  //   width: 0 !important;
  //   padding: 0 !important;
  //   transition: .3s;
  //   border-width: 0 !important;
  //   .v-btn__content {
  //     display: none;
  //   }
  // }
}
.playlist-wrapper {
  min-width: 18vw;
  box-shadow: none !important;
  .items {
    height: calc(100vh - 116px) !important;
  }
  .v-card__title {
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  .video-item {
    position: relative;
    overflow: hidden;
    height: 10vw;
  }
  .video-name {
    font-size: 1vw;
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
    .text {
      font-size: 1vw;
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
  .toggle {
    width: 100%;
    .v-btn {
      min-width: 30px;
      width: 33.33%;
      padding: 0;
    }
  }
}
.markers-wrapper {
  min-width: 18vw;
  border-left: 1px solid #5c5c5c;
  box-shadow: none !important;
  .items {
    height: calc(100vh - 116px) !important;
  }
  .v-card__title {
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  .marker {
    cursor: pointer;
    &:hover {
      .delete {
        opacity: 1;
      }
    }
    .thumb {
      width: 100%;
      background-color: rgb(38, 50, 61);
    }
    .name {
      position: absolute;
      font-size: 1vw;
      display: flex;
      align-items: center;
      left: 5px;
      top: 1px;
    }
    .time {
      position: absolute;
      bottom: 1px;
      right: 1px;
      line-height: 1;
      padding: 2px;
      border-radius: 2px;
      font-size: 1vw;
      background-color: rgba(17, 17, 17, 0.6);
    }
  }
  .toggle {
    width: 100%;
    .v-btn {
      min-width: 30px;
      width: 25%;
      padding: 0;
    }
  }
  .delete {
    opacity: 0;
    transition: .3s;
    position: absolute;
    left: 0;
    bottom: 0;
    border-radius: 0 5px 0 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
}
.theme--light {
  .vlc-controls {
    .timeline {
      .tooltip {
        background-color: rgba(255, 255, 255, 0.75);
      }
    }
  }
  .markers-wrapper {
    .marker {
      .time {
        background-color: rgba(236, 236, 236, 0.6);
      }
    }
  }
}
.status-text {
  position: absolute;
  top: 0;
  left: 0;
  padding: 0 5px;
  font-size: 1.5vw;
  color: white;
  background-color: rgba(0, 0, 0, 0.363);
}
@media (max-width: 920px) {
  .player-wrapper {
    &.markers {
      .marker-buttons {
        .marker-prev,
        .marker-next {
          display: none;
        }
      }
    }
  }
}
</style>