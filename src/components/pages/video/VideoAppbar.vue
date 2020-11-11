<template>
	<v-app-bar app dense clipped-left :color="colorHeader" extension-height="32">
    <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
              <v-icon>mdi-movie-edit</v-icon>
            </v-btn>
          </template>
          <span>Edit video</span>
        </v-tooltip>
      </template>
      <v-card width="500">
        <v-autocomplete 
          v-model="video.performers" :items="performersAll" label="Performers"
          item-text="name" class="mx-4 py-3 hidden-close"
          item-value="name" no-data-text="No more performers" clearable
          multiple hide-selected hide-details dense outlined placeholder=" "
          :menu-props="{contentClass:'list-with-preview'}"
          @blur="sort('performers'), saveVideoInfo()" :filter="filterItemsPerformers"
        >
          <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs" close close-icon="mdi-close"
              :input-value="data.selected"
              @click="data.select" small
              @click:close="removePerformer(data.item)"
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

        <v-autocomplete 
          v-model="video.tags" :items="tagsAll" item-text="name" item-value="name"
          no-data-text="No more tags" multiple hide-selected hide-details
          @blur="sort('tags'), saveVideoInfo()" class="mx-4 py-3 hidden-close"
          dense outlined label="Tags" placeholder=" " clearable 
          :menu-props="{contentClass:'list-with-preview'}" :filter="filterItemsTags"
        >
          <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs" outlined small
              :input-value="data.selected" close close-icon="mdi-close"
              @click="data.select" @click:close="removeTag(data.item)"
              @mouseover.stop="showImage($event, data.item.id, 'tag')" 
              @mouseleave.stop="$store.state.hoveredImage=false"
              :color="getTag(data.item.name).color" 
            >{{ data.item.name }}
            </v-chip>
          </template>
          <template v-slot:item="data">
            <div class="list-item"
              @mouseover.stop="showImage($event, data.item.id, 'tag')" 
              @mouseleave.stop="$store.state.hoveredImage=false"
            > <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
              <span>{{data.item.name}}</span>
              <span v-if="data.item.altNames.length" class="aliases"> 
                {{data.item.altNames.join(', ').slice(0,50)}}
              </span>
            </div>
          </template>
        </v-autocomplete>

        <v-autocomplete
          v-model="video.website" :items="websitesAll" outlined dense
          item-text="name" class="mx-4 py-3" no-data-text="No more websites"
          item-value="name" hide-details label="Website" placeholder=" "
          @blur="saveVideoInfo()"
          :menu-props="{contentClass:'list-with-preview'}"
        >
          <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs" label small outlined close close-icon="mdi-close"
              @click="data.select" @click:close="removeWebsite()"
              @mouseover.stop="showImage($event, data.item.id, 'website')" 
              @mouseleave.stop="$store.state.hoveredImage=false"
              :input-value="data.selected"
              :color="data.item.color"
            > <span>{{ data.item.name }}</span>
            </v-chip>
          </template>
          <template v-slot:item="data">
            <div class="list-item"
              @mouseover.stop="showImage($event, data.item.id, 'website')" 
              @mouseleave.stop="$store.state.hoveredImage=false"
            > <v-icon left size="16" :color="data.item.color"> mdi-web </v-icon>
              {{data.item.name}}
            </div>
          </template>
        </v-autocomplete>
      </v-card>
    </v-menu>

    <template v-slot:extension v-if="$store.getters.tabs.length">
      <Tabs />
    </template>
	</v-app-bar>
</template>


<script>
const fs = require("fs")
const path = require("path")

import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'VideoAppbar',
  components: {
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mixins: [ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    performers: [],
    tags: [],
    website: "",
  }),
  computed: {
    colorHeader() {
      if (this.$vuetify.theme.isDark) {
        return this.$store.state.Settings.appColorDarkHeader
      } else return this.$store.state.Settings.appColorLightHeader
    },
    videoId() {
      return this.$route.params.id.replace(/:/g, '')
    },
    video() {
      return this.$store.getters.videos.find({ id: this.videoId }).value()
    },
    getVideoPath() {
      return this.video.path
    },
    performersAll() {
      return this.$store.getters.performers.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('video')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    websitesAll() {
      return this.$store.getters.websites.orderBy(w=>(w.name.toLowerCase()),['asc']).value()
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
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
    getPerformerColorDependsRating(item) { 
      if (item.rating === 0) {
        return `rgba(150, 150, 150, 0.1)`
      } else {
        return `rgba(255, 190, 0, ${0.05*item.rating})`
      }
    },
    removePerformer(item) { 
      const index = this.video.performers.indexOf(item.name)
      if (index >= 0) this.video.performers.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    getPerformerImg(performerId) {
      return this.checkPerformerImageExist(performerId)+'?lastmod='+Date.now()
    },
    checkPerformerImageExist(performerId) {
      let imgAvatarPath = path.join(this.pathToUserData, `/media/performers/${performerId}_avatar.jpg`)
      let imgMainPath = path.join(this.pathToUserData, `/media/performers/${performerId}_main.jpg`)
      
      if (fs.existsSync(imgAvatarPath)) {
        return imgAvatarPath
      } else if (fs.existsSync(imgMainPath)) {
        return imgMainPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/performer.png')
      }
    },
    getTag(tagName) {
      return this.$store.getters.tags.find({name:tagName}).value()
    },
    removeTag(item) { 
      const index = this.video.tags.indexOf(item.name)
      if (index >= 0) this.video.tags.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    getTagImgUrl(tagId) {
      let imgTag = path.join(this.pathToUserData, `/media/tags/${tagId}_.jpg`)
      return this.checkTagImageExist(imgTag)
    },
    checkTagImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/tag.png')
      }
    },
    getWebsiteImg(websiteId) {
      return this.checkWebsiteImageExist(websiteId)+'?lastmod='+Date.now()
    },
    removeWebsite() {
      this.video.website = ''
      this.$store.state.hoveredImage = false
    },
    checkWebsiteImageExist(websiteId) {
      let imgPath = this.getWebsiteImgUrl(websiteId) + `_.jpg`
      
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/website.png')
      }
    },
    getWebsiteImgUrl(img) {
      return  path.join(this.pathToUserData, `/media/websites/${img}`)
    },
    sort(items) {
      this[items] = this[items].sort((a, b) => a.localeCompare(b))
    },
    saveVideoInfo() {
      this.$store.getters.videos.find({ id: this.videoId }).assign({ 
        performers: this.video.performers.sort(),
        tags: this.video.tags.sort(),
        website: this.video.website,
      }).write()
      this.$store.commit('updateVideos')
    },
  },
  watch: {
  },
}
</script>