<template>
  <v-overlay :value="viewer">
    <v-btn @click="close" icon fab class="close"><v-icon large>mdi-close</v-icon></v-btn>
    <v-progress-circular v-if="loading" indeterminate color="primary" size="100"/>
    <div v-else class="viewer">
      <img @wheel="scroll" @mousemove="drag($event)" @mousedown="dragStart($event)" @mouseup="dragEnd"
        :src="src" :key="src" class="image" :draggable="false"
        :style="`transform: scale(${zoom}) rotate(${rotation}deg); margin-left: ${translateX}px; margin-top: ${translateY}px;`">
      
      <div class="controls">
        <div class="buttons">
          <v-tooltip bottom>
            <template v-slot:activator="{on}">
              <v-btn @click="wheelNavigation=!wheelNavigation" v-on="on" icon fab small outlined class="next ma-1">
                <v-icon v-if="wheelNavigation" large>mdi-arrow-left-right</v-icon>
                <v-icon v-else large>mdi-magnify</v-icon>
              </v-btn>
            </template>
            <span>Toggle Wheel Action</span>
          </v-tooltip>
          <v-btn @click="zoom-=0.1" :disabled="zoom<=1" icon fab small outlined class="next ma-1"><v-icon large>mdi-minus</v-icon></v-btn>
          <v-btn @click="zoom+=0.1" :disabled="zoom>=5" icon fab small outlined class="next ma-1"><v-icon large>mdi-plus</v-icon></v-btn>
          <v-btn @click="prev" :disabled="isPrevDisabled" icon fab small outlined class="prev ma-1"><v-icon large>mdi-chevron-left</v-icon></v-btn>
          <v-btn @click="next" :disabled="isNextDisabled" icon fab small outlined class="next ma-1"><v-icon large>mdi-chevron-right</v-icon></v-btn>
          <v-btn @click="rotation-=90" icon fab small outlined class="next ma-1"><v-icon large>mdi-rotate-left mdi-rotate-270</v-icon></v-btn>
          <v-btn @click="rotation+=90" icon fab small outlined class="next ma-1"><v-icon large>mdi-rotate-right mdi-rotate-90</v-icon></v-btn>
          <v-tooltip bottom>
            <template v-slot:activator="{on}">
              <v-btn @click="resetTransformations" v-on="on" icon fab small outlined class="next ma-1"><v-icon large>mdi-restore</v-icon></v-btn>
            </template>
            <span>Reset Transformations</span>
          </v-tooltip>
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
  components: { vuescroll },
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
    wheelNavigation: true,
    // move: false,
    // dragX: 0,
    // dragY: 0,
    // translateX: 0,
    // translateY: 0,
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
      else this.src = path.join(__static, '/img/default.png')
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
      // this.translateX = 0
    },
    scroll(e) {
      e.preventDefault()
      e.stopPropagation()
      if (this.wheelNavigation) {
        if (e.deltaY>0) this.prev()
        else this.next()
      } else {
        if (e.deltaY>0) { if (this.zoom>1) this.zoom -= 0.1 }
        else this.zoom += 0.1
      }
    },
    // drag(e) {
    //   if (this.move) {
    //     this.translateX = e.clientX - this.dragX
    //     this.translateY = e.clientY - this.dragY
    //   } 
    //   // console.log( e )
    //   // console.log( this.translateX )
    //   // console.log(e.clientX,e.layerX,e.offsetX,e.pageX,e.screenX,)
    // },
    // dragStart(e) {
    //   this.move = true
    //   if (this.translateX == 0) this.dragX = e.clientX
    //   else this.dragX = e.clientX - this.translateX
    //   if (this.translateY == 0) this.dragY = e.clientY
    //   else this.dragY = e.clientY - this.translateY
    // },
    // dragEnd(e) {
    //   this.move = false
    // },
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
  .image {
    height: 100%;
    max-height: 80vh;
    width: auto;
    transition: .2s all ease;
    animation: appear .3s ease;
    background-color: #ccc;
    cursor: grab;
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