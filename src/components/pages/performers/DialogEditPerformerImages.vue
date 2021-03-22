<template>
  <div>
    <v-dialog v-model="$store.state.Performers.dialogEditPerformerImages" 
      scrollable transition="dialog-bottom-transition" fullscreen persistent>
      <v-card>
        <v-card-title class="edit-card-title">
          <div class="ml-4 mr-2 headline">Edit images of </div>
          <div class="font-weight-bold headline" style="cursor:pointer;">
            <v-tooltip v-model="tooltipCopyName" bottom>
              <template v-slot:activator="{ click }">
                <div v-on="click" @click="copyPerformerNameToClipboard" 
                  title="Copy name to clipboard"
                > {{performer.name}} 
                </div>
              </template>
              <span>Name copied to clipboard!</span>
            </v-tooltip>
          </div>
          
          <v-spacer></v-spacer>

          <v-btn @click="$store.state.Performers.dialogEditPerformerImages=false" class="ma-4"
            dark outlined> <v-icon left>mdi-close</v-icon> Close </v-btn>
        </v-card-title>
        <vuescroll>
          <v-card-text class="pt-0">
            <v-container fluid>
              <v-row>
                <v-col cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Main</p>
                    <Cropper
                      :src="images.main.file"
                      ref="main"
                      class="cropper"
                      :stencil-props="{aspectRatio: 5/8}"
                      :min-height="20"
                    />
                    <v-btn @click="addImage('main')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.main.display" 
                      @click="crop(getImagePath('performer','main'), 'main', null, performer.id), loader = 'imgMainLoading'" 
                      color="primary" small class="ml-4" :loading="imgMainLoading" :disabled="imgMainLoading"
                    > <v-icon left>mdi-crop</v-icon> Save
                      <template v-slot:loader>
                        <span class="custom-loader">
                          <v-icon>mdi-cached</v-icon>
                        </span>
                      </template>
                    </v-btn>
                    <v-btn 
                      v-if="displayDeleteButton('main')" 
                      @click="dialogDeleteImage=true,deleteImageType='main'"
                      class="ml-2" color="red" small icon
                    ><v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </div>
                </v-col>
                <v-col cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Alternate</p>
                    <Cropper
                      :src="images.alt.file"
                      ref="alt"
                      class="cropper"
                      :stencil-props="{aspectRatio: 5/8}"
                      :min-height="20"
                    />
                    <v-btn @click="addImage('alt')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.alt.display" 
                      @click="crop(getImagePath('performer','alt'), 'alt', null, performer.id), loader = 'imgAltLoading'" 
                      color="primary" small class="ml-4" :loading="imgAltLoading" :disabled="imgAltLoading"  
                    > <v-icon left>mdi-crop</v-icon> Save
                      <template v-slot:loader>
                        <span class="custom-loader">
                          <v-icon>mdi-cached</v-icon>
                        </span>
                      </template>
                    </v-btn>
                    <v-btn 
                      v-if="displayDeleteButton('alt')" 
                      @click="dialogDeleteImage=true,deleteImageType='alt'"
                      class="ml-2" color="red" small icon
                    ><v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </div>
                </v-col>
                <v-col cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">First additional</p>
                    <Cropper
                      :src="images.custom1.file"
                      ref="custom1"
                      class="cropper"
                      :stencil-props="{aspectRatio: 5/8}"
                      :min-height="20"
                    />
                    <v-btn @click="addImage('custom1')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.custom1.display" 
                      @click="crop(getImagePath('performer','custom1'), 'custom1', null, performer.id), loader = 'imgCustom1Loading'" 
                      color="primary" small class="ml-4" :loading="imgCustom1Loading" :disabled="imgCustom1Loading"  
                    > <v-icon left>mdi-crop</v-icon> Save
                      <template v-slot:loader>
                        <span class="custom-loader">
                          <v-icon>mdi-cached</v-icon>
                        </span>
                      </template>
                    </v-btn>
                    <v-btn 
                      v-if="displayDeleteButton('custom1')" 
                      @click="dialogDeleteImage=true,deleteImageType='custom1'" 
                      class="ml-2" color="red" small icon
                    ><v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </div>
                </v-col>
                <v-col cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Second additional</p>
                    <Cropper
                      :src="images.custom2.file"
                      ref="custom2"
                      class="cropper"
                      :stencil-props="{aspectRatio: 5/8}"
                      :min-height="20"
                    />
                    <v-btn @click="addImage('custom2')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.custom2.display" 
                      @click="crop(getImagePath('performer','custom2'), 'custom2', null, performer.id), loader = 'imgCustom2Loading'" 
                      color="primary" small class="ml-4" :loading="imgCustom2Loading" :disabled="imgCustom2Loading"  
                    > <v-icon left>mdi-crop</v-icon> Save
                      <template v-slot:loader>
                        <span class="custom-loader">
                          <v-icon>mdi-cached</v-icon>
                        </span>
                      </template>
                    </v-btn>
                    <v-btn 
                      v-if="displayDeleteButton('custom2')" 
                      @click="dialogDeleteImage=true,deleteImageType='custom2'" 
                      class="ml-2" color="red" small icon
                    ><v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </div>
                </v-col>
                <v-col cols="12" md="4" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Avatar</p>
                    <Cropper
                      :src="images.avatar.file"
                      ref="avatar"
                      class="cropper"
                      :stencilComponent="$options.components.CircleStencil"
                    />
                    <v-btn @click="addImage('avatar')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.avatar.display" 
                      @click="crop(getImagePath('performer','avatar'), 'avatar', null, performer.id), loader = 'imgAvatarLoading'" 
                      color="primary" small class="ml-4" :loading="imgAvatarLoading" :disabled="imgAvatarLoading"  
                    > <v-icon left>mdi-crop</v-icon> Save
                      <template v-slot:loader>
                        <span class="custom-loader">
                          <v-icon>mdi-cached</v-icon>
                        </span>
                      </template>
                    </v-btn>
                    <v-btn 
                      v-if="displayDeleteButton('avatar')" 
                      @click="dialogDeleteImage=true,deleteImageType='avatar'" 
                      class="ml-2" color="red" small icon
                    ><v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </div>
                </v-col>
                <v-col cols="12" md="8" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Header</p>
                    <Cropper
                      :src="images.header.file"
                      ref="header"
                      class="cropper"
                      :stencil-props="{aspectRatio: 2.3}"
                      :min-height="20"
                    />
                    <v-btn @click="addImage('header')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.header.display" 
                      @click="crop(getImagePath('performer','header'), 'header', null, performer.id), loader = 'imgHeaderLoading'" 
                      color="primary" small class="ml-4" :loading="imgHeaderLoading" :disabled="imgHeaderLoading" 
                    > <v-icon left>mdi-crop</v-icon> Save
                      <template v-slot:loader>
                        <span class="custom-loader">
                          <v-icon>mdi-cached</v-icon>
                        </span>
                      </template>
                    </v-btn>
                    <v-btn 
                      v-if="displayDeleteButton('header')" 
                      @click="dialogDeleteImage=true,deleteImageType='header'" 
                      class="ml-2" color="red" small icon
                    ><v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogAddImage" max-width="600px" >
      <v-card>
        <file-pond
          ref="pond" label-idle="Drop image here or click for upload" class="pa-4"
          :allow-multiple="false" :files="uploadedImage" @addfile="handleFile(addImageType)"
          accepted-file-types="image/*" @error="handleFileError($event)"
        />
        <div class="text-center">OR</div>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="pasteImageFromClipboard(addImageType), hideDialogAddImage(addImageType)" 
            class="ma-4" :color="images[addImageType].btnColor">
            <v-icon left>mdi-clipboard-outline</v-icon> Paste from clipboard
          </v-btn>
          <v-spacer/>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDeleteImage" max-width="360px" persistent>
      <v-card>
        <v-card-title class="headline red--text"> Delete image?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-database-remove</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn @click="dialogDeleteImage = false" class="ma-4"> No </v-btn>
          <v-spacer/>
          <v-btn @click="deleteImage(deleteImageType),dialogDeleteImage = false" 
            class="red ma-4" dark> <v-icon left>mdi-delete-alert</v-icon> Yes </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const fs = require("fs")
