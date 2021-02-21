<template>
  <div ref="player" class="vlc-player" :class="{fullscreen}"
    @mousedown="stopSmoothScroll($event)" @mousemove="moveOverPlayer">
    <div class="player-wrapper">
      <div class="canvas-wrapper" @click="paused ? play() : pause()" 
        @dblclick="toggleFullscreen" @click.middle="toggleFullscreen" 
        @contextmenu="showContextMenu($event)"
        @keydown="handleKey" @wheel="changeVolume">
        <canvas ref="canvas" class="canvas" :style="canvasSizes"/>
      </div>
      <v-card class="vlc-controls" tile 
        @mouseenter="mouseOverControls = true" @mouseleave="mouseOverControls = false"
        :style="{opacity:fullscreen&&hideControls&&!mouseOverControls&&!paused?0:fullscreen?0.7:1}">
        <v-card-actions class="timeline py-1 px-0 mx-3">
          <v-slider @change="seek($event)" :value="currentTime"
            min="0" step="1" :max="duration" hide-details/>
          <div v-for="(marker,i) in markers" :key="i" class="marker"
            :style="{left: `${marker.time/duration*100}%`}"
            @mouseup="jumpTo(marker.time)">
            <div class="tooltip text-center">
              <v-img :src="getMarkerImgUrl(marker.id)" :aspect-ratio="16/9" class="thumb"/>
              <div>
                <v-icon v-if="marker.type.toLowerCase()=='tag'" small :color="getTag(marker.name).color">mdi-tag</v-icon>
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
            <v-btn @click="prev" small :disabled="playIndex==0">
              <v-icon>mdi-skip-previous</v-icon>
            </v-btn>
            <v-btn @click="stop" small>
              <v-icon>mdi-stop</v-icon>
            </v-btn>
            <v-btn @click="next" small :disabled="playIndex+1>=playlistLength">
              <v-icon>mdi-skip-next</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="remove-active">
            <v-btn v-if="!controlsList.includes('nofullscreen')" @click="toggleFullscreen" small>
              <v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
              <v-icon v-else>mdi-fullscreen</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="mx-2 remove-active">
            <v-btn @click="toggleMarkers" :color="isMarkersVisible? 'primary':''" small>
              <v-icon>mdi-map-marker</v-icon>
            </v-btn>
            <v-btn @click="jumpToPrevMarker" small>
              <v-icon>mdi-map-marker-left</v-icon>
            </v-btn>
            <v-btn @click="jumpToNextMarker" small>
              <v-icon>mdi-map-marker-right</v-icon>
            </v-btn>
            <v-menu offset-y nudge-top="20" nudge-right="282" attach=".vlc-controls">
              <template v-slot:activator="{ on, attrs }">
                <v-btn v-bind="attrs" v-on="on" small>
                  <v-icon>mdi-map-marker-plus</v-icon>
                </v-btn>
              </template>
              
              <v-btn-toggle class="remove-active" dense>
                <v-btn @click="openDialogMarkerTag" small>
                  <v-icon size="20">mdi-tag</v-icon> 
                </v-btn>
                <v-btn small>
                  <v-icon @click="openDialogMarkerPerformer" size="20">mdi-account</v-icon> 
                </v-btn>
                <v-btn @click="addMarker('favorite')" small>
                  <v-icon size="20">mdi-heart</v-icon> 
                </v-btn>
                <v-btn @click="openDialogMarkerBookmark" small>
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
          <v-slider v-model="volume" value="1" min="0" step="0.01" max="1" hide-details 
            :prepend-icon="volumeIcon" @click:prepend="player.toggleMute()" class="volume"/>
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
                <v-img :src="getMarkerImgUrl(marker.id)" :aspect-ratio="16/9" class="thumb" 
                  gradient="to bottom, rgba(0, 0, 0, 0.5), transparent">
                  <span class="time">{{msToTime(marker.time*1000)}}</span>
                  <div class="name">
                    <v-icon v-if="marker.type.toLowerCase()=='tag'" left small :color="getTag(marker.name).color">mdi-tag</v-icon>
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
        <v-btn-toggle v-model="playlistMode" @change="changePlaylistMode" 
          tile dense multiple color="primary" class="toggle">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn value="autoplay" v-on="on" disabled>
                <v-icon>mdi-play-pause</v-icon>
              </v-btn>
            </template>
            <span>Autoplay</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn value="shuffle" v-on="on" disabled>
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
          Marker with tag on {{msToTime(seekTime)}}
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
            <v-icon left>mdi-plus</v-icon> Add marker
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogMarkerPerformer" max-width="500" scrollable eager>
      <v-card>
        <v-card-title class="headline">
          Marker with performer on {{msToTime(seekTime)}}
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
          Marker with bookmark on {{msToTime(seekTime)}}
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
        <v-card-text class="mt-6 text-center" v-if="markerForRemove.time">
          <div @click="jumpTo(markerForRemove.time)">
            <v-img :src="getMarkerImgUrl(markerForRemove.id)" :aspect-ratio="16/9" class="thumb"/>
            <div class="mt-2">
              <v-icon v-if="markerForRemove.type.toLowerCase()=='tag'" left small :color="getTag(markerForRemove.name).color">mdi-tag</v-icon>
              <v-icon v-if="markerForRemove.type.toLowerCase()=='performer'" left small>mdi-account</v-icon>
              <v-icon v-if="markerForRemove.type.toLowerCase()=='favorite'" left small color="pink">mdi-heart</v-icon>
              <v-icon v-if="markerForRemove.type.toLowerCase()=='bookmark'" left small color="red">mdi-bookmark</v-icon>
              <span>{{markerForRemove.name}}</span> at 
              <span>{{msToTime(markerForRemove.time*1000)}}</span>
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
    <div v-html="statusText" class="status-text"
      :style="{opacity: statusOpacity,transitionDuration: statusAnimationDuration,}"
    />
    <div v-if="buffering" class="lds-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <div v-if="showInformation" class="media-information"
      :style="{
        backgroundColor: '#333333ee',
        color: '#aaaaaaee',
      }"
    >
      <div class="toolbar">
        <div class="close" @click="showInformation = false">x</div>
      </div>
      <div class="content" v-html="informationContent" />
    </div>
  </div>
