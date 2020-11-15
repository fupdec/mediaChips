<template>
	<div>
		<v-dialog v-model="$store.state.Videos.dialogDeleteVideo" scrollable persistent max-width="800">
      <v-card>
        <v-card-title class="title">
          Are you sure?
          <v-spacer></v-spacer>
          <v-checkbox class="ma-0" v-model="$store.state.Videos.deleteFile" 
            hide-details label="Also delete file" />
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete-alert</v-icon>
        </v-card-title>
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
          <v-btn color="red" class="ma-4" dark @click="deleteVideos">Yes, delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.Videos.dialogCreatePreview" scrollable persistent max-width="800">
      <v-card :loading="createPreviewLoading" loader-height="6">
        <v-card-title class="title">Create preview
          <v-spacer></v-spacer>
          <v-icon>mdi-filmstrip</v-icon>
        </v-card-title>
        <v-card-actions v-if="createPreviewStarted">
          <v-progress-linear
            v-model="createPreviewProgress" height="20" rounded 
            class="my-2 progress-striped" :class="{active: createPreviewLoading}"
          > <template v-slot="{ value }">
              <strong class="process-percents">{{ Math.ceil(value) }}%</strong>
            </template>
          </v-progress-linear>
          <v-row>
            <v-col class="caption py-0">
            Current file: {{currentFileInProgress}}
            </v-col>
            <v-col class="caption text-right py-0">
            previews created: {{currentNumberOfScanVideos}} / {{totalNumberOfScanVideos}}
            </v-col>
          </v-row>
        </v-card-actions>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div class="body-1">Video<span v-if="selectedVideosLength>1">s
              ({{selectedVideosLength}})</span>
            </div>
            {{selectedVideos(true)}}
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-radio-group 
            v-model="previewQuality" :disabled="createPreviewLoading" 
            class="mx-4" row dense label="Quality:"
            hint="The creation process takes from one to several minutes 
            depending on the file size and the selected quality.
            The heavy load on the CPU is possible." persistent-hint
          >
            <v-radio label="Worse" value="100"></v-radio>
            <v-radio label="Low" value="160"></v-radio>
            <v-radio label="Medium" value="220"></v-radio>
            <v-radio label="High" value="280"></v-radio>
            <v-radio label="Ultra" value="340"></v-radio>
          </v-radio-group>
        </v-card-actions>
        <v-card-actions>
          <v-btn class="ma-4" :disabled="createPreviewLoading"
            @click="closeDialogCreatePreview">Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" class="ma-4" :disabled="createPreviewLoading"
            @click="createPreviewForVideo">Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="$store.state.Videos.dialogEditVideoInfo"><DialogEditVideoInfo /></div>

    <v-menu v-model="$store.state.Videos.menuCard" :position-x="$store.state.x" leave-absolute
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item  class="pr-1" link @mouseup="addNewTab" :disabled="!isSelectedSingleVideo">
          <v-list-item-title>
            <v-icon left size="18">mdi-tab-plus</v-icon> Open in a new tab
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
        <v-list-item class="pr-1" link @mouseup="$store.state.Videos.dialogCreatePreview = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-filmstrip</v-icon> Create Preview
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
<!-- TODO: add function of parsing path for performer, tags, website  -->
        <v-divider class="ma-1"></v-divider>

        <v-list-item class="pr-1" link @mouseup="$store.state.Videos.dialogEditVideoInfo = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-movie-edit</v-icon> Edit Info
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
                <v-icon left size="18">mdi-star-off</v-icon> Clear rating 
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
                <v-icon left size="18">mdi-heart-plus</v-icon> Add to favorite 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeFromFavorite">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart-remove</v-icon> Remove from favorite 
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
                <v-icon left size="18">mdi-account-multiple-outline</v-icon>Copy performers 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="addPerformers" :disabled="isPerformersClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-account-plus</v-icon>Add performers 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="replacePerformers" :disabled="isPerformersClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-account-multiple</v-icon>Replace performers 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removePerformers" :disabled="isPerformersClipboardEmpty">
              <v-list-item-title>
                <v-icon left size="18">mdi-account-remove</v-icon>Remove all performers
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
                <v-icon left size="18">mdi-tag-multiple-outline</v-icon>Copy tags 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="addTags" :disabled="isTagsClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-tag-plus</v-icon>Add tags 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="replaceTags" :disabled="isTagsClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-tag-multiple</v-icon>Replace tags 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeTags" :disabled="isTagsClipboardEmpty">
              <v-list-item-title>
                <v-icon left size="18">mdi-tag-remove</v-icon>Remove all tags
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-web</v-icon> Website
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link @mouseup="copyWebsite" :disabled="!isSelectedSingleVideo">
              <v-list-item-title> 
                <v-icon left size="18">mdi-content-copy</v-icon>Copy website 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="addWebsite" :disabled="isWebsiteClipboardEmpty">
              <v-list-item-title> 
                <v-icon left size="18">mdi-content-paste</v-icon>Paste website 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeWebsite" :disabled="isWebsiteClipboardEmpty">
              <v-list-item-title>
                <v-icon left size="18">mdi-delete</v-icon>Remove website
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="ma-1"></v-divider>
        <v-list-item link @mouseup="copyVideoPathToClipboard">
          <v-list-item-title>
            <v-icon left size="18">mdi-clipboard-text</v-icon> Copy video path
          </v-list-item-title>
        </v-list-item>
        <v-list-item link @mouseup="copyVideoNameToClipboard">
          <v-list-item-title>
            <v-icon left size="18">mdi-clipboard-list</v-icon> Copy video name
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        
        <v-list-item class="pr-1" link @mouseup="$store.state.Videos.dialogDeleteVideo = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-delete</v-icon> Delete video
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
	</div>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shell = require('electron').shell
