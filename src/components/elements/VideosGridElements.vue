<template>
	<div>
		<v-dialog v-model="$store.state.Videos.dialogDeleteVideo" scrollable persistent max-width="800">
      <v-card>
        <v-card-title class="headline py-2 red--text">
          Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red" class="ml-6">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>
              You want to delete video<span v-if="selectedVideosLength>1">s
              ({{selectedVideosLength}})</span>
            </div> {{selectedVideos(true)}}
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn @click="$store.state.Videos.dialogDeleteVideo=false" class="ma-4">
            No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-checkbox v-model="$store.state.Videos.deleteFile" 
            class="mt-0 mr-6 mb-2" color="red" hide-details>
            <template v-slot:label>
              <span class="red--text">Also delete files</span>
            </template>
          </v-checkbox>
          <v-btn color="red" class="ma-4" dark @click="deleteVideos">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
		<v-dialog v-model="$store.state.Videos.dialogErrorPlayVideo" scrollable persistent max-width="800">
      <v-card>
        <v-card-title class="headline py-2 red--text">Error play video
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-alert-circle</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text>
            The file on this path does not exist
            <br>{{$store.state.Videos.errorPlayVideoPath}}
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.Videos.dialogErrorPlayVideo=false" class="ma-4">OK</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="$store.state.Videos.dialogEditVideoInfo"><DialogEditVideoInfo /></div>

    <v-dialog v-model="dialogAddToPlaylist" max-width="420">
      <v-card class="add-playlist">
        <v-card-title class="headline py-1">Add to Playlist
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
    </v-dialog>

    <v-menu v-model="$store.state.Videos.menuCard" :position-x="$store.state.x" leave-absolute
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item  class="pr-1" link @mouseup="dialogAddToPlaylist=true">
          <v-list-item-title>
            <v-icon left size="18">mdi-playlist-plus</v-icon> Add to Playlist
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <!-- TODO create menu with playlists and place into it button "Watch later" -->

        <v-list-item  class="pr-1" link @mouseup="watchLater">
          <v-list-item-title>
            <v-icon left size="18">mdi-bookmark-plus</v-icon> Add to "Watch later"
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>

        <v-divider class="ma-1"></v-divider>

        <v-list-item class="pr-1" :disabled="!isSelectedSingleVideo"
          link @mouseup="revealInFileExplorer">
          <v-list-item-title>
            <v-icon left size="18">mdi-folder-open</v-icon> Reveal in File Explorer
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
<!-- TODO: add function of parsing path for performer, tags, websites  -->
        <v-divider class="ma-1"></v-divider>

        <v-list-item class="pr-1" link @mouseup="$store.state.Videos.dialogEditVideoInfo = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-pencil</v-icon> Edit Info
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-star</v-icon> Rating 
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link>
              <v-rating
                v-model="$store.state.Videos.rating"
                color="yellow darken-3"
                background-color="grey darken-1"
                empty-icon="$ratingFull"
                half-icon="mdi-star-half-full"
                dense half-increments hover size="18"
                @input="changeRating($event)"
              ></v-rating>
            </v-list-item>
            <v-list-item link @mouseup="clearRating">
              <v-list-item-title> 
                <v-icon left size="18">mdi-star-off</v-icon> Clear Rating 
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart</v-icon> Favorite
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link @mouseup="addToFavorite">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart-plus</v-icon> Add to Favorite 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeFromFavorite">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart-remove</v-icon> Remove from Favorite 
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-account</v-icon>Performers
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link @mouseup="copyPerformers" :disabled="!isSelectedSingleVideo">
              <v-list-item-title> 
                <v-icon left size="18">mdi-account-multiple-outline</v-icon>Copy Performers 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="addPerformers" :disabled="isPerformersClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-account-plus</v-icon>Add Performers 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="replacePerformers" :disabled="isPerformersClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-account-multiple</v-icon>Replace Performers 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removePerformers">
              <v-list-item-title>
                <v-icon left size="18" color="red">mdi-account-remove</v-icon>Remove all Performers
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-tag</v-icon> Tags
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link @mouseup="copyTags" :disabled="!isSelectedSingleVideo">
              <v-list-item-title> 
                <v-icon left size="18">mdi-tag-multiple-outline</v-icon>Copy Tags 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="addTags" :disabled="isTagsClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-tag-plus</v-icon>Add Tags 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="replaceTags" :disabled="isTagsClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-tag-multiple</v-icon>Replace Tags 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeTags">
              <v-list-item-title>
                <v-icon left size="18" color="red">mdi-tag-remove</v-icon>Remove all Tags
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-web</v-icon> Websites
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link @mouseup="copyWebsites" :disabled="!isSelectedSingleVideo">
              <v-list-item-title> 
                <v-icon left size="18">mdi-content-copy</v-icon>Copy Websites 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="addWebsites" :disabled="isWebsitesClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-content-paste</v-icon>Paste Websites
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="replaceWebsites" :disabled="isWebsitesClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-content-paste</v-icon>Replace Websites 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeWebsites">
              <v-list-item-title>
                <v-icon left size="18" color="red">mdi-delete</v-icon>Remove Websites
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="ma-1"></v-divider>
        
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-clipboard-text</v-icon> Copy To Clipboard 
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link @mouseup="copyVideoPathToClipboard">
              <v-list-item-title> 
                <v-icon left size="18">mdi-file-find</v-icon> Video Path 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="copyVideoNameToClipboard">
              <v-list-item-title> 
                <v-icon left size="18">mdi-alphabetical-variant</v-icon> Video Name
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        
        <v-divider class="ma-1"></v-divider>
        
        <v-list-item class="pr-1" link @mouseup="$store.state.Videos.dialogDeleteVideo = true">
          <v-list-item-title>
            <v-icon left size="18" color="red">mdi-delete</v-icon> Delete video
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
	</div>