const path = require("path")

import vueFilePond from 'vue-filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginFileEncode from 'filepond-plugin-file-encode'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
const FilePond = vueFilePond(FilePondPluginFileEncode, FilePondPluginFileValidateType)

import CropImage from '@/mixins/CropImage'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import vuescroll from 'vuescroll'

export default {
  name: "DialogEditPerformerImages",
  components: {
    FilePond,
    vuescroll,
	},
  mixins: [CropImage, ShowImageFunction], 
  created() {
    this.$set(this.images, 'main',    this.getImageObject())
    this.$set(this.images, 'alt',     this.getImageObject())
    this.$set(this.images, 'custom1', this.getImageObject())
    this.$set(this.images, 'custom2', this.getImageObject())
    this.$set(this.images, 'avatar',  this.getImageObject())
    this.$set(this.images, 'header',  this.getImageObject())
  },
  mounted () {
    this.$nextTick(function () {
      this.checkImageExist(this.getImagePath('performer','main'), 'main')
      this.checkImageExist(this.getImagePath('performer','alt'), 'alt')
      this.checkImageExist(this.getImagePath('performer','custom1'), 'custom1')
      this.checkImageExist(this.getImagePath('performer','custom2'), 'custom2')
      this.checkImageExist(this.getImagePath('performer','avatar'), 'avatar')
      this.checkImageExist(this.getImagePath('performer','header'), 'header')
    })
  },
  data: () => ({
    imgMainLoading: null,
    imgAltLoading: null,
    imgCustom1Loading: null,
    imgCustom2Loading: null,
    imgAvatarLoading: null,
    imgHeaderLoading: null,
    tooltipCopyName: false,
    tooltipCopyPerformerName: false,
    uploadedImageError: null,
    uploadedImage: null,
    dialogAddImage: false,
    addImageType: 'main',
    dialogDeleteImage: false,
    deleteImageType: '',
  }),
  computed: {
    performer() {
      let id = this.$store.getters.getSelectedPerformers
      let ps = this.$store.getters.performers
      if (this.$route.path.includes('/performer/:') && this.$router.currentRoute.params.id) {
        if (this.$router.currentRoute.params.id.substring(1)) {
          return ps.find({id:this.$router.currentRoute.params.id.substring(1)}).value()
        } 
      } else if (id.length>0) {
        return ps.find({id:id[0]}).value()
      } else {
        return ps.find('id').value()
      }
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    addImage(imgType) {
      this.addImageType = imgType
      this.dialogAddImage = true
    },
    hideDialogAddImage(addImageType) {
      setTimeout(()=>{ 
        if (this.images[addImageType].btnColor !== 'error') {
          setTimeout(()=>{ this.dialogAddImage = false }, 300)
        }
      }, 500)
    },
    handleFileError(error) {
      this.uploadedImageError = error
    },
    handleFile(imgType) {
      if (this.uploadedImageError !== null) {
        this.uploadedImageError = null
        return
      }
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images[imgType].display = true
      this.images[imgType].file = imgBase64
      setTimeout(()=>{ this.dialogAddImage = false }, 300)
    },
    getImg() {
      let imgAvaPath = this.getImgUrl(this.performer.id + '_avatar.jpg')
      let imgMainPath = this.getImgUrl(this.performer.id + '_main.jpg')
      return 'file://' + this.checkAvatarImageExist(imgAvaPath, imgMainPath)
    },
    getImgUrl(img) {
      return  path.join(this.pathToUserData, `/media/performers/${img}`)
    },
    checkAvatarImageExist(imgAvaPath, imgMainPath) {
      if (fs.existsSync(imgAvaPath)) {
        return imgAvaPath
      } else if (fs.existsSync(imgMainPath)) {
        return imgMainPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/performer.png')
      }
    },
    copyPerformerNameToClipboard(dialog) {
      if(dialog == 'find') {
        this.tooltipCopyPerformerName = true
      } else {
        this.tooltipCopyName = true
      }
      setTimeout(() => {
        this.tooltipCopyName = false
        this.tooltipCopyPerformerName = false
      },3000)
      navigator.clipboard.writeText(this.performer.name).then(function() {
        console.log('Async: Copying to clipboard was successful!');
      }, function(err) {
        console.error('Async: Could not copy text: ', err);
      });
    },
    displayDeleteButton(imgType) {
      if (this.images[imgType].display) {
        if (this.images[imgType].file.includes('blob:')) {
          return false
        } else return true
      }
    },
    deleteImage(imgType) {
      fs.unlink(this.getImagePath('performer',imgType), (err) => {
        if (err) {
          console.log("failed to delete local image:"+err);
        } else {
          console.log('successfully deleted local image');                                
        }
      })
      this.images[imgType].file = ''
      this.images[imgType].display = false
      this.$store.state.Performers.updateImages = {
        type: imgType,
        key: Date.now(),
        id: this.performer.id
      }
    },
  },
  watch: {
  }
}
</script>