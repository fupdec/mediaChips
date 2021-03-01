<template>
  <v-dialog v-model="$store.state.Videos.dialogEditVideoInfo" scrollable persistent max-width="1200">
    <v-card>
      <v-card-title class="edit-card-title">
        <v-img v-if="isSelectedSingleVideo" class="image-video"
          :src="getImg()" height="100%" max-width="160" max-height="84"
          gradient="to right, rgba(0,0,0,.0) 70%, #3d3d3d 100%" position="top">
          <v-btn @click="playVideo" class="button-play" dark outlined :disabled="!videoExists">
            <v-icon>mdi-play</v-icon>
          </v-btn>
        </v-img>
        <div class="ml-6">
          <div class="font-weight-regular headline body-1">
            Edit video{{isSelectedSingleVideo ? '':'s'}} info 
            <!-- TODO add help tooltip for understood how works writing when you edit multiple videos.
              for multiple videos new data not replaced old values, it just add new data. -->
          </div>
          <div v-if="isSelectedSingleVideo" class="font-weight-light headline body-1">
            {{fileName}}
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn class="mx-2 my-4" dark @click="close" outlined>Cancel</v-btn>
        <v-btn color="primary mx-2 my-4" @click="saveVideoInfo" :disabled="!valid"
        ><v-icon left>mdi-content-save-outline</v-icon>Save</v-btn>
      </v-card-title>
      <vuescroll>
        <v-card-text class="py-0">
          <v-form ref="form" v-model="valid">
            <v-container fluid>
              <v-row>
                <v-col cols="12" class="py-0 d-flex justify-space-between" v-if="isSelectedSingleVideo">
                  <v-chip label outlined>
                    <v-icon left size="20">mdi-calendar-plus</v-icon> Added: {{added}}
                  </v-chip>
                  <v-chip label outlined>
                    <v-icon left size="20">mdi-calendar-edit</v-icon> Last edit: {{edit}}
                  </v-chip>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <span class="caption mr-2">Sort list of performers by</span>
                    <v-btn-toggle v-model="sortButtonsPerformers" mandatory color="primary">
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
                          <v-btn small outlined value="rating" v-on="on">
                            <v-icon>mdi-star-outline</v-icon>
                          </v-btn>
                        </template>
                        <span>rating</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-btn small outlined value="date" v-on="on">
                            <v-icon>mdi-calendar-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>date added</span>
                      </v-tooltip>
                    </v-btn-toggle>
                  </v-card-actions>
                  <v-autocomplete :disabled="clearPerformers"
                    v-model="performers" outlined clearable
                    :items="performersAll" label="Performers"
                    item-text="name" class="hidden-close"
                    item-value="name" no-data-text="No more performers"
                    multiple hide-selected hide-details
                    @blur="sort('performers')" prepend-icon="mdi-account-outline"
                    :menu-props="{contentClass:'list-with-preview'}"
                    :filter="filterItemsPerformers"
                  >
                    <template v-slot:selection="data">
                      <v-chip v-bind="data.attrs" close close-icon="mdi-close"
                        :input-value="data.selected" label class="px-2"
                        @click="data.select" @click:close="removeItem(data.item, 'performers')"
                        @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > <span> <v-icon v-if="data.item.favorite" small color="pink">
                        mdi-heart </v-icon> {{ data.item.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <div class="list-item"
                        @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > 
                        <v-icon 
                          left size="14" 
                          :color="data.item.favorite===false ? 'grey' : 'pink'"
                        >
                          mdi-heart
                        </v-icon>
                        <v-rating 
                          class="rating-inline small mr-2"
                          v-model="data.item.rating"
                          color="yellow darken-3"
                          background-color="grey darken-1"
                          empty-icon="$ratingFull" 
                          half-icon="mdi-star-half-full"
                          dense half-increments readonly size="12"
                        />
                        <span>{{data.item.name}}</span>
                        <span v-if="data.item.aliases.length" class="aliases"> 
                          aka {{data.item.aliases.join(', ').slice(0,50)}}
                        </span>
                      </div>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
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
                            <v-icon>mdi-calendar-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>date added</span>
                      </v-tooltip>
                    </v-btn-toggle>
                  </v-card-actions>
                  <v-autocomplete :disabled="clearTags"
                    v-model="tags" outlined clearable
                    :items="tagsAll" label="Tags"
                    item-text="name" class="hidden-close"
                    item-value="name" no-data-text="No more tags"
                    multiple hide-selected hide-details
                    @blur="sort('tags')" prepend-icon="mdi-tag-outline"
                    :menu-props="{contentClass:'list-with-preview'}"
                    :filter="filterItemsTags"
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs" close
                        :input-value="data.selected" 
                        @click="data.select" text-color="white"
                        @click:close="removeItem(data.item, 'tags')" close-icon="mdi-close"
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
                </v-col>
                <v-col cols="12" md="6">
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <span class="caption mr-2">Sort list of websites by</span>
                    <v-btn-toggle v-model="sortButtonsWebsites" mandatory color="primary">
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
                            <v-icon>mdi-calendar-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>date added</span>
                      </v-tooltip>
                    </v-btn-toggle>
                  </v-card-actions>
                  <v-autocomplete :disabled="clearWebsites"
                    v-model="websites" outlined clearable
                    :items="websitesAll" label="Websites" prepend-icon="mdi-web"
                    item-text="name" class="mt-0 hidden-close" 
                    item-value="name" multiple hide-selected hide-details
                    no-data-text="No more websites"
                    :menu-props="{contentClass:'list-with-preview'}"
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs" label close close-icon="mdi-close"
                        @click="data.select" @click:close="removeItem(data.item, 'websites')" 
                        @mouseover.stop="showImage($event, data.item.id, 'website')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                        :input-value="data.selected" 
                        :color="data.item.color" text-color="white"
                      > <span>{{ data.item.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <div class="list-item"
                        @mouseover.stop="showImage($event, data.item.id, 'website')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > <v-icon :color="data.item.favorite===false ? 'grey':'pink'"
                          left size="14"> mdi-heart </v-icon>
                        <v-icon left size="16" :color="data.item.color"> mdi-web </v-icon>
                        {{data.item.name}}
                      </div>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="8" md="4" align="center" justify="center">
                  <div class="overline mb-3">Rating</div>
                  <v-rating style="display:inline-flex;" :readonly="clearRating"
                    v-model="rating" clearable :disabled="clearRating"
                    color="yellow darken-2"
                    background-color="grey"
                    empty-icon="mdi-star-outline"
                    half-icon="mdi-star-half-full"
                    half-increments hover size="36"
                  ></v-rating>
                </v-col>
                <v-col cols="4" md="2" align="center" justify="center">
                  <div class="overline mb-3">Favorite</div>
                  <v-btn @click="favorite=!favorite" :disabled="clearFavorite"
                    :color="favorite===false ? 'white' : 'pink'" icon x-large 
                  > <v-icon size="36" v-if="favorite===false" color="grey">mdi-heart-outline</v-icon>
                    <v-icon size="36" v-else color="pink">mdi-heart</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="12" class="mt-6 py-0" v-if="!isSelectedSingleVideo">
                  <div class="overline text-center">Clear Information</div>
                  <div cols="12" class="d-flex justify-space-between">
                    <v-switch inset v-model="clearPerformers" color="red">
                      <template v-slot:label>
                        <span v-if="clearPerformers" class="red--text">
                          <v-icon left color="red">mdi-account-outline</v-icon> Performers
                        </span>
                        <span v-else>
                          <v-icon left>mdi-account-outline</v-icon> Performers
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearTags" color="red">
                      <template v-slot:label>
                        <span v-if="clearTags" class="red--text">
                          <v-icon left color="red">mdi-tag-outline</v-icon> Tags
                        </span>
                        <span v-else>
                          <v-icon left>mdi-tag-outline</v-icon> Tags
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearWebsites" color="red">
                      <template v-slot:label>
                        <span v-if="clearWebsites" class="red--text">
                          <v-icon left color="red">mdi-web</v-icon> Websites
                        </span>
                        <span v-else>
                          <v-icon left>mdi-web</v-icon> Websites
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearRating" color="red">
                      <template v-slot:label>
                        <span v-if="clearRating" class="red--text">
                          <v-icon left color="red">mdi-star-outline</v-icon> Rating
                        </span>
                        <span v-else>
                          <v-icon left>mdi-star-outline</v-icon> Rating
                        </span>
                      </template>
                    </v-switch>
                    <v-switch inset v-model="clearFavorite" color="red">
                      <template v-slot:label>
                        <span v-if="clearFavorite" class="red--text">
                          <v-icon left color="red">mdi-heart-outline</v-icon> Favorite
                        </span>
                        <span v-else>
                          <v-icon left>mdi-heart-outline</v-icon> Favorite
                        </span>
                      </template>
                    </v-switch>
                  </div>
                </v-col>
                <v-col cols="12" v-if="isSelectedSingleVideo">
                  <div class="overline text-center mb-4">Bookmark</div>
                  <v-textarea clearable auto-grow outlined placeholder="Write bookmark text here" 
                    v-model="$store.state.Bookmarks.bookmarkText" hide-details />
                </v-col>
                <v-col cols="12" v-if="isSelectedSingleVideo">
                  <div class="overline mb-4 edit-path-title">
                    <span>Path</span>
                    <v-checkbox v-model="pathEditable" hide-details class="edit-path-chkbx"
                    off-icon="mdi-pencil-off" on-icon="mdi-pencil"/>
                  </div>
                  <v-text-field 
                    v-model="pathToFile" :rules="[getPathRules]" :disabled="!pathEditable"
                    outlined placeholder="Write file path here" label="File path" />
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shortid = require('shortid')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import { ipcRenderer } from 'electron'

export default {
  name: "DialogEditPerformer",
  components: {
    vuescroll,
  },
  mixins: [ShowImageFunction],
  mounted () {
    this.$nextTick(function () {
      // get info of video
      if (this.isSelectedSingleVideo) {
        let video = _.cloneDeep(this.video)
        this.performers = video.performers.sort()
        this.tags = video.tags.sort()
        this.websites = video.websites
        this.rating = video.rating
        this.favorite = video.favorite

        // get bookmark text
        if (video) {
          if (video.bookmark) {
            let text = this.$store.getters.bookmarks.get('videos').find({itemId:video.id}).value().text
            this.$store.state.Bookmarks.bookmarkText = text
          }
        }
        this.pathToFile = video.path

        // get date added and date of last edit text
        let dateAdded = new Date(video.date)
        this.added = dateAdded.toLocaleDateString() + ' ' + dateAdded.toLocaleTimeString()
        let dateEdit = new Date(video.edit)
        this.edit = dateEdit.toLocaleDateString() + ' ' + dateEdit.toLocaleTimeString()
      }
    })
  },
  data: () => ({
    valid: false,
    performers: [],
    tags: [],
    websites: [],
    rating: 0,
    favorite: false,
    clearPerformers: false,
    clearTags: false,
    clearWebsites: false,
    clearRating: false,
    clearFavorite: false,
    pathToFile: '',
    pathEditable: false,
    videoExists: true,
    edit: '',
    added: '',
  }),
  computed: {
    isSelectedSingleVideo() {
      return this.$store.getters.getSelectedVideos.length == 1
    },
    video() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      return this.$store.getters.videos.find({id:videoId}).value()
    },
    fileName() {
      let filename = this.video.path.split("\\").pop()
      return filename.split('.').slice(0, -1).join('.')
    },
    performersAll() {
      return this.sortItems(this.$store.getters.performers, 'Performers')
    },
    sortButtonsPerformers: {
      get() {
        return this.$store.state.Settings.videoEditPerformersSortBy
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'videoEditPerformersSortBy', value})
      },
    },
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.type.includes('video')))
      return this.sortItems(tags, 'Tags')
    },
    sortButtonsTags: {
      get() {
        return this.$store.state.Settings.videoEditTagsSortBy
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'videoEditTagsSortBy', value})
      },
    },
    websitesAll() {
      return this.sortItems(this.$store.getters.websites, 'Websites')
    },
    sortButtonsWebsites: {
      get() {
        return this.$store.state.Settings.videoEditWebsitesSortBy
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'videoEditWebsitesSortBy', value})
      },
    },
  },
  methods: {
    sortItems(items, type) {
      const sortBy = this[`sortButtons${type}`]
      let itemsSorted = items.orderBy(i=>(i.name.toLowerCase()),['asc'])
      if (sortBy !== 'name') {
        itemsSorted = itemsSorted.orderBy(i=>(i[sortBy]),['desc']).value()
        return itemsSorted
      } else return itemsSorted.value()
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
    close() {
      this.$store.state.Videos.dialogEditVideoInfo = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    validate () {
      this.$refs.form.validate()
    },
    saveVideoInfo() {
      this.validate()
      if (this.valid === false) {
        return false
      }
      let videos = this.$store.getters.getSelectedVideos
      videos.map(videoId => {
        let video = _.cloneDeep(this.$store.getters.videos.find({ id: videoId }).value())
        let newPerformers, newTags, newWebsites, newRating, newFavorite, newBookmark, newPath

        if (this.clearPerformers) {
          newPerformers = []
        } else if (!this.isSelectedSingleVideo) {
          newPerformers = _.union(this.performers, video.performers).sort()
        } else if (this.isSelectedSingleVideo) {
          newPerformers = this.performers
        }

        if (this.clearTags) {
          newTags = []
        } else if (!this.isSelectedSingleVideo) {
          newTags = _.union(this.tags, video.tags).sort()
        } else if (this.isSelectedSingleVideo) {
          newTags = this.tags
        }

        if (this.clearWebsite) {
          newWebsites = []
        } else if (!this.isSelectedSingleVideo) {
          newWebsites = _.union(this.websites, video.websites).sort()
        } else if (this.isSelectedSingleVideo) {
          newWebsites = this.websites
        }

        if (this.clearRating) {
          newRating = 0
        } else if (this.rating == 0 && !this.isSelectedSingleVideo) {
          newRating = video.rating
        } else {
          newRating = this.rating
        }
        
        if (this.clearFavorite) {
          newFavorite = false
        } else if (this.favorite == false && !this.isSelectedSingleVideo) {
          newFavorite = video.favorite
        } else {
          newFavorite = this.favorite
        }
        
        if (this.$store.state.Bookmarks.bookmarkText) {
          let bookmark = this.$store.getters.bookmarks.get('videos').find({itemId:videoId})
          newBookmark = true
          if (bookmark.value()) {
            bookmark.assign({ 
              text: this.$store.state.Bookmarks.bookmarkText,
              date: Date.now(),
            }).write()
          } else {
            this.$store.getters.bookmarks.get('videos').push({
              id: shortid.generate(),
              itemId: videoId,
              text: this.$store.state.Bookmarks.bookmarkText,
              date: Date.now(),
            }).write()
          }
        } else {
          this.$store.getters.bookmarks.get('videos').remove({'itemId':videoId}).write()
          newBookmark = false
        }

        if (this.pathToFile && this.pathEditable) {
          newPath = this.pathToFile
          setTimeout(() => {this.$store.state.updateFoldersData = Date.now()}, 1000)
        } else {
          newPath = video.path
        }

        this.$store.getters.videos.find({ id: videoId }).assign({ 
          performers: newPerformers,
          tags: newTags,
          websites: newWebsites,
          rating: newRating,
          favorite: newFavorite,
          bookmark: newBookmark,
          path: newPath,
          edit: Date.now(),
        }).write()
        this.$store.commit('updateVideos')
        this.$store.dispatch('filterVideos', true)
      })
      this.$store.state.Videos.dialogEditVideoInfo = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    getPathRules(stringPath) {
      if (stringPath.length===0) {
        return 'Path is required'
      } else {
        return true
      }
    },
    getImg() {
      let imgPath = path.join(this.$store.getters.getPathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.$store.getters.getPathToUserData, '/img/templates/thumb.jpg')
      }
    },
    getTag(tagName) {
      return this.$store.getters.tags.find({name:tagName}).value()
    },
    removeItem(item, type) { 
      const index = this[type].indexOf(item.name)
      if (index >= 0) this[type].splice(index, 1)
    },
    sort(items) {
      this[items] = this[items].sort((a, b) => a.localeCompare(b))
    },
    playVideo() {
      const pathToVideo = this.video.path
      if (fs.existsSync(pathToVideo)) {
        this.videoExists = false
        if (this.$store.state.Settings.playerType === '0') {
          let data = {
            videos: [this.video],
            id: this.video.id,  
          }
          ipcRenderer.send('openPlayer', data)
        } else shell.openPath(pathToVideo)
        setTimeout(() => { this.videoExists = true }, 1500)
      } else this.videoExists = false
    },
  },
  watch: {
    clearRating(newValue) {
      if (newValue) {
        this.rating = 0
      }
    },
    rating(newValue) {
      if (newValue>0) {
        this.clearRating = false
      }
    },
  },
}
</script>


<style lang="less">
.rating-favorite {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.edit-path-title {
  display: flex;
  justify-content: center;
}
.edit-path-chkbx {
  display: inline-flex;
  margin-top: 0;
  margin-left: 20px;
}
.image-video {
  .v-responsive__content {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .button-play {
    opacity: 0;
  }
  &:hover {
    .button-play {
      opacity: 1;
    }
  }
}
</style> 