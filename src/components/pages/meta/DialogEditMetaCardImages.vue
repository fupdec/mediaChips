<template>
  <div>
    <v-dialog v-model="$store.state.Meta.dialogEditMetaCardImages" 
      scrollable transition="dialog-bottom-transition" fullscreen persistent>
      <v-card>
        <v-toolbar color="primary">
          <div class="mr-2 headline">Image editing for {{meta.settings.nameSingular.toLowerCase()}} </div>
          <div class="font-weight-bold headline" style="cursor:pointer;">
            <v-tooltip v-model="tooltipCopyName" bottom>
              <template v-slot:activator="{ click }">
                <div v-on="click" @click="copyPerformerNameToClipboard" title="Copy name to clipboard">{{card.meta.name}}</div>
              </template>
              <span>Name copied to clipboard!</span>
            </v-tooltip>
          </div>
          <v-spacer></v-spacer>
          <v-btn @click="close" outlined><v-icon left>mdi-close</v-icon>Close</v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="pt-0">
            <v-container fluid>
              <v-row class="justify-center">
                <v-col cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Main</p>
                    <v-alert v-if="size.main.width && size.main.width<499" type="info" text dense class="caption pa-1">
                      Recomended size 499x{{recHeight}}px
                    </v-alert>
                    <div class="cropper-block">
                      <Cropper :src="images.main.file" ref="main" class="cropper"
                        :stencil-props="{aspectRatio: ar}" :min-height="20" 
                        :defaultSize="defaultSize" @change="updateSize($event, 'main')"/>
                      <div v-if="size.main.width && size.main.height" class="cropper-size">
                        width: {{ size.main.width }}px <br> height: {{ size.main.height }}px</div>
                    </div>
                    <v-btn @click="addImage('main')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.main.display" 
                      @click="cropImage('Main')" color="primary" small class="ml-4" 
                      :loading="imgMainLoading" :disabled="imgMainLoading"
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
                <v-col v-if="meta.settings.imageTypes.includes('alt')" cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Alternate</p>
                    <v-alert v-if="size.alt.width && size.alt.width<499" type="info" text dense class="caption pa-1">
                      Recomended size 499x{{recHeight}}px
                    </v-alert>
                    <div class="cropper-block">
                      <Cropper :src="images.alt.file" ref="alt" class="cropper"
                        :stencil-props="{aspectRatio: ar}" :min-height="20"
                        :defaultSize="defaultSize" @change="updateSize($event, 'alt')"/>
                      <div v-if="size.alt.width && size.alt.height" class="cropper-size">
                        width: {{ size.alt.width }}px <br> height: {{ size.alt.height }}px</div>
                    </div>
                    <v-btn @click="addImage('alt')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.alt.display" 
                      @click="cropImage('Alt')" color="primary" small class="ml-4" 
                      :loading="imgAltLoading" :disabled="imgAltLoading"  
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
                <v-col v-if="meta.settings.imageTypes.includes('custom1')" cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">First additional</p>
                    <v-alert v-if="size.custom1.width && size.custom1.width<499" type="info" text dense class="caption pa-1">
                      Recomended size 499x{{recHeight}}px
                    </v-alert>
                    <div class="cropper-block">
                      <Cropper :src="images.custom1.file" ref="custom1" class="cropper"
                        :stencil-props="{aspectRatio: ar}" :min-height="20" 
                        :defaultSize="defaultSize" @change="updateSize($event, 'custom1')"/>
                      <div v-if="size.custom1.width && size.custom1.height" class="cropper-size">
                        width: {{ size.custom1.width }}px <br> height: {{ size.custom1.height }}px</div>
                    </div>
                    <v-btn @click="addImage('custom1')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.custom1.display" 
                      @click="cropImage('Custom1')" color="primary" small class="ml-4"
                      :loading="imgCustom1Loading" :disabled="imgCustom1Loading"  
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
                <v-col v-if="meta.settings.imageTypes.includes('custom2')" cols="12" lg="3" md="6" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Second additional</p>
                    <v-alert v-if="size.custom2.width && size.custom2.width<499" type="info" text dense class="caption pa-1">
                      Recomended size 499x{{recHeight}}px
                    </v-alert>
                    <div class="cropper-block">
                      <Cropper :src="images.custom2.file" ref="custom2" class="cropper"
                        :stencil-props="{aspectRatio: ar}" :min-height="20"
                        :defaultSize="defaultSize" @change="updateSize($event, 'custom2')"/>
                      <div v-if="size.custom2.width && size.custom2.height" class="cropper-size">
                        width: {{ size.custom2.width }}px <br> height: {{ size.custom2.height }}px</div>
                    </div>
                    <v-btn @click="addImage('custom2')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.custom2.display" 
                      @click="cropImage('Custom2')" color="primary" small class="ml-4" 
                      :loading="imgCustom2Loading" :disabled="imgCustom2Loading"  
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
                <v-col v-if="meta.settings.imageTypes.includes('avatar')" cols="12" md="4" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Avatar</p>
                    <v-alert v-if="size.avatar.width && size.avatar.width<164" type="info" text dense class="caption pa-1">
                      Recomended size 164x164px
                    </v-alert>
                    <div class="cropper-block">
                      <Cropper :src="images.avatar.file" ref="avatar" class="cropper" 
                        :stencilComponent="$options.components.CircleStencil" 
                        :defaultSize="defaultSize" @change="updateSize($event, 'avatar')"/>
                      <div v-if="size.avatar.width && size.avatar.height" class="cropper-size">
                        width: {{ size.avatar.width }}px <br> height: {{ size.avatar.height }}px</div>
                    </div>
                    <v-btn @click="addImage('avatar')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.avatar.display" 
                      @click="cropImage('Avatar')" color="primary" small class="ml-4" 
                      :loading="imgAvatarLoading" :disabled="imgAvatarLoading"  
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
                <v-col v-if="meta.settings.imageTypes.includes('header')" cols="12" md="8" class="mb-1" align="center">
                  <div class="cropper-wrapper">
                    <p class="overline mb-0">Header</p>
                    <v-alert v-if="size.header.width && size.header.width<1400" type="info" text dense class="caption pa-1">
                      Recomended size 609x1400px
                    </v-alert>
                    <div class="cropper-block">
                      <Cropper :src="images.header.file" ref="header" class="cropper"
                        :stencil-props="{aspectRatio: 2.3}" :min-height="20" 
                        :defaultSize="defaultSize" @change="updateSize($event, 'header')"/>
                      <div v-if="size.header.width && size.header.height" class="cropper-size">
                        width: {{ size.header.width }}px <br> height: {{ size.header.height }}px</div>
                    </div>
                    <v-btn @click="addImage('header')" color="green" icon small>
                      <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <v-btn v-if="images.header.display" 
                      @click="cropImage('Header')" color="primary" small class="ml-4" 
                      :loading="imgHeaderLoading" :disabled="imgHeaderLoading" 
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
    <v-dialog v-model="dialogDeleteImage" max-width="500px" persistent>
      <v-card>
        <v-toolbar color="error">
          <div class="headline"> Delete image? </div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteImage=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteImage(deleteImageType)" outlined> <v-icon left>mdi-check</v-icon>Yes</v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div class="red--text">The image will be permanently deleted!</div>  
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const { clipboard } = require('electron')
const fs = require("fs")

