<template>
  <div class="video-player-wrapper">
    <v-card class="video-player" :outlined="!maximized">
      <v-card-title class="pa-0 title-bar" :class="{maximized:maximized}">
        <!-- <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn @click="playVideoInSystemPlayer" v-on="on" icon tile width="46">
              <v-icon>mdi-television-play</v-icon> 
            </v-btn>
          </template>
          <span>Play video in system player</span>
        </v-tooltip> -->
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
        <!-- TODO create function for set current frame as video thumb -->
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
          <v-btn text tile small width="46" height="32" @click="minimize">
            <v-icon size="16">mdi-minus</v-icon>
          </v-btn>
          <v-btn v-if="maximized" text tile small width="46" height="32" @click="unmaximize">
            <v-icon size="18">mdi-window-restore</v-icon>
          </v-btn>
          <v-btn v-else text tile small width="46" height="32" @click="maximize">
            <v-icon size="14">mdi-square-outline</v-icon>
          </v-btn>
          <v-btn text tile small width="46" height="32" @click="close" 
            class="close-app-btn" color="#d70000"> 
            <v-icon size="18">mdi-window-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <div class="video-player-container">
        <VlcPlayer ref="player" @nowPlaying="updateNowPlaying($event)"/>
      </div>
    </v-card>
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
    await this.$store.dispatch('getDb', 'performers')
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
      if (!fs.existsSync(path.join(this.pathToUserData, 'media/markers'))){
        fs.mkdirSync(path.join(this.pathToUserData, 'media/markers'))
      }
      // include ffmpeg
      ffmpeg.setFfmpegPath(path.join(this.pathToUserData, '/ffmpeg/ffmpeg.exe')) 
      ffmpeg.setFfprobePath(path.join(this.pathToUserData, '/ffmpeg/ffprobe.exe'))
    })
  },
  beforeDestroy() {
    // if (this.player) {
    //   this.player.dispose()
    // }
    win.removeAllListeners()
  },
  data: () => ({
    playlist: [],
    playIndex: 0,
    videoWidth: 480,
    videoHeight: 320,
    fps: null,
    resolution: null,
    codec: null,
    bitrate: null,
    isVideoAvailable: true,
    imgThumbLoading: null,
    dialogFileInfo: false,
    dialogEditThumb: false,
    uploadedImage: null,
    player: null,
    maximized: win.isMaximized(),
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
    // tagsAll() {
    //   if (this.tagsDb === null) return []
    //   return _.filter(this.tagsDb, t=>(t.category.includes('video')))
    // },
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
    handleFile(imgType) {
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images.main.display = true
      this.images.main.file = imgBase64
    },
    // async getMarkers() {
    //   // console.log('get markers')
    //   // console.log(this.video)
    //   await this.$store.dispatch('getDb', 'markers')
    //   let video = this.videos[this.playIndex]
    //   let markers = _.filter(this.markersDb, marker=>marker.videoId == video.id)
    //   this.markers = _.orderBy(markers, 'time', ['asc'])
    //   // create time
    //   for (let i=0; i<markers.length; i++) {
    //     let specificTime = new Date(1000*markers[i].time).toISOString().substr(11, 8)
    //     let imgPath = path.join(this.pathToUserData, `/media/markers/${markers[i].id}.jpg`)
    //     if (fs.existsSync(imgPath)) continue
    //     this.createMarkerThumb(specificTime, video.path, imgPath)
    //       .then(result => {
    //         console.log('thumb created')
    //       })
    //       .catch(error => {
    //         console.log(error)
    //       })
    //   }
    // },
    // getMarkerImgUrl(markerId) {
    //   let imgPath = path.join(this.pathToUserData, `/media/markers/${markerId}.jpg`)
    //   return this.checkMarkerImageExist(imgPath)
    // },
    // checkMarkerImageExist(imgPath) {
    //   if (fs.existsSync(imgPath)) {
    //     return imgPath
    //   } else {
    //     return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
    //   }
    // },
    // createMarkerThumb(timestamp, inputPath, outputPath) {
    //   return new Promise((resolve, reject) => {
    //     ffmpeg()
    //       .addOption('-ss', timestamp)
    //       .addOption('-i', inputPath)
    //       .addOption('-frames:v', '1')
    //       .addOption('-vf','scale=320:-1')
    //       .save(outputPath)
    //       .on('end', function(e) {
    //         resolve(e)
    //       })
    //       .on('error', function(e) {
    //         reject(e)
    //       })
    //   })
    // },
    // VIDEOFILE
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
    // filterItemsTags(item, queryText, itemText) {
    //   const searchText = queryText.toLowerCase()
    //   const alternateNames = item.altNames
    //   let found = false
    //   for (let i=0;i<alternateNames.length;i++) {
    //     if (alternateNames[i].toLowerCase().indexOf(searchText) > -1) found = true
    //   }
    //   if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
    //   return found
    // },
    getFileNameFromPath(videoPath) {
      return videoPath.split("\\").pop().split('.').slice(0, -1).join('.')
    },
    watchLater() {
      ipcRenderer.send('watchLater', this.video.id)
      this.$store.dispatch('getDb', 'playlists')
    },
    // PLAYER
    // play(number) {
    //   this.playIndex = number
    //   this.getMarkers()
    // },
    // next() {
    //   this.playIndex = this.playIndex + 1
    //   this.selectedVideo = this.selectedVideo + 1
    //   this.getMarkers()
    // },
    // prev() {
    //   this.playIndex = this.playIndex - 1
    //   this.selectedVideo = this.selectedVideo - 1
    //   this.getMarkers()
    // },
    // jumpTo(time) {
    //   if (this.markerPlayable) {
    //     let specificTime = new Date(1000*time).toISOString().substr(11, 8)
    //     let mpcPath = this.$store.state.settingsDb.pathToSystemPlayer
    //     spawn(`${mpcPath}`, [`${this.video.path}`, '/startpos', specificTime])
    //   } else {
    //     this.$refs.player.jumpTo(time)
    //   }
    // },
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
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .title-bar {
    padding: 0;
    padding-right: 108px !important;
    position: relative;
    z-index: 5;
    min-height: 32px;
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
  display: flex;
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

