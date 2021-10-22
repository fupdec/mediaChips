<template>
  <div ref="player" class="player" :class="{fullscreen}"
    @mousedown="stopSmoothScroll($event)" @mousemove="moveOverPlayer">
    <div class="player-wrapper" :class="{markers:isMarkersVisible, playlist:isPlaylistVisible}">
      <div class="canvas-wrapper" :class="{'system-title-bar':!showSystemBar}"
        @click="paused ? play() : pause()" 
        @dblclick="toggleFullscreen" @click.middle="toggleFullscreen" 
        @mousedown="handleMouseCanvas($event)" @contextmenu="showContextMenu($event)"
        @wheel="changeVolume" @keydown="handleKey" tabindex="-1">
        <video ref="videoPlayer" class="video-player"></video>
        <div v-if="isVideoFormatNotSupported && reg" class="video-error">
          <v-icon size="60" color="red">mdi-alert</v-icon>
          <div>{{getFileFromPath(videos[playIndex].path)}}</div>
          <div class="mb-4">Video format not supported.</div>
          <v-btn @click="playVideoInSystemPlayer" color="primary" small>
            <v-icon left>mdi-television-play</v-icon>
            <span>Play in the system player</span>
          </v-btn>
        </div>
        <div v-if="isVideoNotExist" class="video-error">
          <v-icon size="60" color="red">mdi-alert</v-icon>
          <div>{{getFileFromPath(videos[playIndex].path)}}</div>
          <div class="mb-4">The video file is missing.</div>
        </div>
        <div class="status-text">{{statusText}}</div>
      </div>
      <v-card class="controls" tile 
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
                <v-icon v-if="marker.type=='favorite'" small left color="pink">mdi-heart</v-icon>
                <v-icon v-else-if="marker.type=='bookmark'" small left color="red">mdi-bookmark</v-icon>
                <v-icon v-else small left :color="getCard(marker.name).meta.color">mdi-{{getMeta(marker.type).settings.icon}}</v-icon>
                <span v-if="marker.type=='bookmark'||marker.type=='favorite'">{{marker.name}}</span>
                <span v-else>{{getCard(marker.name).meta.name}}</span>
              </div>
              <div>{{msToTime(marker.time*1000)}}</div>
            </div>
          </div>
        </v-card-actions>
        <v-card-actions class="pa-1">
          <v-btn-toggle class="remove-active">
            <v-btn @click="paused?play():pause()" small class="ml-1" :title="paused?'Play':'Pause'">
              <v-icon v-if="paused">mdi-play</v-icon>
              <v-icon v-else>mdi-pause</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="mx-2 remove-active">
            <v-btn @click="prev" small :disabled="isPrevDisabled" title="Previous Video">
              <v-icon>mdi-skip-previous</v-icon>
            </v-btn>
            <v-btn @click="stop" small title="Stop Playing">
              <v-icon>mdi-stop</v-icon>
            </v-btn>
            <v-btn @click="next" small :disabled="isNextDisabled" title="Next Video">
              <v-icon>mdi-skip-next</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="remove-active">
            <v-btn @click="toggleFullscreen" small :title="fullscreen?'Exit Fullscreen':'Fullscreen'">
              <v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
              <v-icon v-else>mdi-fullscreen</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="ml-4 remove-active compact">
            <v-btn @click="jumpToSeconds(-5)" small title="- 5 seconds">
              <v-icon>mdi-step-backward-2</v-icon>
            </v-btn>
            <v-btn @click="jumpToSeconds(-2)" small title="- 2 seconds">
              <v-icon>mdi-step-backward</v-icon>
            </v-btn>
            <v-btn @click="jumpToSeconds(2)" small title="+ 2 seconds">
              <v-icon>mdi-step-forward</v-icon>
            </v-btn>
            <v-btn @click="jumpToSeconds(5)" small title="+ 5 seconds">
              <v-icon>mdi-step-forward-2</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="mx-4 remove-active marker-buttons compact">
            <v-btn @click="toggleMarkers" :color="isMarkersVisible? 'primary':''" small title="Markers List">
              <v-icon>mdi-map-marker</v-icon>
            </v-btn>
            <v-btn @click="jumpToPrevMarker" small class="marker-prev" title="Previous Marker">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <v-btn @click="jumpToNextMarker" small class="marker-next" title="Next Marker">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            <v-menu offset-y nudge-top="40" nudge-right="400" attach=".controls">
              <template v-slot:activator="{ on, attrs }">
                <v-btn v-bind="attrs" v-on="on" small title="Add Marker">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
              
              <v-btn-toggle class="remove-active">
                <v-btn @click="addMarker('favorite')" title="Favorite">
                  <v-icon size="20">mdi-heart</v-icon> 
                </v-btn>
                <v-btn @click="openDialogMarkerBookmark" title="Bookmark">
                  <v-icon size="20">mdi-bookmark</v-icon> 
                </v-btn>
                <v-btn v-for="m in metaMarkers" :key="m.id" :value="m.id" @click="openDialogMarkerMeta(m.id)" :title="m.settings.name">
                  <v-icon size="20">mdi-{{m.settings.icon}}</v-icon>
                </v-btn>
              </v-btn-toggle>
            </v-menu>
          </v-btn-toggle>
          <v-btn-toggle class="remove-active">
            <v-btn @click="togglePlaylist" :color="isPlaylistVisible? 'primary':''" small title="Playlist">
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="mx-2 remove-active">
            <v-btn @click="setAsThumb" small title="Set Frame as Thumb">
              <v-icon>mdi-image</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-spacer></v-spacer>
          <div class="duration mx-2">
            <div class="time-start">{{ msToTime(currentTime * 1000) }}</div>
            <span class="mx-1">/</span>
            <div class="time-end">{{ msToTime(duration * 1000) }}</div>
          </div>
          <v-slider v-model="volume" value="1" min="0" step="0.05" max="1" hide-details 
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
          <v-btn value="favorite" :style="`width:${100/(metaMarkers.length+2)}%`">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
          <v-btn value="bookmark" :style="`width:${100/(metaMarkers.length+2)}%`">
            <v-icon>mdi-bookmark</v-icon>
          </v-btn>
          <v-btn v-for="m in metaMarkers" :key="m.id" :value="m.id" :style="`width:${100/(metaMarkers.length+2)}%`">
            <v-icon>mdi-{{m.settings.icon}}</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-card-actions>
      <vuescroll class="items">
        <v-card-text class="pa-0">
          <div v-if="markers.length">
            <div v-for="marker in markers" :key="marker.id" class="marker-wrapper">
              <div v-if="(markersType.includes(marker.type))">
                <div @click="jumpTo(marker.time)" class="marker">
                  <v-img :src="getMarkerImgUrl(marker.id)" :aspect-ratio="16/9" class="thumb" :gradient="markerGradient">
                    <span class="time">{{msToTime(marker.time*1000)}}</span>
                    <div class="name">
                      <v-icon v-if="marker.type=='favorite'" small left color="pink">mdi-heart</v-icon>
                      <v-icon v-else-if="marker.type=='bookmark'" small left color="red">mdi-bookmark</v-icon>
                      <v-icon v-else small left :color="getCard(marker.name).meta.color">mdi-{{getMeta(marker.type).settings.icon}}</v-icon>
                      <span v-if="marker.type=='bookmark'||marker.type=='favorite'">{{marker.name}}</span>
                      <span v-else>{{getCard(marker.name).meta.name}}</span>
                    </div>
                  </v-img>
                </div>
                <v-btn @click="openDialogRemoveMarker(marker)" height="25" width="25" outlined icon color="red" class="delete">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
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


    <v-dialog v-if="dialogMarkerMeta" v-model="dialogMarkerMeta" @input="metaForMarker=''" max-width="600" scrollable eager>
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">Marker with {{getMeta(markerMetaId).settings.nameSingular}} on {{msToTime(seekTime*1000)}}</div>
          <v-spacer></v-spacer>
          <v-btn @click="addMarker('meta')" :disabled="!metaForMarker" outlined><v-icon left>mdi-plus</v-icon>Add</v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text>
            <v-autocomplete v-model="metaForMarker" :items="metaCardsForMarker" hide-selected 
              :label="getMeta(markerMetaId).settings.name" item-value="id" autofocus clearable
              :prepend-inner-icon="`mdi-${getMeta(markerMetaId).settings.icon}`"
              append-outer-icon="mdi-plus" @click:append-outer="dialogAddNewMetaCard=true"
              append-icon="mdi-chevron-down" @click:append="dialogListView=true"
              :menu-props="{contentClass:'list-with-preview'}"
              :filter="filterCards" :hint="getMeta(markerMetaId).settings.hint" persistent-hint
            >
              <template v-slot:selection="data">
                <v-chip v-bind="data.attrs" 
                  :color="getColor(markerMetaId,data.item.id)" 
                  :label="getMeta(markerMetaId).settings.chipLabel"
                  :outlined="getMeta(markerMetaId).settings.chipOutlined"
                  @mouseover.stop="showImage($event, data.item.id, 'meta', markerMetaId)" 
                  @mouseleave.stop="$store.state.hoveredImage=false">
                  <span>{{ data.item.meta.name }}</span>
                </v-chip>
              </template>
              <template v-slot:item="data">
                <div class="list-item" 
                  @mouseover.stop="showImage($event, data.item.id, 'meta', markerMetaId)" 
                  @mouseleave.stop="$store.state.hoveredImage=false"
                > 
                  <span v-if="getMeta(markerMetaId).settings.favorite">
                    <v-icon :color="data.item.meta.favorite? 'pink':''" left size="14">mdi-heart</v-icon>
                  </span>
                  <span v-if="getMeta(markerMetaId).settings.color">
                    <v-icon :color="data.item.meta.color || ''" left small>
                      mdi-{{getMeta(markerMetaId).settings.icon}}</v-icon>
                  </span>
                  <span>{{data.item.meta.name}}</span>
                  <span v-if="getMeta(markerMetaId).settings.synonyms" class="aliases">
                    {{getCard(data.item.id).meta.synonyms===undefined? '' : getCard(data.item.id).meta.synonyms.join(', ').slice(0,50)}}
                  </span>
                </div>
              </template>
            </v-autocomplete>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-if="dialogAddNewMetaCard" v-model="dialogAddNewMetaCard" @input="nameForNewMetaCard=''" width="450">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New {{getMeta(markerMetaId).settings.nameSingular.toLowerCase()}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewMetaCard" :disabled="!nameForNewMetaCard" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-text-field v-model="nameForNewMetaCard" label="Name" autofocus/>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-if="dialogMarkerBookmark" v-model="dialogMarkerBookmark" max-width="550" scrollable eager>
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">Marker with bookmark on {{msToTime(seekTime*1000)}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="addMarker('bookmark')" :disabled="!markerBookmarkText" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text>
            <v-textarea v-model="markerBookmarkText" label="Bookmark text" solo hide-details autofocus/>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-if="dialogRemoveMarker" v-model="dialogRemoveMarker" max-width="420">
      <v-card>
        <v-toolbar color="error">
          <span class="headline">Remove marker?</span>
          <v-spacer></v-spacer>
          <v-btn @click="dialogRemoveMarker=false" class="mx-4" outlined> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="removeMarker" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center py-6">
          <v-card outlined class="pb-2">
            <v-chip outlined class="my-2">
              <v-icon v-if="markerForRemove.type=='favorite'" small left color="pink">mdi-heart</v-icon>
              <v-icon v-else-if="markerForRemove.type=='bookmark'" small left color="red">mdi-bookmark</v-icon>
              <v-icon v-else small left :color="getCard(markerForRemove.name).meta.color">mdi-{{getMeta(markerForRemove.type).settings.icon}}</v-icon>
              <span v-if="markerForRemove.type=='bookmark'||markerForRemove.type=='favorite'">{{markerForRemove.name}}</span>
              <span v-else>{{getCard(markerForRemove.name).meta.name}}</span>
            </v-chip> 
            <v-img :src="getMarkerImgUrl(markerForRemove.id)" :aspect-ratio="16/9" class="thumb"/>
            <div class="mt-2">
              <span class="mr-2">at time</span> 
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-chip @click="jumpTo(markerForRemove.time)" v-on="on" outlined label>
                    <b>{{msToTime(markerForRemove.time*1000)}}</b>
                  </v-chip>
                </template>
                <span>Jump To Time</span>
              </v-tooltip>
            </div>
          </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>

    <img v-show="$store.state.hoveredImage" class="list-img-preview"
      :src="getHoveredImage" height="160" max-width="160"
      :style="`top:${$store.state.hoveredImageY+30}px;left:${$store.state.hoveredImageX+30}px;`"/>
    
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
const shortid = require('shortid')
const shell = require('electron').shell
const ffmpeg = require('fluent-ffmpeg')
const pathToFfmpeg = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
const pathToFfprobe = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')
ffmpeg.setFfmpegPath(pathToFfmpeg)
ffmpeg.setFfprobePath(pathToFfprobe)

// import { chimera } from './webchimera/wrapper'
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'
import Keys from '@/mixins/Keys'

export default {
  name: "AppPlayer",
  components: {
    vuescroll,
  },
  mixins: [ShowImageFunction, LabelFunctions, Keys],
  beforeDestroy() {
    document.removeEventListener("mousemove", this.controlsMove)
    document.removeEventListener("mouseup", this.controlsUp)
    window.removeEventListener('resize', this.getCanvasSizes)
  },
  async mounted() {
    this.initPlayer()
    setTimeout(() => {this.initMarkerType()}, 1000)

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
      if (dbType == 'metaCards') setTimeout(() => {this.getMarkers()}, 1000)
      if (dbType == 'meta') setTimeout(() => {this.initMarkerType()}, 1000)
    })
    window.addEventListener('resize', this.getCanvasSizes)
  },
  data: () => ({
    canvasSizes: '',
    menu: false,
    player: null,
    moveTimeout: -1,
    hideControls: false,
    mouseOverControls: false,
    statusText: '',
    statusTextTimeout: null,
    // Video element properties //
    duration: 1,
    volume: 1,
    muted: false,
    paused: false,
    currentTime: 0,
    currentTimeTracker: null,
    isVideoFormatNotSupported: null,
    isVideoNotExist: null,
    seekTime: 0,
    // Playlist
    isPlaylistVisible: false,
    videos: [],
    playlist: [],
    playlistShuffle: [],
    playIndex: null,
    playlistMode: ['autoplay'],
    // Markers
    isMarkersVisible: false,
    markers: [],
    markerBookmarkText: '',
    metaForMarker: '',
    markerMetaId: null,
    nameForNewMetaCard: '',
    dialogMarkerMeta: false,
    dialogAddNewMetaCard: false,
    dialogListView: false,
    dialogMarkerBookmark: false,
    dialogRemoveMarker: false,
    markerForRemove: {},
    markersType: ['favorite','bookmark'],
  }),
  computed: {
    showSystemBar() {return process.platform === 'win32'},
    fullscreen: {
      get() { return this.$store.state.fullscreen },
      set(value) { this.$store.state.fullscreen = value },
    },
    currentSrc() { return this.src; },
    volumeIcon() {
      if (this.muted) return 'mdi-volume-mute'
      if (this.volume > 0.7) return 'mdi-volume-high'
      if (this.volume > 0.3) return 'mdi-volume-medium'
      return 'mdi-volume-low'
    },
    // data from main window
    pathToUserData() { return this.$store.getters.getPathToUserData },
    videosDb() { return this.$store.state.videosDb },
    playlistsDb() { return this.$store.state.playlistsDb },
    metaDb() { return this.$store.state.metaDb },
    metaCardsDb() { return this.$store.state.metaCardsDb },
    markersDb() { return this.$store.state.markersDb },
    settingsDb() { return this.$store.state.settingsDb },
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
    metaMarkers() { return _.filter(this.metaDb, i=>i.settings.markers) },
    metaCardsForMarker() { return _.filter(this.metaCardsDb, { metaId: this.markerMetaId }) },
    getHoveredImage() { 
      let cardId = this.$store.state.hoveredImageId, metaId = this.$store.state.hoveredImageMetaId
      let imgPath = path.join(this.pathToUserData, `/media/meta/${metaId}/${cardId}_main.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      else return path.join('file://', __static, '/img/default.jpg')
    },
  },
  methods: {
    initPlayer() {
      this.player = this.$refs.videoPlayer
      this.player.addEventListener('loadedmetadata', (event) => { this.loadSrc() })
      this.player.addEventListener('ended', (event) => {
        if (this.playlistMode.includes('autoplay')) this.next()
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
      if (!this.reg && this.playIndex>4) this.player.src = ''
    },
    moveOverPlayer(e) {
      if (!e.movementX > 0 || !e.movementY > 0) return
      this.hideControls = false
      clearTimeout(this.moveTimeout)
      this.moveTimeout = setTimeout(() => { this.hideControls = true }, 1000);
    },
    msToTime(ms, keepMs = false) {
      if (isNaN(ms)) return `00:00` + keepMs ? ".00" : ""
      let hms = new Date(ms).toISOString().substr(11, keepMs ? 11 : 8).replace(/^0+/, "")
      hms = hms.startsWith(":") ? hms.substr(1) : hms;
      return hms.startsWith("00") ? hms.substr(1) : hms;
    },
    toggleFullscreen() {
      this.$emit("toggleFullscreen")
      setTimeout(() => { this.getCanvasSizes() }, 100)
      setTimeout(() => { this.getCanvasSizes() }, 500)
      setTimeout(() => { this.getCanvasSizes() }, 1000)
    },
    setAsThumb() {
      let video = this.videos[this.playIndex]
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${video.id}.jpg`)
      let specificTime = new Date(this.currentTime*1000).toISOString().substr(11, 8)
      this.createMarkerThumb(specificTime, video.path, imgPath, 320)
        .then(result => { console.log('thumb created') })
        .catch(error => { console.log(error) })
    },
    trackCurrentTime() {
      let timeout = 100
      if (this.duration > 200) timeout = 1000
      this.currentTimeTracker = setInterval(() => {this.currentTime = this.player.currentTime}, timeout)
    },
    playVideoInSystemPlayer() { shell.openPath(this.videos[this.playIndex].path) },
    playVideo(video) {
      this.player.src = video.path
      this.player.play()
      ipcRenderer.send('videoWatched', video.id)
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
        if (isLoopMode && shuffleIndex < 0) shuffleIndex = this.videos.length-1 // if loop mode
        this.playIndex = this.playlistShuffle[shuffleIndex]
      } else {
        this.playIndex = this.playIndex - 1
        if (isLoopMode && this.playIndex < 0) this.playIndex = this.videos.length-1 // if loop
      }
      this.playVideo(this.videos[this.playIndex])
      if (!this.isPlaylistVisible) return // scroll to now playing in playlist
      const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
      this.$refs.playlist.scrollTo({ y: height }, 50)
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
      this.playVideo(this.videos[this.playIndex])

      if (!this.isPlaylistVisible) return  // scroll to now playing in playlist
      const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
      this.$refs.playlist.scrollTo({ y: height }, 50)
    },
    seek(e) {
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
        if (markerTime < currentTime) { this.player.currentTime = markerTime; break }
      }
    },
    jumpToNextMarker() {
      let markers = this.markers
      let currentTime = this.player.currentTime
      for (let i=0; i<markers.length; i++) {
        let markerTime = markers[i].time
        if (markerTime > currentTime) { this.player.currentTime = markerTime; break }
      }
    },
    showContextMenu(e) {
      e.preventDefault()
      this.menu = true
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
    },
    stopSmoothScroll(event) {
      if (event.button != 1) return
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
      if (e.deltaY>0) { if (this.player.volume == 0) return }
      else if (this.player.volume >= 1) return
      this.player.volume = (this.player.volume - e.deltaY / 1000 / 2).toFixed(2)
      this.volume = this.player.volume
    },
    jumpToSeconds(e) {
      this.player.currentTime = this.player.currentTime + e
    },
    handleKey(e) {
      switch (true) {
        case e.key === ' ': this.player.togglePause(); break
        case e.key === 'ArrowRight': this.player.currentTime += 10; break
        case e.key === 'ArrowLeft': this.player.currentTime -= 10; break
        case e.key === 'ArrowUp': this.changeVolume({deltaY:-100}); break
        case e.key === 'ArrowDown': this.changeVolume({deltaY:+100}); break
        case e.key === 'f': this.toggleFullscreen(); break
        case e.key === 'p': this.togglePlaylist(); break
        case e.key === 'm': this.toggleMarkers(); break
        case e.key === ',': this.jumpToPrevMarker(); break
        case e.key === '.': this.jumpToNextMarker(); break
        case e.key === 'z': this.prev(); break
        case e.key === 'c': this.next(); break
        case e.key === 'x': this.stop(); break
        case e.key === '1': this.addMarker('favorite'); break
        case e.key === '2': this.openDialogMarkerBookmark(); break
        case e.key === 'Escape': this.fullscreen ? this.toggleFullscreen() : ''; break
      }
    },
    handleMouseCanvas(e) {
      let btnCode = e.button
      switch (btnCode) {
        case 3: this.prev(); break
        case 4: this.next(); break
      }
    },
    handleMouseSeek(e) {
      let btnCode = e.button
      switch (btnCode) {
        // case 0: // clearInterval(this.currentTimeTracker); break
        // case 1: // clearInterval(this.currentTimeTracker); break
        // case 2: // clearInterval(this.currentTimeTracker); break
        case 3: this.jumpToPrevMarker(); break
        case 4: this.jumpToNextMarker(); break
      }
    },
    // MARKERS
    initMarkerType() {
      this.markersType = ['favorite','bookmark']
      for (let m of this.metaMarkers) this.markersType.push(m.id)
    },
    toggleMarkers() {
      this.isMarkersVisible=!this.isMarkersVisible
      setTimeout(() => { this.getCanvasSizes() }, 100)
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
          .then(result => { /*console.log('thumb created')*/ })
          .catch(error => { /*console.log(error)*/ })
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
      if (fs.existsSync(imgPath)) return imgPath 
      else return path.join(__static, '/img/default.jpg')
    },
    openDialogMarkerMeta(metaId) {
      this.dialogMarkerMeta = true
      this.markerMetaId = metaId
      this.seekTime = this.player.currentTime
    },
    openDialogMarkerBookmark() {
      this.dialogMarkerBookmark = true
      this.seekTime = this.player.currentTime
    },
    addMarker(type) { 
      let text = ''
      let time = Math.floor(this.seekTime)
      if (type === 'favorite') time = Math.floor(this.player.currentTime)
      else if (type === 'bookmark') {
        text = this.markerBookmarkText
        this.dialogMarkerBookmark = false
      } else if (type === 'meta') {
        type = this.markerMetaId
        text = this.metaForMarker
        this.dialogMarkerMeta = false
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

      this.metaForMarker = ''
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
    // PLAYLIST
    playItemFromPlaylist(index) {
      // console.log(this.player.playlist.items.map(i=>i.mrl))
      if (this.playlistMode.includes('shuffle')) {
        let indices = []
        for (let i = 0; i < this.videos.length; i++) indices.push(i)
        this.playlistShuffle = _.shuffle(indices)
        const i = this.playlistShuffle.indexOf(index)
        this.playlistShuffle.splice(i, 1)
        this.playlistShuffle.unshift(index)
        this.player.playlist.playItem(index)

        if (this.isPlaylistVisible) { // scroll to now playing in playlist
          const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
          this.$refs.playlist.scrollTo({ y: height }, 50)
        }
      } else this.playVideo(this.videos[this.playIndex])
    },
    togglePlaylist() {
      this.isPlaylistVisible=!this.isPlaylistVisible
      setTimeout(() => { this.getCanvasSizes() }, 100)
      if (!this.isPlaylistVisible) return
      const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
      this.$refs.playlist.scrollTo({ y: height }, 50)
    },
    getPlaylistImgUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return 'file://' + this.checkPlaylistImageExist(imgPath)
    },
    checkPlaylistImageExist(imgPath) {
      if (fs.existsSync(imgPath)) return imgPath
      else {
        this.errorThumb = true
        return path.join(__static, '/img/default.jpg')
      }
    },
    getFileNameFromPath(videoPath) { return path.parse(videoPath).name },
    getFileFromPath(videoPath) { return path.basename(videoPath) },
    // META
    getMeta(id) { return _.find(this.metaDb, {id}) },
    getCard(cardId) { return _.find(this.metaCardsDb, {id:cardId}) },
    getCards(metaId) { return _.filter(this.metaCardsDb, {metaId}) },
    getColor(metaId, cardId) {
      if (this.getMeta(metaId).settings.color) {
        if (this.getCard(cardId) === undefined) return '#777'
        else return this.getCard(cardId).meta.color || '#777'
      } else return ''
    },
    filterCards(cardObject, queryText, itemText) {
      let card = _.cloneDeep(cardObject)
      let query = queryText.toLowerCase()

      function foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0
        let foundAllChars = false
        for (let i = 0; i < query.length; i++) {
          const char = query.charAt(i)
          const index = text.indexOf(char, foundCharIndex)
          if (index > -1) foundAllChars = true, foundCharIndex = index + 1
          else return false
        }
        return foundAllChars
      }

      if (this.settingsDb.typingFiltersDefault) {
        let index = card.meta.name.toLowerCase().indexOf(query)
        if (index > -1) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            let indexSub = card.meta.synonyms[i].toLowerCase().indexOf(query)
            if (indexSub > -1) return true
          }
          return false
        }
      } else {
        if (foundByChars(card.meta.name, query)) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            return foundByChars(card.meta.synonyms[i], query)
          }
          return false
        }
      }
    },
    addNewMetaCard() {
      ipcRenderer.send('addNewMetaCard', this.nameForNewMetaCard, this.markerMetaId)
      this.dialogAddNewMetaCard = false
      this.nameForNewMetaCard = ''
    },
  },
  watch: {
    volume(newValue, oldValue) { if (newValue !== oldValue) this.player.volume = newValue },
    playIndex() { this.getMarkers() },
    playlistMode(mode, oldMode) {
      if (!mode.includes('shuffle') && oldMode.includes('shuffle')) return
      let index = []
      for (let i = 0; i < this.videos.length; i++) index.push(i) 
      this.playlistShuffle = _.shuffle(index)
      this.playIndex = this.playlistShuffle[0]
      this.player.src = path.join('file://', this.videos[this.playIndex].path)

      if (this.isPlaylistVisible) { // scroll to now playing in playlist
        const height = `${this.playIndex * document.documentElement.clientWidth / 10}`
        this.$refs.playlist.scrollTo({ y: height }, 50)
      }
    },
  },
};
</script>


