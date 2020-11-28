<template>
  <v-dialog v-model="$store.state.Websites.dialogEditWebsite" scrollable persistent>
    <v-card>
      <v-card-title class="edit-card-title">
        <v-img 
          :src="getImg()" :aspect-ratio="1" max-width="84" height="84" class="mr-6"
          gradient="to right, rgba(0,0,0,.0) 70%, #3d3d3d 100%" position="top"
        />
        <div>
          <div class="font-weight-light headline body-1">Edit website</div>
          <div class="font-weight-bold headline">{{website.name}} 
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-icon right @click="copyWebsiteNameToClipboard"
                  size="16" v-on="on" color="grey">mdi-content-copy</v-icon>
              </template>
              <span>Copy name to clipboard</span>
            </v-tooltip>
          </div> 
        </div>
        <v-spacer></v-spacer>
        <div>
          <v-btn outlined dark class="mr-6" @click="close">Cancel</v-btn>
          <v-btn 
            :disabled="!valid" color="primary" @click="saveWebsiteInfo"
          ><v-icon left>mdi-content-save-outline</v-icon>Save</v-btn>
        </div>
      </v-card-title>

      <vuescroll>
        <v-card-text>
          <v-container fluid class="px-10">
            <v-row>
              <v-col cols="12" md="5" class="col-edit-website">
                <v-form ref="form" v-model="valid">
                  <v-row>
                    <v-col cols="12" md="12">
                      <div class="editable-text-field">
                        <v-tooltip bottom v-if="isWebsiteNameEditEnabled">
                          <template v-slot:activator="{ on }">
                            <v-icon left @click="isWebsiteNameEditEnabled=!isWebsiteNameEditEnabled" v-on="on">mdi-close</v-icon>
                          </template>
                          <span>Keep the old name</span>
                        </v-tooltip>
                        <v-tooltip bottom v-else>
                          <template v-slot:activator="{ on }">
                            <v-icon left @click="isWebsiteNameEditEnabled=!isWebsiteNameEditEnabled" v-on="on">mdi-pencil</v-icon>
                          </template>
                          <span>Edit name</span>
                        </v-tooltip>
                        <v-text-field
                          :disabled="!isWebsiteNameEditEnabled"
                          :rules="[getNameRules]" validate-on-blur
                          v-model="websiteName" class="rename-website-field" label="Website name"
                          hint='The name may include letters, numbers, symbols: \/%"<>{}[]'
                        ></v-text-field>
                      </div>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-switch
                        v-model="isNetwork" inset
                        :label="`This website is network - ${isNetwork?'Yes':'No'}`"
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-autocomplete
                        v-model="childWebsites" :disabled="!isNetwork"
                        :items="childWebsitesList" label="Websites in network"
                        item-text="name" class="mt-0 hidden-close"
                        item-value="name" no-data-text="No more child websites"
                        multiple hide-selected hide-details @blur="sort('childWebsites')"
                      >
                        <template v-slot:selection="data">
                          <v-chip
                            v-bind="data.attrs" small class="mb-1" close
                            :input-value="data.selected" 
                            @click="data.select" outlined
                            @click:close="remove(data.item)"
                            :color="getWebsite(data.item.name).color" 
                          ><span>{{ data.item.name }}</span></v-chip>
                        </template>
                        <template v-slot:item="data">
                          <template>
                            <v-list-item-avatar >
                              <img :src="getImgWebsitesUrl(data.item.id)">
                            </v-list-item-avatar>
                            <v-list-item-content>
                              <v-list-item-title>
                                <v-icon left size="16" :color="data.item.color">mdi-web</v-icon>
                                <span>{{data.item.name}}</span>
                              </v-list-item-title>
                            </v-list-item-content>
                          </template>
                        </template>
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="12" class="py-0">
                      <div class="text-center mb-2">Bookmark</div>
                      <v-textarea clearable auto-grow outlined placeholder="Write text here" 
                        v-model="$store.state.Bookmarks.bookmarkText" />
                    </v-col>
                    <v-col cols="12" align="center" justify="center">
                      <span>Website color</span> 
                      <v-chip class="ml-2" small label outlined :color="website.color">{{website.name}}</v-chip>
                      <v-color-picker 
                        class="color-picker-websites"
                        :swatches="swatches" show-swatches
                        hide-canvas hide-inputs
                        v-model="website.color"
                      ></v-color-picker>
                    </v-col>
                  </v-row>
                </v-form>
              </v-col>
              <v-spacer></v-spacer>
              <v-divider vertical></v-divider>
              <v-spacer></v-spacer>
              <v-col cols="12" md="5" class="col-edit-website">
                <v-col cols="12" class="mb-6 cropper-wrapper" align="center" justify="center">
                  <div>Website image</div>
                  <div class="caption text-center font-italic mb-8">
                    (saves separate)
                  </div>
                  <img id="clipboard" class="img-clipboard-temporary">
                  <Cropper
                    :src="images.main.file" ref="main"
                    :stencil-props="{minAspectRatio: 2/2, maxAspectRatio: 3/3 }"
                    :min-height="20" class="cropper cropper-website"
                  />
                  <v-btn @click="pasteImageFromClipboard('main')"
                    class="ma-2" outlined :color="images.main.btnColor">
                    <v-icon left>mdi-clipboard-outline</v-icon> Paste
                  </v-btn>
                  <v-btn v-if="images.main.display" 
                    @click="crop(getImagePath('website',''),'main',600),loader='imgMainLoading'" 
                    class="ma-2" color="primary" large
                    :loading="imgMainLoading" :disabled="imgMainLoading"
                  > <v-icon left>mdi-crop</v-icon> Crop / save
                    <template v-slot:loader>
                      <span class="custom-loader">
                        <v-icon>mdi-cached</v-icon>
                      </span>
                    </template>
                  </v-btn>
                  <file-pond
                    ref="pond" label-idle="Drop image here or click for upload"
                    :allow-multiple="false" :files="uploadedImage" @addfile="handleFile"
                    accepted-file-types="image/*" :dropValidation="true" class="mt-2"
                  />
                </v-col>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>

