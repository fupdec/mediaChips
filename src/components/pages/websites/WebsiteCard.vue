<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu" height="100%"
      :data-id="website.id" class="website-card" outlined hover 
      :class="{favorite: isFavorite}" v-ripple="{ class: 'accent--text' }">
      <v-img @click="openWebsitePage" @click.middle="addNewTabWebsite()" :title='`Open website "${websiteName}"`' 
        class="website-card-img" :src="imgMain" :aspect-ratio="1">
        <div class="website-color" :style="`border-color: ${website.color} transparent transparent transparent;`"/>
        <v-icon v-if="website.bookmark" class="bookmark" color="red" size="32" :title="bookmark">
          mdi-bookmark
        </v-icon>
      </v-img>
      <v-btn @click="isFavorite = !isFavorite" icon absolute large class="fav-btn"
        :color="isFavorite===false ? 'white' : 'pink'"
      > <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart-outline</v-icon>
      </v-btn>
      <v-card-title class="py-1 px-2">{{websiteName}} ({{website.videos}})
      </v-card-title>
      <v-card-text v-if="website.performers.length>0 && !isPerformersHidden" class="pa-1 py-0">
        <div class="caption px-1">Performers ({{website.performers.length}})</div>
        <v-chip-group column>
          <v-chip v-for="performer in website.performers" :key="performer" :to="performerLink(performer)"
            outlined label x-small
            @mouseover.stop="showImage($event, getPerformerId(performer), 'performer')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabPerformer(performer)"
          > {{ performer }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
      <v-card-text v-if="website.videoTags.length>0 && !isVideoTagsHidden" class="pa-1 py-0">
        <div class="caption px-1">Tags from videos</div>
        <v-chip-group column>
          <v-chip v-for="tag in website.videoTags" :key="tag" :to="tagLink(tag)"
            outlined x-small
            @mouseover.stop="showImage($event, getTagId(tag), 'tag')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabTag(tag)"
          > {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-card-text>

      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Websites.dialogEditWebsite=true"
        color="secondary" fab x-small class="btn-edit">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const fs = require("fs")
const path = require("path")

import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'

export default {
  name: "WebsiteCard",
  props: {
    website: Object,
  },
  mixins: [ShowImageFunction, LabelFunctions], 
  mounted() {
    this.$nextTick(function () {
      this.imgMain = this.getImgUrl(this.website.id)
      this.websiteName = this.website.name
    })
  },
  data: () => ({
    websiteName: '',
    imgMain: '',
    imgMainKey: Date.now(),
  }),
  computed: {
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    isFavorite: {
      get() {
        return this.website.favorite
      },
      set(value) {
        this.website.favorite = value
        this.$store.getters.websites.find({id: this.website.id}).assign({favorite: value}).write()
        this.$store.commit('updateWebsites')
      },
    },
    bookmark() {
      return this.$store.getters.bookmarks.get('websites').find({itemId:this.website.id}).value().text
    },
    isEditBtnHidden() {
      return this.$store.state.Websites.websiteEditBtnHidden 
    },
    isVideoTagsHidden() {
      return this.$store.state.Websites.websiteVideoTagsHidden 
    },
    isPerformersHidden() {
      return this.$store.state.Websites.websitePerformersHidden
    },
  },
  methods: {
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    openWebsitePage() {
      this.$router.push(`/website/:${this.website.id}?tabId=default`)
    },
    getImgUrl(websiteId) {
      let imgPath = path.join(this.pathToUserData, `/media/websites/${websiteId}_.jpg`)
      return this.checkImageExist(imgPath)+'?lastmod='+Date.now()
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        this.errorThumb = true
        return path.join(this.pathToUserData, '/img/templates/website.png')
      }
    },
    updateInfo(eventType) {
      setTimeout(() => {
        if (eventType === 'main') {
          this.imgMain = this.getImgUrl(this.website.id)
          this.imgMainKey = Date.now()
          console.log(`website img updated`)
        }
      }, 3000)
      if (eventType.info) {
        this.websiteName = eventType.name
        this.website.color = eventType.color
      }
    },
    showContextMenu(e) {
      e.preventDefault()
      this.$store.state.menuTabs = false
      this.$store.state.Websites.menuCard = false
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
      this.$nextTick(() => {
        this.$store.state.Websites.menuCard = true
      })
    },
  },
};
</script>

<style lang="less">
.website-card {
  cursor: default;
  .v-image {
    cursor: pointer;
  }
  &:hover {
    .bookmark {
      opacity: 0.7;
      &:hover {
        opacity: 1;
      }
    }
    .btn-edit {
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }
  }
  &.favorite {
    &:before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      border-radius: 4px;
      pointer-events: none;
      box-shadow: 0px 2px 8px 3px rgba(255, 0, 75, 0.25), 0 0 0 1px rgba(255, 0, 75, 1);
    }
    .website-card-img:before {
      opacity: 1;
    }
  }
  .bookmark {
    position: absolute;
    top: -6px;
    right: 25%;
    margin: auto;
    opacity: 0.4;
  }
  .website-color {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 50px 50px 0 0;
  }
  .v-chip {
    margin: 0 2px 2px !important;
    padding: 0 4px;
  }
  .btn-edit {
    position: absolute;
    right: 5px;
    opacity: 0;
    z-index: 4;
    bottom: 5px;
  }
}
.website-card-img {
  align-items: flex-end !important;
  &:before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1;
    opacity: 0;
    background-image: linear-gradient(225deg, rgba(255, 0, 75, 1) 0%, rgba(0, 0, 0, 0) 12%, rgba(0, 0, 0, 0));
    transition: 1s all ease;
    pointer-events: none;
  }
  .v-image__image {
    background-position: center center;
  }
}
</style>