<style lang="less">
.player {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  &.fullscreen {
    .controls {
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
    &.compact {
      .v-btn {
        padding: 0;
        min-width: 28px;
      }
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
    &.system-title-bar {
      max-height: 100%;
    }
  }
  .canvas {
    background: #fff;
    width: 100%;
    height: auto;
  }
  .reg-block {
    position: absolute;
    top: 40%;
    right: 20%;
    left: 20%;
    z-index: 3;
    background-color: hsla(0, 0%, 30%, 0.7);
    color: #fff;
    text-transform: uppercase;
    text-align: center;
    padding: 10px;
  }
  .reg-playlist {
    background-color: #414141;
    color: #fff;
    padding: 4px;
    position: absolute;
    left: 5%;
    right: 5%;
    text-align: center;
    font-size: 1vw;
    line-height: 1;
    text-transform: uppercase;
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
.controls {
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
  .v-slider__thumb:before,
  .v-slider__thumb:after {
    display: none;
  }
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
    &-wrapper {
      position: relative;
      &:hover {
        .delete {
          opacity: 1;
        }
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
    display: flex;
    flex-wrap: wrap;
    .v-btn {
      min-width: 30px;
      padding: 0;
    }
  }
  .delete {
    opacity: 0;
    transition: .3s;
    position: absolute;
    left: 0;
    bottom: 0;
    padding: 1.5vw;
    border-radius: 0 5px 0 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
}
.theme--light {
  .controls {
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