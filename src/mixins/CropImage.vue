<script>
const fs = require("fs")
const path = require("path")
const sharp = require('sharp')
import { Cropper, CircleStencil } from 'vue-advanced-cropper'

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
    decodeBase64Image(dataString) {
      var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {}
      if (matches.length !== 3) {
        return new Error('Invalid input string')
      }
      response.type = matches[1]
      response.data = new Buffer(matches[2], 'base64')
      // console.log(response)
      return response
    },
    compressImage(inputImage, outputImagePath, imgType, outputWidth) {
      let sizes = outputWidth ? outputWidth : 400
      let imgQuality = 85
      if (['main','alt','custom1','custom2'].includes(imgType)) {
        sizes = 500
      }
      if (imgType == 'header') {
        sizes = 1400
      }
      if (imgType == 'avatar') {
        sizes = 164
      }
      if (imgType == 'thumb') {
        sizes = { height: 320 }
      }
      const image = sharp(inputImage)
      image.metadata()
        .then(function(metadata) {
          if (imgType != 'thumb') {
            sizes = metadata.width > sizes ? sizes : metadata.width
            sizes = metadata.width < sizes ? metadata.width : sizes
          }
          // TODO: fix thumb size or maybe input size for all types
          return image
            .resize(sizes)
            .jpeg({
              quality: imgQuality,
              chromaSubsampling: '4:4:4'
            })
            .toFile(outputImagePath)
        })
    },
    crop: async function(imgOutputPath, imgType, outputWidth, itemId) {
      let {coordinates, canvas} = this.$refs[imgType].getResult()
			this.coordinates = coordinates
      let imgBuffer = canvas.toDataURL()
      imgBuffer = this.decodeBase64Image(imgBuffer)
      await this.compressImage(imgBuffer.data, imgOutputPath, imgType, outputWidth)
      if (imgOutputPath.includes('tags')) {
        this.$store.state.Tags.updateImage = Date.now()
      }
      if (imgOutputPath.includes('performers')) {
        console.log(itemId)
        this.$store.state.Performers.updateImages = {
          type: imgType,
          key: Date.now(),
          id: itemId
        }
      }
    },
    // upload(event, imgType) {
    //   let input = event.target
		// 	if (input.files && input.files[0]) {
    //     this.images[imgType].display = true
    //     let reader = new FileReader()
    //     reader.onload = (e) => {
    //       this.images[imgType].file = e.target.result
    //       console.log( e.target.result)
    //     }
    //     reader.readAsDataURL(input.files[0])
		// 	}
    // },
    pasteImageFromClipboard: async function(imgType){
      let vueComponent = this
      try {
        const clipboardItems = await navigator.clipboard.read()
        const blobOutput = await clipboardItems[0].getType('image/png')
        vueComponent.images[imgType].file = window.URL.createObjectURL(blobOutput)
        vueComponent.images[imgType].btnColor = "success"
        vueComponent.images[imgType].display = true
        console.log('Image pasted')
        setTimeout(() => {
          vueComponent.images[imgType].btnColor = "primary"
        }, 1000)
      } catch(e) {
        vueComponent.images[imgType].btnColor = "error"
        console.log('Failed to read clipboard')
        setTimeout(() => {
          vueComponent.images[imgType].btnColor = "primary"
        }, 1000)
      }
    },
    getImagePath(imgFolder, imgType) {
      if (imgFolder === 'thumb') {
        return path.join(this.$store.getters.getPathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      }
      return path.join(this.$store.getters.getPathToUserData, `/media/${imgFolder}s/${this[imgFolder].id}_${imgType}.jpg`)
    },
    checkImageExist(imgPath, imgType) {
      if (fs.existsSync(imgPath)) {
        this.images[imgType].file = imgPath
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
.cropper-wrapper {
  border: 1px solid #8080802e; 
  border-radius: 5px;
  padding: 15px;
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