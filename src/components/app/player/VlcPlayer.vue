<template>
  <div ref="player" class="vlc-player" 
    @mousedown="stopSmoothScroll($event)"
    @mousemove="moveOverPlayer" @contextmenu="showContextMenu($event)"
    @keydown="handleKey" @wheel="handleScroll" tabindex="1"
  >
  <img id="myximg">
    <div class="canvas-center" @click="paused ? play() : pause()" @dblclick="toggleFullscreen">
      <canvas ref="canvas" class="canvas"/>
    </div>
    <v-card v-if="controls" class="vlc-controls" tile>
      <v-card-actions class="timeline pa-1">
        <v-slider @change="seek($event)" :value="currentTime" color="white"
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
            <div>{{calcDur(marker.time)}}</div>
          </div>
        </div>
      </v-card-actions>
      <v-card-actions class="pa-1">
        <v-btn @click="paused ? play() : pause()" small class="ml-1">
          <v-icon v-if="paused">mdi-play</v-icon>
          <v-icon v-else>mdi-pause</v-icon>
        </v-btn>
        <v-btn-toggle class="mx-2">
          <v-btn @click="prev" small :disabled="currentItem==null || currentItem==0">
            <v-icon>mdi-skip-previous</v-icon>
          </v-btn>
          <v-btn @click="stop" small>
            <v-icon>mdi-stop</v-icon>
          </v-btn>
          <v-btn @click="next" small :disabled="currentItem==null">
            <v-icon>mdi-skip-next</v-icon>
          </v-btn>
        </v-btn-toggle>
        <v-btn v-if="!controlsList.includes('nofullscreen')" @click="toggleFullscreen" small>
          <v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
          <v-icon v-else>mdi-fullscreen</v-icon>
        </v-btn>
        <v-btn-toggle class="mx-2">
          <v-btn @click="toggleMarkers" small>
            <v-icon>mdi-map-marker</v-icon>
          </v-btn>
          <v-btn @click="addMarker" small disabled>
            <v-icon>mdi-map-marker-plus</v-icon>
          </v-btn>
        </v-btn-toggle>
        <v-btn @click="togglePlaylist" small>
          <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
        <div class="duration mx-2">
          <div class="time-start">{{ msToTime(currentTime * 1000) }}</div>
          <span class="mx-1">/</span>
          <div class="time-end">{{ msToTime(duration * 1000) }}</div>
        </div>
        <v-slider v-model="volume" value="1" min="0" step="0.01" max="1" 
          color="white" hide-details style="max-width:120px;" class="mr-2"
          :prepend-icon="volumeIcon" @click:prepend="player.toggleMute()"/>
      </v-card-actions>
    </v-card>
    
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
    <!-- <div v-if="controls && bounds" class="controls" 
      @mouseenter="mouseOverControls = true"
      @mouseleave="mouseOverControls = false"
      :style="{
        opacity:
          hideControls && !mouseOverControls && !paused
            ? 0
            : readyState === 0
            ? 0.5
            : 1,
        pointerEvents: readyState === 0 ? 'none' : 'all',
      }"
    >
      <div class="controls-top">
        <div class="controls-left">
          <div
            class="play-button"
            @click="paused ? play() : pause()"
          ></div>
          <div class="time-info">
            {{ msToTime(currentTime * 1000) }} / {{ msToTime(duration * 1000) }}
          </div>
        </div>
        <div class="controls-right">
          <div class="volume">
            <input
              type="range"
              step="0.01"
              min="0"
              max="2"
              v-model="volume"
              value="1"
              class="volume-slider"
            />
            <div
              class="volume-icon"
              @click="player.toggleMute()"
            ></div>
          </div>
          <div
            class="fullscreen-button"
            v-if="!controlsList.includes('nofullscreen')"
            @click="toggleFullscreen"
          ></div>
        </div>
      </div>
      <div class="controls-bottom" @mousedown="controlsDown">
        <div class="seek-background">
          <div
            class="seek-progress"
            :style="{
              width: Math.round(position * 10000) / 100 + '%',
            }"
          ></div>
          <div
            class="seek-thumb"
            :style="{
              opacity: mouseOverControls ? 1 : 0,
              left: `calc(${Math.round(position * 10000) / 100}% - 6px)`,
            }"
          ></div>
        </div>
      </div>
    </div> -->
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
        backgroundColor: dark ? '#333333ee' : '#aaaaaaee',
        color: dark ? '#aaaaaaee' : '#333333ee',
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
// TODO
// dont fire scroll event on media information