import vueFilePond from 'vue-filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginFileEncode from 'filepond-plugin-file-encode'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
const FilePond = vueFilePond(FilePondPluginFileEncode, FilePondPluginFileValidateType)

import CropImage from '@/mixins/CropImage'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import vuescroll from 'vuescroll'

export default {
  name: "DialogEditMetaCardImages",
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
      this.checkImageExist(this.getImagePath(`meta/${this.metaId}`,'main', this.card.id), 'main')
      this.checkImageExist(this.getImagePath(`meta/${this.metaId}`,'alt', this.card.id), 'alt')
      this.checkImageExist(this.getImagePath(`meta/${this.metaId}`,'custom1', this.card.id), 'custom1')
      this.checkImageExist(this.getImagePath(`meta/${this.metaId}`,'custom2', this.card.id), 'custom2')
      this.checkImageExist(this.getImagePath(`meta/${this.metaId}`,'avatar', this.card.id), 'avatar')
      this.checkImageExist(this.getImagePath(`meta/${this.metaId}`,'header', this.card.id), 'header')
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
    isImageEdited: false,
    size: {
      main: {
        width: null,
        height: null,
      },
      alt: {
        width: null,
        height: null,
      },
      custom1: {
        width: null,
        height: null,
      },
      custom2: {
        width: null,
        height: null,
      },
      avatar: {
        width: null,
        height: null,
      },
      header: {
        width: null,
        height: null,
      },
    },
  }),
  computed: {
    metaId() { return this.$route.query.metaId },
    meta() { return this.$store.getters.meta.find({id: this.metaId}).value() },
    card() {
      let ids = this.$store.state.Meta.selectedMeta
      let metaCards = this.$store.getters.metaCards.filter({metaId:this.metaId})
      let cardId = this.$router.currentRoute.query.cardId
      if (this.$route.path.includes('/metacard/') && cardId) return metaCards.find({id:cardId}).value()
      else return metaCards.find({id:ids[0]}).value()
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    recHeight() { return Math.floor(499/this.ar) },
    ar () { return this.meta.settings.imageAspectRatio || 1 },
  },
  methods: {
    addImage(imgType) {
      this.addImageType = imgType
      this.dialogAddImage = true
    },
    hideDialogAddImage(addImageType) { setTimeout(()=>{ if (this.images[addImageType].btnColor !== 'error') setTimeout(()=>{ this.dialogAddImage = false }, 300) }, 500) },
    handleFileError(error) { this.uploadedImageError = error },
    handleFile(imgType) {
      if (this.uploadedImageError !== null) { this.uploadedImageError = null; return }
      let imgBase64 = this.$refs.pond.getFiles()[0].getFileEncodeDataURL()
      this.images[imgType].display = true
      this.images[imgType].file = imgBase64
      setTimeout(()=>{ this.dialogAddImage = false }, 300)
    },
    copyPerformerNameToClipboard(dialog) {
      if(dialog == 'find') this.tooltipCopyPerformerName = true
      else this.tooltipCopyName = true
      setTimeout(() => {
        this.tooltipCopyName = false
        this.tooltipCopyPerformerName = false
      }, 3000)
      clipboard.writeText(this.card.meta.name)
    },
    displayDeleteButton(imgType) {
      if (this.images[imgType].display) {
        if (this.images[imgType].file.includes('blob:')) return false
        else return true
      }
    },
    cropImage(imgType) {
      let imgTypeLower = imgType.toLowerCase()
      let imagePath = this.getImagePath(`meta/${this.metaId}`,imgTypeLower,this.card.id)
      this.crop(imagePath, imgTypeLower)
      this.loader = `img${imgType}Loading`
      setTimeout(() => {
        this.images[imgTypeLower].file = imagePath
        this.images[imgTypeLower].display = true
      }, 1000)
      this.isImageEdited = true
    },
    deleteImage(imgType) {
      fs.unlink(this.getImagePath(`meta/${this.metaId}`,imgType,this.card.id), (err) => {
        if (err) {
          this.$store.commit('addLog', {type: 'error',text: "failed to delete local image:"+err})
          // console.log("failed to delete local image:"+err);
        } else {
          // console.log('successfully deleted local image');  
          let imageType
          switch (imgType) {
            case 'alt': imageType = 'alternative'; break;
            case 'custom1': imageType = 'first additional'; break;
            case 'custom2': imageType = 'second additional'; break;
            default: imageType = imgType; break;
          }
          let text = `Deleted ${imageType} image of ${this.meta.settings.nameSingular} "${this.card.meta.name}"`
          this.$store.commit('addLog', { type:'info', text:text })
        }
      })
      this.images[imgType].file = ''
      this.images[imgType].display = false
      this.isImageEdited = true
      this.dialogDeleteImage = false
    },
    close() {
			this.$store.state.Meta.dialogEditMetaCardImages = false
      if (this.isImageEdited) this.$store.commit('updateMetaCards', [this.card.id])
		},
    updateSize({ coordinates }, type) {
			this.size[type].width = Math.round(coordinates.width);
			this.size[type].height = Math.round(coordinates.height);
		},
    defaultSize({ imageSize, visibleArea }) {
			return {
				width: (visibleArea || imageSize).width,
				height: (visibleArea || imageSize).height,
			}
		},
  },
};
</script>