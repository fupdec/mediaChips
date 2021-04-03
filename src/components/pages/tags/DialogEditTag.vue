<template>
  <div>
    <v-dialog v-model="$store.state.Tags.dialogEditTag" scrollable persistent width="1200">
      <v-card>
        <v-card-title class="edit-card-title">
          <v-img 
            :src="'file://' + getImg()" :aspect-ratio="1" max-width="84" height="84" class="mr-6"
            gradient="to right, rgba(0,0,0,.0) 70%, #3d3d3d 100%" position="top"
          />
          <div>
            <div class="font-weight-light headline body-1">Editing the tag</div>
            <div class="font-weight-bold headline">{{tag.name}} 
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-icon right @click="copyTagNameToClipboard"
                    size="16" v-on="on" color="grey">mdi-content-copy</v-icon>
                </template>
                <span>Copy name to clipboard</span>
              </v-tooltip>
            </div> 
          </div>
          <v-spacer></v-spacer>
          <div>
            <v-btn outlined dark class="mr-6" @click="close">Cancel</v-btn>
            <v-btn :disabled="!valid" color="primary" @click="saveTagInfo"
              ><v-icon left>mdi-content-save-outline</v-icon>Save</v-btn>
          </div>
        </v-card-title>
        <vuescroll>
          <v-card-text>
            <v-container fluid>
              <v-row>
                <v-col cols="12" md="8">
                  <v-form ref="form" v-model="valid">
                    <v-row>
                      <v-col cols="12" class="py-0 d-flex justify-space-between">
                        <v-chip label outlined class="mr-4">
                          <v-icon left size="20">mdi-calendar-plus</v-icon> Added: {{dateAdded}}
                        </v-chip>
                        <v-chip label outlined>
                          <v-icon left size="20">mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
                        </v-chip>
                      </v-col>
                      <v-col cols="12" sm="9" align="center" justify="center">
                        <div>Tag name</div>
                        <div class="editable-text-field">
                          <v-tooltip bottom v-if="isTagNameEditEnabled">
                            <template v-slot:activator="{ on }">
                              <v-icon left @click="isTagNameEditEnabled=!isTagNameEditEnabled, newTagName = tag.name" 
                                v-on="on">mdi-close</v-icon>
                            </template>
                            <span>Keep the old tag name</span>
                          </v-tooltip>
                          <v-tooltip bottom v-else>
                            <template v-slot:activator="{ on }">
                              <v-icon left @click="isTagNameEditEnabled=!isTagNameEditEnabled" v-on="on">mdi-pencil</v-icon>
                            </template>
                            <span>Edit tag name</span>
                          </v-tooltip>
                          <v-text-field v-model="newTagName" :disabled="!isTagNameEditEnabled"
                            :rules="[getNameRules]" validate-on-blur
                            hint='The name may include letters, numbers, symbols: \/%"<>{}[]' />
                        </div>
                      </v-col>
                      <v-col cols="12" sm="3" align="center" justify="center">
                        <div>Favorite</div>
                        <v-btn @click="favorite=!favorite" x-large icon class="mt-3">
                          <v-icon v-if="favorite" color="pink">mdi-heart</v-icon>
                          <v-icon v-else color="grey">mdi-heart-outline</v-icon>
                        </v-btn>
                      </v-col>
                      <v-col cols="12" align="center" justify="center">
                        <div>
                          <span>Alternate tag names </span>
                          <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                              <v-icon v-bind="attrs" v-on="on" class="ml-2">
                                mdi-help-circle-outline
                              </v-icon>
                            </template>
                            <span>
                              For a more convenient tag search, add one or more synonyms.
                              <br>Each synonym must be separated by a comma or semicolon. 
                              <br>e.g. Pretty, Beautiful; Handsome
                            </span>
                          </v-tooltip>
                        </div>
                        <div class="editable-text-field">
                          <v-text-field
                            v-model="tagAlternateNames" 
                            :rules="[getAlternateNamesRules]" validate-on-blur
                            placeholder="Alternate tag names"
                          ></v-text-field>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6" align="center" justify="center">
                        <div class="mb-6"> Tag value
                          <v-tooltip right>
                            <template v-slot:activator="{ on, attrs }">
                              <v-icon v-bind="attrs" v-on="on" class="ml-2" с>
                                mdi-help-circle-outline
                              </v-icon>
                            </template>
                            <v-card class="my-2">
                              <v-card-actions>
                                <div class="text-center mx-4">
                                  You can use a meter to <br>see how hot the performer is. <br>
                                  The larger the tag value, <br>the more the meter will fill. <br><br>
                                  Tags from the video are used <br> in which the performer is involved. <br><br>
                                  Most likely none of your performers <br> will have a fully filled scale. <br>
                                  To increase the scale, <br>you can use a multiplier<br> in the settings -> performer.
                                </div>
                                <v-img :src="getMeterImg" width="165"/><br>
                              </v-card-actions>
                            </v-card>
                          </v-tooltip>
                        </div>
                        <v-slider
                          v-model="tag.value" step="1" max="10" persistent-hint
                          ticks tick-size="2" :thumb-size="24" thumb-label="always"
                          hint="This value will be use for performer's 'Tag Meter'."
                        />
                      </v-col>
                      <v-col cols="12" sm="6" align="center" justify="center">
                        <div class="mb-4">Tag type
                          <v-tooltip top>
                            <template v-slot:activator="{ on, attrs }">
                              <v-icon v-bind="attrs" v-on="on" class="ml-2" с>
                                mdi-help-circle-outline
                              </v-icon>
                            </template>
                            <span>What type of cards will the tag be used for. <br>
                              If you want to remove a type, <br>
                              then this tag will be removed <br>
                              from all cards of the selected type.</span>
                          </v-tooltip>
                        </div>
                        <v-select
                          v-model="type" :items="types" label="Types"
                          outlined multiple :rules="[getCategoryRules]"
                        ></v-select>
                      </v-col>
                      <v-col cols="12" align="center" justify="center">
                        <div class="mb-4">Tag category</div>
                        <v-select
                          v-model="category" :items="$store.state.Settings.tagInfoCategory" 
                          label="Categories" outlined multiple
                        ></v-select>
                      </v-col>
                      <v-col cols="12" align="center" justify="center">
                        <span>Tag color</span> 
                        <v-chip class="ml-2" small outlined :color="tag.color">{{tag.name}}</v-chip>
                        <v-color-picker 
                          class="color-picker-tags"
                          :swatches="swatches" show-swatches
                          hide-canvas hide-inputs
                          v-model="tag.color"
                        ></v-color-picker>
                      </v-col>
                      <v-col cols="12" class="py-0">
                        <div class="text-center mb-2">Bookmark</div>
                        <v-textarea v-model="$store.state.Bookmarks.bookmarkText" hide-details
                          clearable auto-grow outlined placeholder="Write text here" />
                      </v-col>
                    </v-row>
                  </v-form>
                </v-col>
                <v-col cols="12" md="4" class="py-0">
                  <v-col cols="12" class="cropper-wrapper" align="center" justify="center">
                    <div>Tag image</div>
                    <div class="caption text-center"> (saves separate) </div>
                    <img id="clipboard" class="img-clipboard-temporary">
                    <Cropper :src="images.main.file" ref="main" class="cropper cropper-tag"
                      :stencil-props="{minAspectRatio: 2/2, maxAspectRatio: 3/3 }" :min-height="20"/>
                    <v-btn @click="pasteImageFromClipboard('main')" small
                      class="ma-2" :color="images.main.btnColor"> 
                      <v-icon left>mdi-clipboard-outline</v-icon> Paste 
                    </v-btn>
                    <v-btn v-if="images.main.display" 
                      @click="crop(getImagePath('tag',''),'main',600),loader='imgMainLoading'" 
                      class="mr-2" color="primary" small
                      :loading="imgMainLoading" :disabled="imgMainLoading"
                    > <v-icon left>mdi-crop</v-icon> Crop / save
                      <template v-slot:loader>
                        <span class="custom-loader">
                          <v-icon>mdi-cached</v-icon>
                        </span>
                      </template>
                    </v-btn>
                    <file-pond ref="pond" label-idle="Drop image here or click for upload"
                      :allow-multiple="false" :files="uploadedImage" @addfile="handleFile"
                      accepted-file-types="image/*" :dropValidation="true" class="mt-2"/>
                  </v-col>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogWarning" persistent width="320">
      <v-card class="py-6">
        <v-card-text class="text-center">
          <div class="overline red--text">Warning!</div>
          <v-icon size="60" color="red" class="mb-4">mdi-alert</v-icon>
          <div> If you cancel the marked type, <br>
            it will also remove that tag <br>
            from ALL videos or performers! </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogWarning=false, warningAgree = true">
            <v-icon left>mdi-check</v-icon> OK
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
const fs = require("fs")
const path = require("path")
const shortid = require('shortid')
const { ipcRenderer, clipboard } = require('electron')