// copy entire api from HtmlVideoElement for this
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
// Inherited members are still required

// Fix setting src to ''
// figure out audio device switching
// Add fullscreen to video submenu? How will we handle this
// Chromecast support? lmao nee

// on loadeddata (when width and height of frame are known, set element size to proper dimensions,
// (what happens for size on src change for htmlvideo?))

import { chimera } from './webchimera/wrapper'
import Functions from '@/mixins/Functions'
import path from "path"
const fs = require("fs")

export default {
  name: "VlcPlayer",
  props: {
    // ------- HTML Video properties -------- //
    src: {
      type: String,
      default: "",
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
    controls: {
      type: Boolean,
      default: false,
    },
    // ---------- Miscellaneous -------- //
    dark: {
      type: Boolean,
      default: false,
    },
    enableStatusText: {
      type: Boolean,
      default: false,
    },
    disableKeys: {
      type: Boolean,
      default: false,
    },
    loop: {
      type: Boolean,
      default: false,
    },
    playlist: {
      type: Array,
      default: null,
    },
    playIndex: {
      type: Number,
      default: 0,
    },
    markers: {
      type: Array,
      default: [],
    },
  },
  mixins: [Functions],
  data: () => ({
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
    fullscreen: false,
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
    ended: false,
    error: null,
    networkState: HTMLMediaElement.NETWORK_EMPTY,
    seeking: false,
    srcObject: null,
  }),
  beforeDestroy() {
    clearInterval(this.interval);
    clearTimeout(this.statusTimeout);
    clearTimeout(this.moveTimeout);
    clearTimeout(this.showBufferTimeout);
    this.player?.destroy?.();
    document.removeEventListener("mousemove", this.controlsMove);
    document.removeEventListener("mouseup", this.controlsUp);
    document.removeEventListener("fullscreenchange", this.changeFullscreen);
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
    document.addEventListener("fullscreenchange", this.changeFullscreen, false);
  },
  computed: {
    // ------------ HTMLVideoElement getters ---------- //
    currentItem() {
      if (this.player) {
        return this.player.playlist.currentItem
      } else return null
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
    seekable() {
      return this.readyState > 0;
    },
    // ---------------- Miscellaneous ----------------- //
    position() {
      if (this.duration && this.duration !== 0)
        return this.currentTime / this.duration;
      return 0;
    },
    menuIconPath() {
      return path.join(
        __static,
        `/menu-icons/${this.dark ? "white" : "black"}/`
      );
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
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
        if (this.loop) {
          this.currentTime = 0;
          this.player.once("stop", () => {
            this.player.play();
            this.player.once("pause", this.player.play);
          });
        } else {
          this.$emit("ended");
          this.ended = true;
        }
      });

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
          if (!this.autoplay) {
            this.player.mute = this.defaultMuted;
            this.player.pause();
            this.player.once("pause", () => (this.preventStatusUpdate = false));
          }
        });
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

      this.loadSrc()
    },
    showBuffering() {
      this.$emit("waiting");
      clearTimeout(this.showBufferTimeout);
      this.buffering = true;
      this.showBufferTimeout = setTimeout(() => {
        this.buffering = false;
      }, 500);
    },
    changeFullscreen() {
      this.fullscreen = document.fullscreenElement === this.$refs.player;
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
    handleScroll(e) {
      this.player.volume -= e.deltaY / 20;
    },
    handleKey(e) {
      if (this.disableKeys) return;
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
    async addSubtitles() {
      let { filePath, canceled } = await this.promptSubtitleFile();
      if (!canceled) {
        console.log("Loading subtitles", filePath);
        this.player.subtitles.load(filePath);
      }
    },
    async promptSubtitleFile() {
      let { dialog } = require("electron").remote;
      let { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Add subtitles from file",
        buttonLabel: "Add subtitles",
        filters: [
          {
            name: "Subtitle files",
            extensions: ["cdg","idx","srt","sub","utf","ass","ssa","aqt","jss","psb","rt","sami","smi","txt","smil","stl","usf","dks","pjs","mpl2","mks","vtt","tt","ttml","dfxp","scc",],
          },
          {
            name: "All files",
            extensions: ["*"],
          },
        ],
        properties: ["openFile"],
      });
      return { canceled, filePath: filePaths[0] };
    },
    showStatusText(text, timeout = 2000) {
      if (!this.enableStatusText || this.preventStatusUpdate) return;
      clearTimeout(this.statusTimeout);
      this.statusAnimationDuration = "0.1s";
      this.statusOpacity = 1;
      this.statusText = text;
      this.statusTimeout = setTimeout(() => {
        this.statusOpacity = 0;
        this.statusAnimationDuration = "0.4s";
      }, timeout);
    },
    loadSrc() {
      this.preventStatusUpdate = true;
      this.duration = NaN;
      this.ended = false;
      this.readyState = HTMLMediaElement.HAVE_NOTHING;
      this.networkState = HTMLMediaElement.NETWORK_LOADING;
      this.currentTime = 0;
      this.error = null;

      if (this.src === "") {
        this.networkState = HTMLMediaElement.NETWORK_NO_SOURCE;
      }

      if (this.playlist !== [] && this.playlist !== null) {
        let playlist = this.playlist
        this.player.playlist.clear()
        for (let i=0; i<playlist.length; i++) {
          this.player.playlist.add(playlist[i])
        }
        this.player.playlist.playItem(this.playIndex)
        this.$emit("nowPlaying", this.player.playlist.items[this.player.playlist.currentItem])
      } else {
        this.player.playUrl(this.src);
      }

      this.$emit("loadstart");
    },
    toggleFullscreen() {
      if (this.fullscreen) {
        document.exitFullscreen();
      } else {
        let container = this.$refs.player;
        container.requestFullscreen();
      }
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
    async play() {
      this.player.play();
      if (this.player.state === "Playing") return;
      return new Promise((resolve) => this.player.once("play", resolve));
    },
    pause() {
      this.player.pause()
    },
    stop() {
      this.player.stop()
      this.player.time = 0
    },
    next() {
      this.player.playlist.next()
      this.$emit("next")
      this.$emit("nowPlaying", this.player.playlist.items[this.player.playlist.currentItem])
    },
    prev() {
      this.player.playlist.prev()
      this.$emit("prev")
      this.$emit("nowPlaying", this.player.playlist.items[this.player.playlist.currentItem])
    },
    seek(e) {
      this.player.time = e * 1000
    },
    jumpTo(e) {
      this.player.time = e * 1000
    },
    toggleMarkers() {
      this.$emit('toggleMarkers')
    },
    addMarker() {
      this.$emit('addMarker')
    },
    togglePlaylist() {
      // this.player.playlist.play(this.src)
      this.$emit('togglePlaylist', this.player.playlist.items)
      console.log(this.player.playlist.items)
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
    // MARKERS
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
    src() {
      this.loadSrc()
    },
    playlist() {
      this.loadSrc()
    },
    playIndex(newIndex) {
      this.player.playlist.playItem(newIndex)
    },
  },
};
</script>

<style lang="less" scoped>
.vlc-player {
  display: inline-block;
  position: relative;
  width: 100%;
  background: #000;
}
.vlc-controls {
  position: absolute;
  bottom: 0;
  width: 100%;
  opacity: 0.9;
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
    .marker {
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
}

.vlc-player:focus {
  outline: none;
}

.canvas-center {
  width: 100%;
  height: 100%;
  display: flex;
  place-items: center;
  justify-content: center;
  background-color: #000;
  pointer-events: none;
}

.canvas {
  background: #fff;
  width: 100%;
  height: auto;
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

.media-information {
  width: calc(var(--width) - 40px);
  max-height: calc(var(--height) - 40px);

  position: absolute;
  z-index: 3;
}

.toolbar {
  width: 100%;
  height: 30px;
  background-color: rgba(128, 128, 128, 0.2);
  display: flex;
  justify-content: flex-end;
}

.close {
  margin: 3px;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px rgba(128, 128, 128, 0.5);
  transition: background-color 0.15s;
  user-select: none;
}

.close:hover {
  background-color: rgba(128, 128, 128, 0.3);
}

.content {
  padding: 20px;
  text-align: left;
  overflow-y: auto;
  max-height: calc(var(--height) - 110px);
}
</style>