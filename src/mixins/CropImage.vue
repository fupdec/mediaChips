<script>
const fs = require('fs')
const path = require('path')

import jimp from 'jimp'
import { Cropper, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

export default {
  components: {
    Cropper, CircleStencil
  },
  created() {
    // this.$set(this.images, 'main', this.getImageObject()) // sample
  },
  data: () => ({
    loader: null,
    images: {},
    coordinates: {
      width: 0,
      height: 0,
      left: 0,
      top: 0
    },
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData }
  },
  methods: {
    getImageObject() {
      const image = {
        file: null,
        cropped: null,
        display: false,
        btnColor: "primary",
      }
      return image
    },
    compressImage(inputImage, outputImagePath, imgType, outputWidth) {
      let sizes = {} 
      sizes.height = jimp.AUTO
      sizes.width = outputWidth ? outputWidth : 400
      if (['main','alt','custom1','custom2'].includes(imgType)) {
        sizes.width = 500
      }
      if (imgType == 'header') {
        sizes.width = 1400
      }
      if (imgType == 'avatar') {
        sizes.width = 164
      }
      if (imgType == 'thumb') {
        sizes.height = 320
        sizes.width = jimp.AUTO
      }
      const buffer = Buffer.from(inputImage, "base64")
      jimp.read(buffer)
        .then(image => {
          if (imgType != 'thumb') {
            if (image.bitmap.width < sizes.width) {
              sizes.width = image.bitmap.width
            }
          }
          return image
            .resize(sizes.width, sizes.height)
            .quality(85)
            .write(outputImagePath)
        })
        .catch(err => {
          console.error(err)
        })
    },
    crop: async function(imgOutputPath, imgType, outputWidth, itemId) {
      let {coordinates, canvas} = this.$refs[imgType].getResult()
			this.coordinates = coordinates
      let imgBuffer = canvas.toDataURL()
      imgBuffer = imgBuffer.replace(/^data:image\/\w+;base64,/, '')
      await this.compressImage(imgBuffer, imgOutputPath, imgType, outputWidth)
    },
    pasteImageFromClipboard: async function(imgType){
      let vm = this
      try {
        const clipboardItems = await navigator.clipboard.read()
        const blobOutput = await clipboardItems[0].getType('image/png')
        vm.images[imgType].file = window.URL.createObjectURL(blobOutput)
        vm.images[imgType].btnColor = "success"
        vm.images[imgType].display = true
        // console.log('Image pasted')
        setTimeout(() => {
          vm.images[imgType].btnColor = "primary"
        }, 1000)
      } catch(e) {
        vm.images[imgType].btnColor = "error"
        // console.log('Failed to read clipboard')
        setTimeout(() => {
          vm.images[imgType].btnColor = "primary"
        }, 1000)
      }
    },
    getImagePath(imgFolder, imgType, id) {
      if (imgFolder==='thumb') return path.join(this.pathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      if (imgFolder.includes('meta')) return path.join(this.pathToUserData,'/media/',`${imgFolder}/`,`${id}_${imgType}.jpg`)
      return path.join(this.pathToUserData, `/media/${imgFolder}s/${this[imgFolder].id}_${imgType}.jpg`)
    },
    checkImageExist(imgPath, imgType) {
      if (fs.existsSync(imgPath)) {
        this.images[imgType].file = path.join('file://', imgPath)
        this.images[imgType].display = true
      } else {
        this.images[imgType].file = ''
        this.images[imgType].display = false
      }
    },
  },
  watch: {
    loader () {
      const l = this.loader
      this[l] = !this[l]
      setTimeout(() => (this[l] = false), 3000)
      this.loader = null
    },
  },
}
</script>

<style lang="less">
.theme--light {
  .cropper-wrapper {
    border-color: rgba(0, 0, 0, 0.38); 
    &:hover {
      border-color: rgb(0, 0, 0); 
    }
  }
}
.theme--dark {
  .cropper-wrapper {
    border-color: rgba(255, 255, 255, 0.38); 
    &:hover {
      border-color: rgb(255, 255, 255); 
    }
  }
}
.cropper-wrapper {
  border-width: 1px; 
  border-style: solid;
  border-radius: 5px;
  padding: 15px;
  transition: .3s border;
  .cropper {
    min-height: 200px;
    max-height: 400px;
    max-width: 100%;
    margin-top: 10px;
    margin-bottom: 10px;
    background-color: #0000000a;
    &:before {
      content: "no image";
      text-transform: uppercase;
      opacity: 0.5;
      background: #cccccc24;
      top: 0;
      bottom: 0;
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
  }
  .upload-btn input {
    display: none;
  }
  .custom-loader {
    animation: loader 1s infinite;
    display: flex;
  }
  @keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>