</template>


<script>
const shell = require('electron').shell
import Selection from "@simonwep/selection-js"
import vuescroll from 'vuescroll'

export default {
  name: 'VideosGridElements',
  components: {
    vuescroll,
    DialogEditVideoInfo: () => import('@/components/pages/videos/DialogEditVideoInfo.vue'),
  },
  mounted() {
    this.$nextTick(function () {
			this.$store.state.Videos.selection = Selection.create({
        boundaries: ['.videos-grid'],
        selectables: ['.video-card'],
      }).on('beforestart', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.video-card')
        if (oe.button === 2 && selected.includes(targetEl)) {
          return false
        }
        return (oe.button !== 1);
      }).on('start', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.video-card')
        if (oe.button === 2 && selected.includes(targetEl)) {
          return false
        }
        // Remove class if the user isn't pressing the shift or control or ⌘ keys
        if (!oe.shiftKey && !oe.ctrlKey && !oe.metaKey) {
          // Unselect all elements
          for (const el of selected) {
            el.classList.remove('selected')
            inst.removeFromSelection(el)
          }
          // Clear previous selection
          inst.clearSelection()
        }
      }).on('move', ({changed: {removed, added}, inst, selected, oe}) => {
        // Add a custom class to the elements that where selected.
        for (const el of added) {
          el.classList.add('selected')
        }
        // Remove the class from elements that where removed
        // since the last selection
        for (const el of removed) {
          el.classList.remove('selected')
        }
      }).on('stop', ({inst, selected, oe}) => {
        // if pressed shift or ctrl or meta
        if (oe.shiftKey || oe.ctrlKey || oe.metaKey) {
          // cards without duplicates
          let mergedCards = _.union(this.previousSelection, selected)
          // console.log(`mergedCards: ${mergedCards.map(item => (item.dataset.id))}`)

          // get duplicates in selection
          let duplicates = _.filter(selected, (v, i, it) => { return _.find(it, v, i + 1) })
          // console.log(`duplicates: ${duplicates.map(item => (item.dataset.id))}`)

          // remove duplicated from selection
          duplicates.map(itemDuplicated=>{
            mergedCards = _.reject(mergedCards, itemDuplicated)
          })
          // inst.removeFromSelection(duplicates)

          selected = mergedCards
          this.previousSelection = mergedCards
          
          for (const el of duplicates) {
            inst.removeFromSelection(el)
          }
          // console.log(`previousSelection: ${mergedCards.map(item => (item.dataset.id))}`)
        } 
        inst.keepSelection()
        this.getSelectedVideos(selected)
        let cards = document.querySelectorAll('.videos-grid .video-card')
        for (let i=0;i<cards.length;++i) {
          cards[i].classList.remove("selected")
          void cards[i].offsetWidth
        }
        for (let i=0;i<selected.length;++i) {
          selected[i].classList.add("selected")
        }
        // console.log(`selected: ${selected.map(item => (item.dataset.id))}`)
        // console.log(this.$store.getters.getSelectedVideos)
      })
    })
  },
  destroyed() {
    this.$store.state.Videos.selection.destroy()
  },
  data: () => ({
    previousSelection: [],
    performersClipboard: [],
    tagsClipboard: [],
    websitesClipboard: [],
    dialogAddToPlaylist: false,
    selectedPlaylist: null,
  }),
  computed: {
    selectedVideosLength() {
      return this.$store.getters.getSelectedVideos.length
		},
    selectedVideosPaths() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        let paths = ids.map(i => (vids.find({id:i}).value().path))
        return paths.join(', ')
      } else return ''
    },
    isSelectedSingleVideo() {
      return this.$store.getters.getSelectedVideos.length == 1
    },
    isPerformersClipboardEmpty() {
      return this.performersClipboard.length == 0
    },
    isTagsClipboardEmpty() {
      return this.tagsClipboard.length == 0
    },
    isWebsitesClipboardEmpty() {
      return this.websitesClipboard.length == 0
    },
    playlists() {
      return this.$store.getters.playlists.filter(list=>(list.name!='Watch later')).value()
    },
  },
  methods: {
		selectedVideos(list) {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        let paths = ids.map(i => {
          let filename = vids.find({id:i}).value().path.split("\\").pop()
          return filename.split('.').slice(0, -1).join('.')
        })
        if (list) {
          return paths.map((v,i) => (`${i+1}) ${v}`)).join('\r\n')
        } else {
          return paths.join(', ')
        }
      } else return ''
    },
    getSelectedVideos(selectedVideos){
      let ids = selectedVideos.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedVideos', ids)
    },
    revealInFileExplorer() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      let videoPath = this.$store.getters.videos.find({id:videoId}).value().path
      shell.showItemInFolder(videoPath)
    },
    changeRating(stars) {
      console.log('rating changed: ' +stars)
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos.find({ id: videoId }).assign({ 
          rating: stars,
          edit: Date.now(),
        }).write()
      })
      setTimeout(()=>{
        this.$store.state.Videos.rating = 0
      },1000)
      this.$store.commit('updateVideos')
    },
    clearRating() {
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos.find({ id: videoId }).assign({ 
          rating: 0,
          edit: Date.now(),
        }).write()
      })
      this.$store.commit('updateVideos')
    },
    addToFavorite() {
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos.find({ id: videoId }).assign({
          favorite: true,
          edit: Date.now(),
        }).write()
      })
      this.$store.commit('updateVideos')
    },
    removeFromFavorite() {
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos.find({ id: videoId }).assign({ 
          favorite: false,
          edit: Date.now(),
        }).write()
      })
      this.$store.commit('updateVideos')
    },
    copyPerformers() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      this.performersClipboard = this.$store.getters.videos.find({id:videoId}).value().performers
    },
    addPerformers() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          let vid = vids.find({id:i})
          let performers = vid.value().performers
          performers = _.union(performers, this.performersClipboard).sort()
          vid.assign({performers:performers, edit:Date.now()}).write()
        })
      }
    },
    replacePerformers() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({performers: this.performersClipboard, edit:Date.now()}).write()
        })
      }
    },
    removePerformers() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({performers:[], edit:Date.now()}).write()
        })
      }
    },
    copyTags() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      this.tagsClipboard = this.$store.getters.videos.find({id:videoId}).value().tags
    },
    addTags() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          let vid = vids.find({id:i})
          let tags = vid.value().tags
          tags = _.union(tags, this.tagsClipboard).sort()
          vid.assign({tags:tags, edit:Date.now()}).write()
        })
      }
    },
    replaceTags() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({tags:this.tagsClipboard, edit:Date.now()}).write()
        })
      }
    },
    removeTags() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({tags:[], edit:Date.now()}).write()
        })
      }
    },
    copyWebsites() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      this.websitesClipboard = this.$store.getters.videos.find({id:videoId}).value().websites
    },
    addWebsites() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          let vid = vids.find({id:i})
          let websites = vid.value().websites
          websites = _.union(websites, this.websitesClipboard).sort()
          vid.assign({websites:websites, edit:Date.now()}).write()
        })
      }
    },
    replaceWebsites() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({websites:this.websitesClipboard, edit:Date.now()}).write()
        })
      }
    },
    removeWebsites() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({websites:[], edit:Date.now()}).write()
        })
      }
    },
    copyVideoPathToClipboard(){
      navigator.clipboard.writeText(this.selectedVideosPaths)
    },
    copyVideoNameToClipboard(){
      navigator.clipboard.writeText(this.selectedVideos())
    },
    deleteVideos() {
      this.previousSelection = []
      this.$store.dispatch('deleteVideos')
      this.$store.state.Videos.dialogDeleteVideo = false
    },
    addToPlaylist() {
      let id = this.playlists[this.selectedPlaylist].id
      let playlist = this.$store.getters.playlists.find({id: id}).value()
      let videosFromPlaylist = playlist.videos

      this.$store.getters.getSelectedVideos.map(videoId => {
        if (!videosFromPlaylist.includes(videoId)) { // if the video is not in the playlist 
          videosFromPlaylist.push(videoId)
        }
      })
      this.$store.getters.playlists.find({id: id}).assign({
        videos: videosFromPlaylist,
        edit: Date.now(),
      }).write()
      this.dialogAddToPlaylist = false
    },
    watchLater() {
      let playlist = this.$store.getters.playlists.find({name:'Watch later'}).value()
      let videosFromPlaylist = playlist.videos
      this.$store.getters.getSelectedVideos.map(videoId => {
        if (!videosFromPlaylist.includes(videoId)) { // if the video is not in the playlist 
          videosFromPlaylist.push(videoId)
        }
      })
      this.$store.getters.playlists.find({name:'Watch later'}).assign({
        videos: videosFromPlaylist,
        edit: Date.now(),
      }).write()
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.warning-note {
  font-size:0.55rem;
  line-height: 1;
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
</style>