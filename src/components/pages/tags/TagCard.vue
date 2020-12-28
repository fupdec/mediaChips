<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu" height="100%"
      :data-id="tag.id" class="tag-card" outlined hover :class="{favorite: isFavorite}">
      <v-img @click="openTagPage" @click.middle="addNewTabTag()" :title='`Open tag "${tagName}"`'
        class="tag-card-img" :src="imgMain" :aspect-ratio="1">
        <div class="tag-color" :style="`border-color: ${tag.color} transparent transparent transparent;`"/>
        <v-icon v-if="tag.bookmark" class="bookmark" color="red" size="32" :title="bookmark">
          mdi-bookmark
        </v-icon>
      </v-img>
      <v-btn @click="isFavorite = !isFavorite" icon absolute large class="fav-btn"
        :color="isFavorite===false ? 'white' : 'pink'"
      > <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart-outline</v-icon>
      </v-btn>
      <v-card-title class="py-1 px-2"> 
        <div> {{tagName}} ({{tag.videos}}) </div>
        <div v-if="tag.altNames.length>0 && !isAltNamesHidden" class="mt-1 body-2">
          <span class="ml-2">Alternate: </span> {{tag.altNames.join(', ')}}
        </div>
      </v-card-title>
      <v-card-text v-if="tag.performers.length>0 && !isPerformersHidden" class="pa-1 py-0">
        <div class="caption px-1">Performers ({{tag.performers.length}})</div>
        <v-chip-group column>
          <v-chip v-for="performer in tag.performers" :key="performer" :to="performerLink(performer)"
            outlined label x-small
            @mouseover.stop="showImage($event, getPerformerId(performer), 'performer')" 
            @mouseleave.stop="$store.state.hoveredImage=false"
            @click="$store.state.hoveredImage=false"
            @click.middle="addNewTabPerformer(performer)"
          > {{ performer }}
          </v-chip>
        </v-chip-group>
      </v-card-text>

      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Tags.dialogEditTag=true"
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
  name: "TagCard",
  props: {
    tag: Object,
  },
  mixins: [ShowImageFunction, LabelFunctions], 
  mounted() {
    this.$nextTick(function () {
      this.imgMain = this.getImgUrl(this.tag.id)
      this.tagName = this.tag.name
    })
  },
  data: () => ({
    tagName: '',
    imgMain: '',
    imgMainKey: Date.now(),
  }),
  computed: {
    updateInfoData() {
      return this.$store.state.Tags.updateInfo
    },
    updateImageData() {
      return this.$store.state.Tags.updateImage
    },
    isFavorite: {
      get() {
        return this.tag.favorite
      },
      set(value) {
        this.tag.favorite = value
        this.$store.getters.tags.find({id: this.tag.id}).assign({favorite: value}).write()
        this.$store.commit('updateTags')
      },
    },
    bookmark() {
      return this.$store.getters.bookmarks.get('tags').find({itemId:this.tag.id}).value().text
    },
    isAltNamesHidden() {
      return this.$store.state.Tags.tagAltNamesHidden 
    },
    isEditBtnHidden() {
      return this.$store.state.Tags.tagEditBtnHidden 
    },
    isPerformersHidden() {
      return this.$store.state.Tags.tagPerformersHidden
    },
  },
  methods: {
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    openTagPage() {
      this.$router.push(`/tag/:${this.tag.id}?tabId=default`)
    },
    getImgUrl(tagId) {
      let imgPath = path.join(this.$store.getters.getPathToUserData, `/media/tags/${tagId}_.jpg`)
      return this.checkImageExist(imgPath)+'?lastmod='+Date.now()
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        this.errorThumb = true
        return path.join(this.$store.getters.getPathToUserData, '/img/templates/tag.png')
      }
    },
    updateInfo(info) {
      if (this.tag.id != info.id) return
      setTimeout(() => {
        this.tagName = info.name
        this.tag.color = info.color
        console.log(`tag info updated`)
      }, 1000)
    },
    updateImage(info) {
      setTimeout(() => {
        this.imgMain = this.getImgUrl(this.tag.id)
        this.imgMainKey = Date.now()
      }, 3000)
    },
    showContextMenu(e) {
      e.preventDefault()
      this.$store.state.menuTabs = false
      this.$store.state.Tags.menuCard = false
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
      this.$nextTick(() => {
        this.$store.state.Tags.menuCard = true
      })
    },
  },
  watch: {
    updateInfoData (info) {
      this.updateInfo(info)
    },
    updateImageData (data) {
      this.updateImage(data)
    },
  },
}
</script>

<style lang="less">
.tag-card {
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
    .tag-card-img:before {
      opacity: 1;
    }
  }
  .bookmark {
    position: absolute;
    top: -6px;
    right: 25%;
    opacity: 0.4;
  }
  .tag-color {
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
.tag-card-img {
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