<script>
const fs = require("fs")
const path = require("path")
const shortid = require('shortid')

import vueFilePond from 'vue-filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginFileEncode from 'filepond-plugin-file-encode'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
const FilePond = vueFilePond(FilePondPluginFileEncode, FilePondPluginFileValidateType)

import CropImage from '@/mixins/CropImage'
import vuescroll from 'vuescroll'

export default {
  name: "DialogEditWebsite",
  components: {
    FilePond,
    vuescroll,
	},
  mixins: [CropImage],
  created() {
    this.$set(this.images, 'main', this.getImageObject())
  },
  mounted () {
    this.$nextTick(function () {
      this.checkImageExist(this.getImagePath('website',''), 'main')
      this.websiteName = this.website.name
      if (this.website.network !== undefined) {
        this.isNetwork = this.website.network 
      }
      if (this.website.bookmark) {
        let text = this.$store.getters.bookmarks.get('websites')
                    .find({itemId:this.website.id}).value().text
        this.$store.state.Bookmarks.bookmarkText = text
      }
    })
  },
  updated() {
    this.validate()
  },
  data: () => ({
    isWebsiteNameEditEnabled: false,
    imgMainLoading: null,
    websiteName: '',
    valid: false,
    swatches: [
      ["#cc0e00"],
      ["#e8004f"],
      ["#ae0eff"],
      ["#2041f7"],
      ["#2196f3"],
      ["#00bcd4"],
      ["#009688"],
      ["#2ac530"],
      ["#8bc34a"],
      ["#ff9800"],
      ["#ff5722"],
      ["#795548"],
      ["#9b9b9b"]
    ],
    isNetwork: false,
    uploadedImage: null,
  }),
  computed: {
    console: () => console,
    window: () => window,
    website() {
      let ids = this.$store.getters.getSelectedWebsites
      let websites = this.$store.getters.websites
      if (this.$route.path.includes('/website/:')) {
        let websiteId = this.$router.currentRoute.params.id.substring(1)
        return websites.find({ id: websiteId }).value()
      } else if (ids.length>0) {
        return websites.find({id:ids[0]}).value()
      } else {
        return websites.find('id').value()
      }
    },
    childWebsitesList() {
      return this.$store.getters.websites.filter(website=>(
        website.id != this.website.id && website.network != true
      )).value()
    },
    childWebsites: {
      get(){
        return this.website.childWebsites
      },
      set(childWebsites){
        this.website.childWebsites = childWebsites
      },
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    handleFile(imgType) {
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images.main.display = true
      this.images.main.file = imgBase64
    },
    close() {
      this.$store.state.Websites.dialogEditWebsite = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    getWebsite(websiteName){
      return this.$store.getters.websites.find({name:websiteName}).value()
    },
    validate() {
      this.$refs.form.validate()
    },
    getNameRules(name) {
      let duplicate = this.$store.getters.websites.find({name:name}).value()
      if (name.length > 45) {
        return 'Name must be less than 45 characters'
      } else if (name.length < 2 && name.length > 0) {
        return 'Name must be more than 1 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined && duplicate.id!==this.website.id) {
        return 'Website with that name already exists'
      } else {
        return true
      }
    },
    saveWebsiteInfo () {
      this.validate()
      if (this.websiteName) {
        this.websiteName = this.websiteName.trim()
        this.websiteName = this.websiteName.replace(/[\\\/\%"<>{}\[\]]/g, '')
      }
      if (this.isWebsiteNameEditEnabled) {
        // rename website in videos
        this.$store.getters.videos.filter({'website': this.website.name}).each(video=>{
          video.website = this.websiteName
        }).write()
        // rename website in child websites 
        this.$store.getters.websites.filter(website => {
          return website.childWebsites.includes(this.website.name)
        }).each(website => {
          let index = website.childWebsites.indexOf(this.website.name)
          if (index !== -1) website.childWebsites.splice(index, 1, this.websiteName)
        }).write()
      }

      let isNetwork = this.isNetwork
      let childWebsites
      if (isNetwork) {
        childWebsites = this.childWebsites
      } else childWebsites = []
      
      let newBookmark
      if (this.$store.state.Bookmarks.bookmarkText) {
        let bookmark = this.$store.getters.bookmarks.get('websites')
                        .find({itemId:this.website.id})
        newBookmark = true
        if (bookmark.value()) {
          bookmark.assign({ 
            text: this.$store.state.Bookmarks.bookmarkText,
            date: Date.now(),
          }).write()
        } else {
          this.$store.getters.bookmarks.get('websites').push({
            id: shortid.generate(),
            itemId: this.website.id,
            text: this.$store.state.Bookmarks.bookmarkText,
            date: Date.now(),
          }).write()
        }
      } else {
        this.$store.getters.bookmarks.get('websites')
          .remove({itemId:this.website.id}).write()
        newBookmark = false
      }

      this.$store.getters.websites
        .find({ id: this.website.id })
        .assign({
          name: this.websiteName,
          category: this.website.category,
          color: this.website.color,
          network: isNetwork,
          childWebsites: childWebsites,
          bookmark: newBookmark,
        }).write()
      let info = {}
      info.info = true
      info.name = this.websiteName
      info.color = this.website.color
      info.network = isNetwork
      info.childWebsites = childWebsites
      info.bookmark = newBookmark
      console.log(info)
      this.$store.state.Websites.updateInfo = info
      this.$store.state.Websites.dialogEditWebsite = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    getImg() {
      let imgPath = this.getImgUrl(this.website.id + '_.jpg')
      return this.checkWebsiteImageExist(imgPath)+'?lastmod='+Date.now()
    },
    getImgUrl(img) {
      return path.join(this.pathToUserData, `/media/websites/${img}`)
    },
    checkWebsiteImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/website.png')
      }
    },
    copyWebsiteNameToClipboard() {
      let websiteName = this.website.name
      navigator.clipboard.writeText(websiteName).then(function() {
        console.log('Async: Copying to clipboard was successful!');
      }, function(err) {
        console.error('Async: Could not copy text: ', err);
      });
    },
    getImgWebsitesUrl(websiteId){
      let imgPath = this.getImgUrl(websiteId + '_.jpg')
      return this.checkWebsiteImageExist(imgPath)+'?lastmod='+Date.now()
    },
    sort(items) {
      this[items] = this[items].sort((a, b) => a.localeCompare(b))
    },
    remove(item) { 
      const index = this.childWebsites.indexOf(item.name)
      if (index >= 0) this.childWebsites.splice(index, 1)
    },
  },
}
</script>

<style lang="less">
.color-picker-websites {
  max-width: none !important;
  .v-color-picker__controls {
    display: none;
  }
  .v-color-picker__swatches {
    max-height: none !important;
  }
}
.img-clipboard-temporary {
  display: none;
}
.edit-website-dialog-title {
  display: flex;
  flex-wrap: wrap;
}
.edit-website-dialog-title .headline {
  margin-right: 50px;
}
.cropper.cropper-website {
  max-height: 400px;
}
.alert-clipboard {
  max-width: 350px;
  text-align: center;
  display: none;
  margin-top: 10px;
  padding: 2px 8px;
  .v-alert__wrapper {
    width: 100%;
    font-size: 14px;
  }
}
@media (min-width: 960px) {
  .col-md-5.col-edit-website {
    flex: 0 0 47%;
    max-width: 47%;
  }
}
</style>