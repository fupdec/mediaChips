<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu" 
      :data-id="tag.id" class="tag-card" outlined hover >
      <v-img @click="openTagPage" @click.middle="addNewTab" :title='`Open tag "${tagName}"`'
        class="tag-card-img" :src="imgMain" :aspect-ratio="1">
        <div class="tag-color" :style="`border-color: ${tag.color} transparent transparent transparent;`"/>
        <v-icon v-if="tag.bookmark" class="bookmark" color="red" size="32">
          mdi-bookmark
        </v-icon>
      </v-img>
      <v-card-title class="tag-card-name"> {{tagName}} ({{itemsWithTag}})</v-card-title>
      <v-btn @click="$store.state.Tags.dialogEditTag = true"
        class="tag-edit-btn" color="white" icon absolute >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const fs = require("fs");
const path = require("path");

export default {
  name: "TagCard",
  props: {
    tag: Object,
  },
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
    itemsWithTag() {
      let videos = this.$store.getters.videos.filter(v=>
        (v.tags.includes(this.tag.name)) ).value().length
      let performers = this.$store.getters.performers.filter(v=>
        (v.tags.includes(this.tag.name)) ).value().length
      return videos + performers
    },
  },
  methods: {
    addNewTab() {
      let tab = { 
        name: this.tag.name,
        link: `/tag/:${this.tag.id}`,
        id: this.tag.id,
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    openTagPage() {
      this.$router.push(`/tag/:${this.tag.id}`)
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
.tag-card-name {
  padding: 3px 35px 3px 5px;
  font-weight: 300;
  color: #fff;
  font-size: 18px;
  border-radius: 0 0 4px 4px;
  background-color:rgba(0, 0, 0, 0.3)
}
.tag-card {
  overflow: hidden;
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
  }
  .bookmark {
    position: absolute;
    top: -6px;
    right: 20px;
    margin: auto;
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
}
.tag-card-img {
  align-items: flex-end !important;
  .v-image__image {
    background-position: center center;
  }
}
.tag-edit-btn {
  bottom: 0px !important;
  right: 0px !important;
  .v-icon {
    text-shadow: 0 0 3px #000;
  }
}
</style>