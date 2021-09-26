<template>
  <v-overlay :value="viewer">
    <v-btn @click="close" icon fab class="close"><v-icon large>mdi-close</v-icon></v-btn>
    <v-progress-circular v-if="loading" indeterminate color="primary" size="100"/>
    <div v-else class="viewer">
      <div class="image-wrapper">
        <img :src="src" :key="src" class="image" :style="`transform: scale(${zoom}) rotate(${rotation}deg);`">
      </div>
      
      <div class="controls">
        <div class="buttons">
          <v-btn @click="zoom-=0.1" :disabled="zoom<=1" icon fab small outlined class="next ma-1"><v-icon large>mdi-minus</v-icon></v-btn>
          <v-btn @click="zoom+=0.1" :disabled="zoom>=2" icon fab small outlined class="next ma-1"><v-icon large>mdi-plus</v-icon></v-btn>
          <v-btn @click="prev" :disabled="isPrevDisabled" icon fab small outlined class="prev ma-1"><v-icon large>mdi-chevron-left</v-icon></v-btn>
          <v-btn @click="next" :disabled="isNextDisabled" icon fab small outlined class="next ma-1"><v-icon large>mdi-chevron-right</v-icon></v-btn>
          <v-btn @click="rotation-=90" icon fab small outlined class="next ma-1"><v-icon large>mdi-rotate-left</v-icon></v-btn>
          <v-btn @click="rotation+=90" icon fab small outlined class="next ma-1"><v-icon large>mdi-rotate-right</v-icon></v-btn>
        </div>
      </div>
    </div>
  </v-overlay>
</template>


<script>
const fs = require('fs')
const path = require('path')

import vuescroll from 'vuescroll'

export default {
  name: "ImageViewer",
  props: {
    files: Array,
    indexImage: Number,
    viewer: Boolean,
    folder: Array,
  },
  components: {
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    loading: false,
    src: '',
    index: 0,
    imageExt: ['.jpg','.jpeg','.jfif','.pjpeg','.pjp','.gif','.png','.webp'],
    zoom: 1,
    rotation: 0,
  }),
  computed: {
    images() { return _.filter(this.files, i=>i.isDir?false:this.isImage(i.ext)) },
    isPrevDisabled() { 
      if (this.index==0) return true
      let isPrevDisabled = true
      for (let index = this.index - 1; index >= 0; --index) {
        const file = this.files[index]
        if (file.isDir?false:this.isImage(file.ext)) {
          isPrevDisabled = false
          break
        }
      }
      return isPrevDisabled
    },
    isNextDisabled() { 
      if (this.index+1==this.files.length) return true
      let isNextDisabled = true
      for (let index = this.index + 1; index < this.files.length; ++index) {
        const file = this.files[index]
        if (file.isDir?false:this.isImage(file.ext)) {
          isNextDisabled = false
          break
        }
      }
      return isNextDisabled
    },
  },
  methods: {
    isImage(ext) { return this.imageExt.includes(ext.toLowerCase()) },
    getImage() {
      let file = this.files[this.index]
      if (!file) return ''
      let folder = this.folder.join(path.sep)
      let imagePath = path.join(folder, file.name+file.ext) 
      if (fs.existsSync(imagePath)) this.src = imagePath
      else this.src = path.join(__static, '/img/default.jpg')
    },
    close() { 
      this.$emit('close') 
      this.resetTransformations()
    },
    prev() { 
      if (this.index==0) return false
      for (let index = this.index - 1; index >= 0; --index) {
        const file = this.files[index]
        if (file.isDir?false:this.isImage(file.ext)) {
          this.index = index
          this.getImage()
          break
        }
      }
      this.resetTransformations()
    },
    next() {
      if (this.index+1==this.files.length) return false
      for (let index = this.index + 1; index < this.files.length; ++index) {
        const file = this.files[index]
        if (file.isDir?false:this.isImage(file.ext)) {
          this.index = index
          this.getImage()
          break
        }
      }
      this.resetTransformations()
    },
    resetTransformations() {
      this.zoom = 1
      this.rotation = 0
    },
  },
  watch: {
    indexImage(newIndex) { 
      this.index = newIndex
      this.getImage()
    }
  },
};
</script>


<style lang="scss">
.close {
  position: fixed;
  right: 10px;
  top: 40px;
  padding: 5px;
  background-color: rgba(153, 153, 153, 0.5);
  border-radius: 50px;
  z-index: 5;
}
.viewer {
  .image-wrapper {
    display: flex;
    justify-content: center;
  }
  .image {
    height: 100%;
    max-height: 80vh;
    width: auto;
    transition: .2s all ease;
    animation: appear .3s ease;
    background-color: #ccc;
  }
  .controls {
    position: fixed;
    bottom: 60px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 1;
    animation: appear .1s ease;
    .buttons {
      padding: 5px;
      background-color: rgba(153, 153, 153, 0.5);
      border-radius: 50px;
    }
  }
}
@keyframes appear {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>