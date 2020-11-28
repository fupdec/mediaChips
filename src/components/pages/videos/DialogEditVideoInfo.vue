<template>
  <v-dialog v-model="$store.state.Videos.dialogEditVideoInfo" scrollable persistent max-width="1600">
    <v-card>
      <v-card-title class="edit-card-title">
        <v-img v-if="isSelectedSingleVideo"
          :src="getImg()" :aspect-ratio="16/9" max-width="160" max-height="84"
          gradient="to right, rgba(0,0,0,.0) 70%, #3d3d3d 100%" position="top"
        />
        <div class="ml-6">
          <div class="font-weight-regular headline body-1">
            Edit video{{isSelectedSingleVideo ? '':'s'}} info
          </div>
          <div v-if="isSelectedSingleVideo" class="font-weight-light headline body-1">
            {{`"${fileName}"`}}
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn class="ma-4" dark @click="close" outlined>Cancel</v-btn>
        <v-btn color="primary ma-4" @click="saveVideoInfo" :disabled="!valid"
        ><v-icon left>mdi-content-save-outline</v-icon>Save</v-btn>
      </v-card-title>
      <vuescroll>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-container>
              <v-row>
                <v-col cols="12" class="pa-0">
                  <div class="overline text-center">Add Information</div>
                </v-col>
                <v-col cols="12" sm="6">
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
                            <v-icon>mdi-calendar-clock</v-icon>
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
                    @blur="sort('performers')" 
                    :menu-props="{contentClass:'list-with-preview'}"
                    :filter="filterItemsPerformers"
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs" close close-icon="mdi-close"
                        :input-value="data.selected"
                        @click="data.select" @click:close="removePerformer(data.item)"
                        @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                        :color="getPerformerColorDependsRating(data.item)"
                        :class="{'tag-with-favorite-performer': data.item.favorite}"
                      > <span>{{ data.item.name }}</span>
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
                <v-col cols="12" sm="6">
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
                  <v-autocomplete :disabled="clearTags"
                    v-model="tags" outlined clearable
                    :items="tagsAll" label="Tags"
                    item-text="name" class="hidden-close"
                    item-value="name" no-data-text="No more tags"
                    multiple hide-selected hide-details
                    @blur="sort('tags')"
                    :menu-props="{contentClass:'list-with-preview'}"
                    :filter="filterItemsTags"
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs" close
                        :input-value="data.selected" 
                        @click="data.select" text-color="white"
                        @click:close="removeTag(data.item)" close-icon="mdi-close"
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
                <v-col cols="12" sm="6">
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
                            <v-icon>mdi-calendar-clock</v-icon>
                          </v-btn>
                        </template>
                        <span>date added</span>
                      </v-tooltip>
                    </v-btn-toggle>
                  </v-card-actions>
                  <v-autocomplete :disabled="clearWebsite"
                    v-model="website" label="Website"
                    :items="websitesAll" outlined
                    item-text="name" class="mt-0 hidden-close" 
                    item-value="name" hide-details no-data-text="No more websites"
                    :menu-props="{contentClass:'list-with-preview'}"
                  >
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs" label close close-icon="mdi-close"
                        @click="data.select" @click:close="website = ''"
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
                <v-col cols="12" sm="6" class="rating-favorite">
                  <v-rating style="display:inline-flex;"
                    v-model="rating" clearable :disabled="clearFavorite"
                    color="yellow darken-2"
                    background-color="grey"
                    empty-icon="mdi-star-outline"
                    half-icon="mdi-star-half-full"
                    half-increments hover size="36"
                  ></v-rating>
                  <v-btn icon x-large :disabled="clearFavorite"
                    :color="favorite===false ? 'white' : 'pink'"
                    @click="favorite=!favorite"
                  >
                  <v-icon size="36" v-if="favorite===false" color="grey">mdi-heart-outline</v-icon>
                  <v-icon size="36" v-else color="pink">mdi-heart</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="12" class="mt-6 py-0" v-if="!isSelectedSingleVideo">
                  <div class="overline text-center">Clear Information</div>
                </v-col>
                <v-col cols="12" class="rating-favorite py-0" v-if="!isSelectedSingleVideo">
                  <v-switch inset v-model="clearPerformers" label="Performers" color="red" />
                  <v-switch inset v-model="clearTags" label="Tags" color="red" />
                  <v-switch inset v-model="clearWebsite" label="Website" color="red" />
                  <v-switch inset v-model="clearRating" label="Rating" color="red" />
                  <v-switch inset v-model="clearFavorite" label="Favorite" color="red" />
                </v-col>
                <v-col cols="12" v-if="isSelectedSingleVideo">
                  <div class="overline text-center mb-4">Bookmark</div>
                  <v-textarea clearable auto-grow outlined placeholder="Write bookmark text here" 
                    v-model="$store.state.Bookmarks.bookmarkText" hide-details />
                </v-col>
                <v-col cols="12" v-if="isSelectedSingleVideo">
                  <div class="overline text-center mb-4">Path to video</div>
                  <v-checkbox v-model="pathEditable" label="Change path"/>
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