import Selection from "@simonwep/selection-js"
import createPreview from '@/components/pages/videos/CreatePreview'
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
    previewQuality: '160',
    currentFileInProgress: '',
    createPreviewLoading: false,
    createPreviewStarted: false,
    createPreviewProgress: 0,
    currentNumberOfScanVideos: 0,
    totalNumberOfScanVideos: 0,
    performersClipboard: [],
    tagsClipboard: [],
    websiteClipboard: '',
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
    isWebsiteClipboardEmpty() {
      return this.websiteClipboard.length === ''
    },
  },
  methods: {
    addNewTab() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      let tab = { 
        name: this.selectedVideos, 
        link: `/video/:${videoId}`,
        id: videoId,
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
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
    closeDialogCreatePreview(){
      this.$store.state.Videos.dialogCreatePreview = false
      this.createPreviewLoading = false
    },
    createPreviewForVideo() {
      this.createPreviewLoading = true
      this.createPreviewStarted = true
      this.createPreviewProgress = 0
      this.currentNumberOfScanVideos = 0
      this.totalNumberOfScanVideos = 0
      // console.log(file, fileId)

      const vm = this

      async function processArray(files) {
        let percentsPerFile = 100/files.length 
        vm.totalNumberOfScanVideos = files.length
        // console.log(percentsPerFile)
        for (const fileId of files) {
          let file = vm.$store.getters.videos.find({id:fileId}).value().path
          vm.currentFileInProgress=file.split('\\').pop().split('.').slice(0,-1).join('.')
          await createPreview(file, fileId, vm.previewQuality)
          ++vm.currentNumberOfScanVideos
          vm.createPreviewProgress += percentsPerFile
          if (vm.createPreviewProgress > 100) {
            vm.createPreviewProgress = 100
          }
        }
        vm.isVideoScanFinished = true
        console.log('Files scaned!')
      }

      const files = this.$store.getters.getSelectedVideos
      processArray(files).then(() => {
        vm.createPreviewLoading = false
        vm.$store.commit('updateVideos') //TODO: make smart update (only for videos in array)
      })
    },    
    revealInFileExplorer() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      let videoPath = this.$store.getters.videos.find({id:videoId}).value().path
      videoPath = path.parse(videoPath).dir
      shell.openItem(videoPath)
    },
    changeRating(stars) {
      console.log('rating changed: ' +stars)
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos
          .find({ id: videoId })
          .assign({ rating: stars })
          .write();
      })
      setTimeout(()=>{
        this.$store.state.Videos.rating = 0
      },1000)
      this.$store.commit('updateVideos')
    },
    clearRating() {
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos
          .find({ id: videoId })
          .assign({ rating: 0 })
          .write();
      })
      this.$store.commit('updateVideos')
    },
    addToFavorite() {
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos
          .find({ id: videoId })
          .assign({ favorite: true })
          .write();
      })
      this.$store.commit('updateVideos')
    },
    removeFromFavorite() {
      this.$store.state.Videos.selectedVideos.map(videoId => {
        this.$store.getters.videos
          .find({ id: videoId })
          .assign({ favorite: false })
          .write();
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
          vid.assign({performers:performers}).write()
        })
      }
    },
    replacePerformers() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({performers:this.performersClipboard}).write()
        })
      }
    },
    removePerformers() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({performers:[]}).write()
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
          vid.assign({tags:tags}).write()
        })
      }
    },
    replaceTags() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({tags:this.tagsClipboard}).write()
        })
      }
    },
    removeTags() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({tags:[]}).write()
        })
      }
    },
    copyWebsite() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      this.websiteClipboard = this.$store.getters.videos.find({id:videoId}).value().website
    },
    addWebsite() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          let vid = vids.find({id:i})
          vid.assign({website:this.websiteClipboard}).write()
        })
      }
    },
    removeWebsite() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        ids.map(i => {
          vids.find({id:i}).assign({website:''}).write()
        })
      }
    },
    copyVideoPathToClipboard(){
      navigator.clipboard.writeText(this.selectedVideosPaths)
    },
    copyVideoNameToClipboard(){
      navigator.clipboard.writeText(this.selectedVideos)
    },
    deleteVideos() {
      this.previousSelection = []
      this.$store.dispatch('deleteVideos')
      this.$store.state.Videos.dialogDeleteVideo = false
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
</style>