import vueFilePond from 'vue-filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginFileEncode from 'filepond-plugin-file-encode'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
const FilePond = vueFilePond(FilePondPluginFileEncode, FilePondPluginFileValidateType)

import CropImage from '@/mixins/CropImage'
import vuescroll from 'vuescroll'

export default {
  name: "DialogEditTag",
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
      this.favorite = this.tag.favorite
      this.tagAlternateNames = this.tag.altNames.join(', ')
      this.checkImageExist(this.getImagePath('tag',''), 'main')
      this.newTagName = this.tag.name
      this.type = this.tag.type
      this.category = this.tag.category
      if (this.tag.bookmark) {
        let text = this.$store.getters.bookmarks.get('tags')
                    .find({itemId:this.tag.id}).value().text
        this.$store.state.Bookmarks.bookmarkText = text
      }
    })
  },
  updated() {
    this.validate()
  },
  data: () => ({
    isTagNameEditEnabled: false,
    imgMainLoading: null,
    newTagName: "",
    category: [],
    type: [],
    favorite: null,
    tagAlternateNames: "",
    valid: false,
    types: ['performer', 'video'],
    uploadedImage: null,
    dialogWarning: false,
    warningAgree: false,
    swatches: [
      ["#cc0e00"], // red
      ["#ff5722"], // orange
      ["#ff9800"], // yellow
      ["#8bc34a"], // dark green
      ["#2ac530"], // green
      ["#009688"], // dark cyan
      ["#00bcd4"], // cyan
      ["#2196f3"], // light blue
      ["#2041f7"], // blue
      ["#ae0eff"], // purple
      ["#e8004f"], // pink 
      ["#795548"], // brown
      ["#9b9b9b"], // grey
    ],
  }),
  computed: {
    tag() {
      let ids = this.$store.getters.getSelectedTags
      let tags = this.$store.getters.tags
      if (this.$route.path.includes('/tag/:') && this.$router.currentRoute.params.id) {
        if (this.$router.currentRoute.params.id.substring(1)) {
          return tags.find({id:this.$router.currentRoute.params.id.substring(1)}).value()
        } 
      } else if (ids.length>0) {
        return tags.find({id:ids[0]}).value()
      } else {
        return tags.find('id').value()
      }
    },
    dateAdded() {
      let date = new Date(this.tag.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.tag.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    getMeterImg() {
      return path.join(this.$store.getters.getPathToUserData, `/img/templates/meter.png`)
    },
  },
  methods: {
    handleFile(imgType) {
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images.main.display = true
      this.images.main.file = imgBase64
    },
    close() {
      this.$store.state.Tags.dialogEditTag = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    validate() {
      this.$refs.form.validate()
    },
    getNameRules(name) {
      let duplicate = this.$store.getters.tags.find({name:name}).value()
      if (name.length > 45) {
        return 'Name must be less than 45 characters'
      } else if (name.length < 2 && name.length > 0) {
        return 'Name must be more than 1 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined && duplicate.id!==this.tag.id) {
        return 'Tag with that name already exists'
      } else {
        return true
      }
    },
    getAlternateNamesRules(names) {
      if (names.length > 300) {
        return 'Names must be less than 300 characters'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(names)) {
        return 'Names must not content \\/\%\"<>{}\[\]'
      } else if (this.parseStringToArray(names).filter((x,i,a)=>a.indexOf(x)===i).length
          !== this.parseStringToArray(names).length) {
        return 'Duplicates in names'
      } else if (this.parseStringToArray(names).includes(this.newTagName)) {
        return 'Names must not include a tag name'
      } else {
        return true
      }
    },
    getCategoryRules(types) {
      if (types.length == 0) {
        return 'Choose at least one type'
      } else {
        return true
      }
    },
    parseStringToArray(string) {
      string = string.trim()
      string = string.replace(/[\\\/\%"<>{}\[\]]/g, '')
      string = string.replace(/ +(?= )/g,'') // remove multiple spaces
      string = string.split(/[,;]/)
      string = string.filter((el)=>(el != '' && el != ' '))
      string = string.map(s => s.trim())
      return string
    },
    saveTagInfo() {
      this.validate()
      if (!this.warningAgree) {
        if (!this.type.includes('video') && this.tag.type.includes('video') || 
          !this.type.includes('performer') && this.tag.type.includes('performer')) {
          this.dialogWarning = true
          return
        }
      }
      if (this.newTagName) {
        this.newTagName = this.newTagName.trim()
        this.newTagName = this.newTagName.replace(/[\\\/\%"<>{}\[\]]/g, '')
      }
      if (this.isTagNameEditEnabled) {
        // rename tag in videos
        this.$store.getters.videos.filter({'tags': [this.tag.name]}).each(video=>{
          let index = video.tags.indexOf(this.tag.name)
          if (index !== -1) video.tags.splice(index, 1, this.newTagName)
        }).write()
        // rename tag in performers
        this.$store.getters.performers.filter({'tags': [this.tag.name]}).each(performer=>{
          let index = performer.tags.indexOf(this.tag.name)
          if (index !== -1) performer.tags.splice(index, 1, this.newTagName)
        }).write()
        // rename tag in performer tags from videos
        this.$store.getters.performers.filter({'videoTags': [this.tag.name]}).each(performer=>{
          let index = performer.videoTags.indexOf(this.tag.name)
          if (index !== -1) performer.videoTags.splice(index, 1, this.newTagName)
        }).write()
        // rename tag in markers
        this.$store.getters.markers
          .filter(marker => (marker.type=='tag' && marker.name==this.tag.name))
          .each(marker => {marker.name = this.newTagName}).write()
      }

      // remove tag from videos if type "video" was unselected
      if (!this.type.includes('video') && this.tag.type.includes('video')) {
        this.$store.getters.videos.filter({'tags': [this.tag.name]}).each(video=>{
          let index = video.tags.indexOf(this.tag.name)
          if (index !== -1) video.tags.splice(index, 1)
        }).write()
      }

      // remove tag from performers if type "performer" was unselected
      if (!this.type.includes('performer') && this.tag.type.includes('performer')) {
        this.$store.getters.performers.filter({'tags': [this.tag.name]}).each(performer=>{
          let index = performer.tags.indexOf(this.tag.name)
          if (index !== -1) performer.tags.splice(index, 1)
        }).write()
      }

      let altNames = JSON.stringify(this.tagAlternateNames)
      if (altNames !== '' && typeof altNames === 'string') {
        altNames = this.parseStringToArray(altNames)
      }

      let newBookmark
      if (this.$store.state.Bookmarks.bookmarkText) {
        let bookmark = this.$store.getters.bookmarks.get('tags')
                        .find({itemId:this.tag.id})
        newBookmark = true
        if (bookmark.value()) {
          bookmark.assign({ 
            text: this.$store.state.Bookmarks.bookmarkText,
            date: Date.now(),
          }).write()
        } else {
          this.$store.getters.bookmarks.get('tags').push({
            id: shortid.generate(),
            itemId: this.tag.id,
            text: this.$store.state.Bookmarks.bookmarkText,
            date: Date.now(),
          }).write()
        }
      } else {
        this.$store.getters.bookmarks.get('tags')
          .remove({itemId:this.tag.id}).write()
        newBookmark = false
      }

      this.$store.getters.tags
        .find({ id: this.tag.id })
        .assign({
          name: this.newTagName,
          type: this.type,
          category: this.category,
          color: this.tag.color,
          value: this.tag.value,
          favorite: this.favorite,
          bookmark: newBookmark,
          altNames: altNames,
          edit: Date.now(),
        }).write()
      let info = {}
      info.id = this.tag.id
      info.info = true
      info.name = this.newTagName
      info.type = this.type
      info.color = this.tag.color
      info.value = this.tag.value
      info.bookmark = newBookmark
      this.$store.state.Tags.updateInfo = info
      this.$store.state.Tags.dialogEditTag = false
      this.$store.state.Bookmarks.bookmarkText = ''
      ipcRenderer.send('updatePlayerDb', 'tags') // update tag in player window
    },
    getImg() {
      let imgPath = this.getImgUrl(this.tag.id + '_.jpg')
      return this.checkTagImageExist(imgPath)
    },
    getImgUrl(img) {
      return path.join(this.$store.getters.getPathToUserData, `/media/tags/${img}`)
    },
    checkTagImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.$store.getters.getPathToUserData, '/img/templates/tag.png')
      }
    },
    copyTagNameToClipboard() {
      clipboard.writeText(this.tag.name)
    },
  },
};
</script>

<style lang="less">
.color-picker-tags {
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
.edit-tag-dialog-title {
  display: flex;
  flex-wrap: wrap;
}
.edit-tag-dialog-title .headline {
  margin-right: 50px;
}
.cropper.cropper-tag {
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
</style>