import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'

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
        let video = this.video
        this.performers = video.performers.sort()
        this.tags = video.tags.sort()
        this.website = video.website
        this.rating = video.rating
        this.favorite = video.favorite
      }
      // get bookmark text
      if (this.isSelectedSingleVideo) {
        let video = this.video
        if (video) {
          if (video.bookmark) {
            let text = this.$store.getters.bookmarks.get('videos')
                            .find({itemId:videoId}).value().text
            this.$store.state.Bookmarks.bookmarkText = text
          }
        }
        this.pathToFile = video.path
      }
    })
  },
  data: () => ({
    valid: false,
    performers: [],
    tags: [],
    website: "",
    rating: 0,
    favorite: false,
    clearPerformers: false,
    clearTags: false,
    clearWebsite: false,
    clearRating: false,
    clearFavorite: false,
    pathToFile: '',
    pathEditable: false,
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
        return this.$store.state.Videos.videoEditPerformersSortBy
      },
      set(value) {
        this.$store.dispatch('updateVideoEditPerformersSortBy', value)
      },
    },
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('video')))
      return this.sortItems(tags, 'Tags')
    },
    sortButtonsTags: {
      get() {
        return this.$store.state.Videos.videoEditTagsSortBy
      },
      set(value) {
        this.$store.dispatch('updateVideoEditTagsSortBy', value)
      },
    },
    websitesAll() {
      return this.sortItems(this.$store.getters.websites, 'Websites')
    },
    sortButtonsWebsites: {
      get() {
        return this.$store.state.Videos.videoEditWebsitesSortBy
      },
      set(value) {
        this.$store.dispatch('updateVideoEditWebsitesSortBy', value)
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
      this.$store.state.Videos.dialogEditVideoInfo = false
      let videos = this.$store.getters.getSelectedVideos
      videos.map(videoId => {
        let video = this.$store.getters.videos.find({ id: videoId }).value()
        let newPerformers, newTags, newWebsite, newRating, newFavorite, newBookmark, newPath

        if (this.clearPerformers) {
          newPerformers = []
        } else if (this.performers.length == 0 && this.isSelectedSingleVideo) {
          newPerformers = this.performers
        } else if (this.performers.length == 0) {
          newPerformers = video.performers
        } else {
          newPerformers = _.union(this.performers, video.performers).sort()
        }

        if (this.clearTags) {
          newTags = []
        } else if (this.tags.length == 0 && this.isSelectedSingleVideo) {
          newTags = this.tags.sort()
        } else if (this.tags.length == 0) {
          newTags = video.tags.sort()
        } else {
          newTags = _.union(this.tags, video.tags).sort()
        }

        if (this.clearWebsite) {
          newWebsite = ""
        } else if (this.website == "" && this.isSelectedSingleVideo) {
          newWebsite = this.website
        } else if (this.website == "") {
          newWebsite = video.website
        } else {
          newWebsite = this.website
        }

        if (this.clearRating) {
          newRating = 0
        } else if (this.rating == 0 && this.isSelectedSingleVideo) {
          newRating = this.rating
        } else if (this.rating == 0) {
          newRating = video.rating
        } else {
          newRating = this.rating
        }
        
        if (this.clearFavorite) {
          newFavorite = false
        } else if (this.favorite == false && this.isSelectedSingleVideo) {
          newFavorite = this.favorite
        } else if (this.favorite == false) {
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
        } else {
          newPath = video.path
        }
        this.$store.getters.videos.find({ id: videoId }).assign({ 
          performers: newPerformers,
          tags: newTags,
          website: newWebsite,
          rating: newRating,
          favorite: newFavorite,
          bookmark: newBookmark,
          path: newPath,
        }).write()
        this.$store.commit('updateVideos')
        this.$store.dispatch('filterVideos', true)
      })
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    getPathRules(stringPath) {
      if (stringPath.length===0) {
        return 'Path is required'
      } else {
        return true
      }
    },
    getPerformerColorDependsRating(item) { 
      if (item.rating === 0) {
        return `rgba(150, 150, 150, 0.1)`
      } else {
        return `rgba(255, 190, 0, ${0.05*item.rating})`
      }
    },
    removePerformer(item) { 
      const index = this.performers.indexOf(item.name);
      if (index >= 0) this.performers.splice(index, 1);
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
    removeTag(item) { 
      const index = this.tags.indexOf(item.name);
      if (index >= 0) this.tags.splice(index, 1);
    },
    sort(items) {
      this[items] = this[items].sort((a, b) => a.localeCompare(b))
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
</style> 