</template>


<script>
const { ipcRenderer } = require('electron')
const fs = require("fs")
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const shortid = require('shortid')

import { chimera } from './webchimera/wrapper'
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'

export default {
  name: "VlcPlayer",
  components: {
    vuescroll,
  },
  mixins: [ShowImageFunction, LabelFunctions],
  props: {
    src: {
      type: String,
      default: "",
    },
  },
  beforeDestroy() {
    clearInterval(this.interval);
    clearTimeout(this.statusTimeout);
    clearTimeout(this.moveTimeout);
    clearTimeout(this.showBufferTimeout);
    this.player?.destroy?.();
    document.removeEventListener("mousemove", this.controlsMove);
    document.removeEventListener("mouseup", this.controlsUp);
    window.removeEventListener('resize', this.getCanvasSizes)
  },
  async mounted() {
    this.init();

    this.interval = setInterval(() => {
      if (this.player.state === "buffering") this.showBuffering();
    });

    this.moveTimeout = setTimeout(() => {
      this.hideControls = true;
    }, 1000);

    document.addEventListener("mousemove", this.controlsMove, false);
    document.addEventListener("mouseup", this.controlsUp, false);

    ipcRenderer.on('getDataForPlayer', (event, data) => {
      this.updateVideoPlayer(data)
    })
    ipcRenderer.on('closePlayer', () => {
      this.player.stop()
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
    showInformation: false,
    buffering: false,
    preventStatusUpdate: false,
    informationContent: "",
    statusText: "",
    statusAnimationDuration: "0s",
    statusOpacity: 0,
    statusTimeout: -1,
    volumeInput: 1,
    dontWatchTime: false,
    moveTimeout: -1,
    showBufferTimeout: -1,
    hideControls: false,
    mouseOverControls: false,
    // Video element properties //
    defaultPlaybackRate: 1,
    playbackRate: 1,
    duration: NaN,
    readyState: HTMLMediaElement.HAVE_NOTHING,
    volume: 1,
    muted: false,
    paused: false,
    currentTime: 0,
    controlsList: [],
    crossOrigin: "",
    defaultMuted: false,
    error: null,
    networkState: HTMLMediaElement.NETWORK_EMPTY,
    seeking: false,
    srcObject: null,
    seekTime: 0,
    // Playlist
    isPlaylistVisible: false,
    selectedPlaylist: null,
    videos: null,
    playlist: [],
    playIndex: null,
    playlistLength: 0,
    playlistMode: [],
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
    audioTracks: {
      cache: false,
      get() {
        let audio = this.player.audio;
        return audio.tracks.slice(1).map((track, i) => ({
          get enabled() {
            return audio.track === i + 1;
          },
          set enabled(v) {
            if (v) audio.track = i + 1;
            else audio.track = 0;
          },
          id: i,
          kind: i === 0 ? "main" : "alternative",
          label: track,
          language: "",
          sourceBuffer: null,
        }));
      },
    },
    textTracks: {
      cache: false,
      get() {
        let subtitles = this.player.subtitles;
        return subtitles.tracks.slice(1).map((track, i) => ({
          get enabled() {
            return subtitles.track === i + 1;
          },
          set enabled(v) {
            if (v) subtitles.track = i + 1;
            else subtitles.track = 0;
          },
          id: i,
          kind: i === 0 ? "main" : "alternative",
          label: track,
          language: "",
          sourceBuffer: null,
        }));
      },
    },
    videoTracks: {
      cache: false,
      get() {
        let video = this.player.video;
        return video.tracks.slice(1).map((track, i) => ({
          get selected() {
            return video.track === i + 1;
          },
          set selected(v) {
            if (v) video.track = i + 1;
            else video.track = 0;
          },
          id: i,
          kind: i === 0 ? "main" : "alternative",
          label: track.name,
          size: {
            width: track.width,
            height: track.height,
          },
          language: "",
          sourceBuffer: null,
        }));
      },
    },
    buffered: {
      cache: false,
      get() {
        return {
          length: 1,
          start: () => {
            return 0;
          },
          end: () => {
            return this.duration;
          },
        };
      },
    },
    // data from main window
    tagsAll() {
      if (this.tagsDb === null) return []
      return _.filter(this.tagsDb, t=>(t.category.includes('video')))
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
  },
  methods: {
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
    init() {
      let firstPlay = true,
          firstPause = true
      this.player = chimera.createPlayer()
      this.player.bindCanvas(this.$refs.canvas)
      console.log("init vlc player", chimera, this.player)

      this.player.on("play", () => {
        this.paused = false;
        if (firstPlay) {
          firstPlay = false;
          this.$emit("play");
        }
        this.showStatusText("▶");
      });
      this.player.on("pause", () => {
        this.paused = true;
        if (firstPause) {
          firstPause = false;
          this.$emit("pause");
        }
        this.showStatusText("⏸");
      });
      this.player.on("stop", () => {
        this.paused = true;
        this.showStatusText("⏹");
      });
      this.player.on("mute", () => {
        this.muted = true;
        this.showStatusText("🔇");
      });
      this.player.on("unmute", () => {
        this.muted = false;
        this.showStatusText(`🔊 ${Math.round(this.player.volume)}%`);
      });
      this.player.on("volumeChange", (v) => {
        this.volume = v / 100;
        this.$emit("volumechange", v / 100);
        this.showStatusText(
          `${this.player.mute ? "🔇" : "🔊"} ${Math.round(v)}%`
        );
      });
      this.player.input.on("rateChange", (v) => {
        this.playbackRate = v;
        this.$emit("ratechange", v);
        this.showStatusText(`🐢 ${v.toFixed(2)}x`);
      });
      this.player.on("seek", () => {
        this.$emit("seeking");
        this.$emit("seeked");
        this.showStatusText(
          `${this.msToTime(this.player.time)} / ${this.msToTime(
            this.player.duration
          )}`
        );
      });
      this.player.on("load", () => {
        this.readyState = HTMLMediaElement.HAVE_CURRENT_DATA;
        this.duration = this.player.duration / 1000;

        this.$emit("loadedmetadata");
        this.$emit("loadeddata");
        // console.log("loadeddata", this.player.duration);
      });
      this.player.on("time", () => {
        this.dontWatchTime = true;
        this.currentTime = this.player.time / 1000;
        this.$emit("timeupdate", this.currentTime);
      });
      this.player.on("ended", () => {
        if (this.player.playlist.items.length != this.playIndex+1) {
          this.playIndex = this.playIndex + 1
        }
      })

      this.player.on("durationChange", (duration) => {
        console.log("durationchange", duration);
        this.$emit("durationchange", duration / 1000);
        this.duration = duration / 1000;
      });

      this.player.on("error", (err) => {
        this.error = "VLC error" + err;
        this.$emit("stalled");
        this.$emit("error", ["VLC error", err]);
      });

      this.player.on("seekable", (v) => console.log("seekable change", v));

      this.player.on("mediaChange", () => {
        firstPlay = true;
        firstPause = true;
        let onStateChange = (newState) => {
          if (newState === "play" || newState === "pause") {
            this.player.off("stateChange", onStateChange);
            this.readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
            this.$emit("canplay");
            this.readyState = HTMLMediaElement.HAVE_ENOUGH_DATA;
            this.$emit("canplaythrough");
            this.networkState = HTMLMediaElement.NETWORK_IDLE;
            console.log("canplaythrough");
          }
        };
        this.player.once("frameReady", () => {
          this.getCanvasSizes()
        })
        this.player.on("stateChange", onStateChange);
      });

      let prevState = this.player.state;
      this.player.on("stateChange", (newState) => {
        if (prevState === "buffering" && newState === "play") {
          this.$emit("playing");
        }
        prevState = newState;
        console.log("New state: ", newState);
        if (newState === "buffering") this.showBuffering();
      });
    },
    updateVideoPlayer(data) {
      // console.log('update video player')
      // console.log(data)
      this.videos = data.videos
      this.playlist = _.cloneDeep(data.videos.map(video=>'file:///'+video.path))
      this.playIndex = _.findIndex(data.videos, {id: data.id})
      this.getMarkers()
    },
    showBuffering() {
      this.$emit("waiting");
      clearTimeout(this.showBufferTimeout);
      this.buffering = true;
      this.showBufferTimeout = setTimeout(() => {
        this.buffering = false;
      }, 500);
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
    controlsDown(e) {
      this.mouseDown = true;
      this.seekByEvent(e);
    },
    controlsMove(e) {
      if (this.mouseDown) this.seekByEvent(e);
    },
    controlsUp(e) {
      if (this.mouseDown) this.seekByEvent(e);
      this.mouseDown = false;
    },
    seekByEvent(e) {
      // padding 25px
      let x = (e.pageX - 25) / (100 - 50);
      x = Math.max(0, Math.min(1, x));
      this.player.position = x;
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
    showStatusText(text, timeout = 2000) {
      if (this.preventStatusUpdate) return;
      clearTimeout(this.statusTimeout);
      this.statusAnimationDuration = "0.1s";
      this.statusOpacity = 1;
      this.statusText = text;
      this.statusTimeout = setTimeout(() => {
        this.statusOpacity = 0;
        this.statusAnimationDuration = "0.4s";
      }, timeout);
    },
    loadPlaylist() {
      this.preventStatusUpdate = true
      this.duration = NaN
      this.readyState = HTMLMediaElement.HAVE_NOTHING
      this.networkState = HTMLMediaElement.NETWORK_LOADING
      this.currentTime = 0
      this.error = null
      if (this.src === "") {
        this.networkState = HTMLMediaElement.NETWORK_NO_SOURCE;
      }

        // TODO Sometimes file opens like DVD and when error it adds all parent folder to the playlist
        // that error occured when opened file located in directory "#unknown"
      if (this.playlist !== [] && this.playlist !== null) {
        let playlist = this.playlist
        this.player.playlist.clear()
        for (let i=0; i<playlist.length; i++) {
          this.player.playlist.add(playlist[i])
        }
        this.player.playlist.playItem(this.playIndex)
        this.playlistLength = this.player.playlist.items.length
        this.$emit("nowPlaying", this.player.playlist.items[this.playIndex])
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
    // ------------ HTMLVideoElement methods ---------- //
    addTextTrack(filePath) {
      this.player.subtitles.load(filePath);
    },
    captureStream() {
      console.warn("Not implemented");
    },
    canPlayType(mediaType) {
      return "probably";
    },
    fastSeek(t) {
      this.player.time = t * 1000;
    },
    load() {
      // todo this doesnt work well
      if (this.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        this.$emit("abort");
      } else {
        this.$emit("emptied");
      }
      this.player.destroy();
      this.init();
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
    // CONTROLS
    async play() {
      this.player.play()
      if (this.player.state === "Playing") return
      return new Promise((resolve) => this.player.once("play", resolve))
    },
    pause() {
      this.player.pause()
    },
    stop() {
      this.player.stop()
      this.player.time = 0
    },
    next() {
      this.playIndex = this.playIndex + 1
      this.player.playlist.next()
      this.$emit("nowPlaying", _.cloneDeep(this.player.playlist.items[this.playIndex]))
    },
    prev() {
      this.playIndex = this.playIndex - 1
      this.player.playlist.prev()
      this.$emit("nowPlaying", _.cloneDeep(this.player.playlist.items[this.playIndex]))
    },
    seek(e) {
      this.player.time = e * 1000
    },
    jumpTo(e) {
      this.player.time = e * 1000
    },
    jumpToPrevMarker() {
      let markers = _.orderBy(this.markers, 'time', ['desc'])
      let currentTime = this.player.time - 5000
      for (let i=0; i<markers.length; i++) {
        let markerTime = markers[i].time*1000
        if (markerTime < currentTime) {
          this.player.time = markerTime
          break
        }
      }
    },
    jumpToNextMarker() {
      let markers = this.markers
      let currentTime = this.player.time
      for (let i=0; i<markers.length; i++) {
        let markerTime = markers[i].time*1000
        if (markerTime > currentTime) {
          this.player.time = markerTime
          break
        }
      }
    },
    seekToNextFrame(n = 1) {
      this.player.time += (1000 * n) / this.player.input.fps;
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
    increaseVolume() {
      if (this.player.volume>=100) return
      this.player.volume += 10
    },
    decreaseVolume() {
      if (this.player.volume==0) return
      this.player.volume -= 10
    },
    changeVolume(e) {
      this.player.volume -= e.deltaY / 20;
    },
    handleKey(e) {
      console.log(e.key);
      switch (true) {
        case e.key === " ":
          this.player.togglePause();
          break;
        case e.key === "ArrowRight":
          this.player.time += 10000;
          break;
        case e.key === "ArrowLeft":
          this.player.time -= 10000;
          break;
        case e.key === "ArrowUp":
          this.player.volume += 5;
          break;
        case e.key === "ArrowDown":
          this.player.volume -= 5;
          break;
        case e.key === "=":
          let rateUp = this.player.input.rate * 1.25;
          this.player.input.rate =
            rateUp > 0.5 ? Math.round(rateUp * 4) / 4 : rateUp;
          break;
        case e.key === "-":
          let rateDown = this.player.input.rate / 1.25;
          this.player.input.rate =
            rateDown > 0.5 ? Math.round(rateDown * 4) / 4 : rateDown;
          break;
        case e.key === "m":
          this.player.mute = !this.player.mute;
          break;
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
      return this.checkMarkerImageExist(imgPath)
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
    openDialogMarkerTag() {
      this.dialogMarkerTag = true
      this.seekTime = this.player.time
    },
    openDialogMarkerPerformer() {
      this.dialogMarkerPerformer = true
      this.seekTime = this.player.time
    },
    openDialogMarkerBookmark() {
      this.dialogMarkerBookmark = true
      this.seekTime = this.player.time
    },
    addMarker(type) { 
      let text = ''
      let time = Math.floor(this.player.time / 1000) // TODO time should be like in card title
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
      this.player.playlist.playItem(index)
      this.$emit("nowPlaying", _.cloneDeep(this.player.playlist.items[index]))
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
    getFileNameFromPath(videoPath) {
      return videoPath.split("\\").pop().split('.').slice(0, -1).join('.')
    },
    changePlaylistMode() {
      // TODO need to fix this function
      // if (this.playlistMode.includes('autoplay')) {
      //   this.player.playlist.mode = 'Normal'
      // } else {
      //   this.player.playlist.mode = 'Single'
      // }
    },
  },
  watch: {
    currentTime(newValue, oldValue) {
      if (newValue !== oldValue && !this.dontWatchTime)
        this.player.time = this.currentTime * 1000;
      else if (this.dontWatchTime) this.dontWatchTime = false;
    },
    playbackRate(newValue, oldValue) {
      console.log("playback rate", newValue, oldValue);
      if (newValue !== oldValue) this.player.input.rate = this.playbackRate;
    },
    volume(newValue, oldValue) {
      if (newValue !== oldValue) this.player.volume = this.volume * 100;
    },
    playlist() {
      this.loadPlaylist()
    },
    playIndex() {
      this.getMarkers()
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
      padding: 5px;
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
      width: 50%;
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
.status-text {
  font-family: "Segoe UI Symbol", Symbol, sans-serif;
  position: absolute;
  top: 0;
  left: 0;
  font-size: calc(var(--width) / 18);
  width: calc(var(--width) * 0.95);
  text-align: right;
  color: white;
  text-shadow: 0 0 calc(var(--width) / 100) black;
}
.lds-ring {
  position: absolute;
  z-index: 3;
  display: inline-block;
  width: calc(var(--width) / 19);
  height: calc(var(--width) / 19);
}

.lds-ring div {
  /*box-shadow: inset 0 0 calc(var(--width) / 20) 0 rgba(0, 0, 0, 0.1), 0 0 calc(var(--width) / 20) rgba(0, 0, 0, 0.4);*/
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: calc(var(--width) / 20);
  height: calc(var(--width) / 20);
  margin: calc(var(--width) / 100);
  border: calc(var(--width) / 100) solid #fff;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #fff transparent transparent transparent;
}

.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}

.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}

.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>