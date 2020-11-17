<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)" @contextmenu="showContextMenu" 
      :data-id="website.id" class="website-card" outlined hover >
      <v-img @click="openWebsitePage" @click.middle="addNewTab" :title='`Open website "${websiteName}"`' 
        class="website-card-img" :src="imgMain" :aspect-ratio="1">
        <div class="website-color" :style="`border-color: ${website.color} transparent transparent transparent;`"/>
        <v-icon v-if="website.bookmark" class="bookmark" color="red" size="32">
          mdi-bookmark
        </v-icon>
      </v-img>
      <v-card-title class="website-card-name">{{websiteName}} ({{videosOfWebsite}})</v-card-title>
      <v-btn @click="$store.state.Websites.dialogEditWebsite = true"
        class="website-edit-btn" color="white" icon absolute >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const fs = require("fs")
const path = require("path")

export default {
  name: "WebsiteCard",
  props: {
    website: Object,
  },
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
    videosOfWebsite() {
      return this.$store.getters.videos.filter({website:this.website.name}).value().length
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    addNewTab() {
      let tab = { 
        name: this.website.name,
        link: `/website/:${this.website.id}`,
        id: this.website.id + new Date().getTime(),
        icon: 'web'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    openWebsitePage() {
      this.$router.push(`/website/:${this.website.id}`)
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
.website-card-name {
  padding: 3px 35px 3px 5px;
  font-weight: 300;
  color: #fff;
  font-size: 18px;
  border-radius: 0 0 4px 4px;
  background-color:rgba(0, 0, 0, 0.3)
}
.website-card {
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
  .website-color {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 50px 50px 0 0;
  }
}
.website-card-img {
  align-items: flex-end !important;
  .v-image__image {
    background-position: center center;
  }
}
.website-edit-btn {
  bottom: 0px !important;
  right: 0px !important;
  .v-icon {
    text-shadow: 0 0 3px #000;
  }
}
</style>