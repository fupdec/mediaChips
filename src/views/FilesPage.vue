<template>
  <vuescroll>
    <v-sheet class="folder-path-panel" :class="[{'tabs':tabs.length>0,'side-bar':navigationSide=='1'}]" @mousedown="stopSmoothScroll($event)">
      <vuescroll :ops="ops">
        <div class="folder-path">
          <span v-for="(f,i) in selectedFolder" :key="i" class="item">
            <span v-if="i+1!=selectedFolder.length">
              <v-chip @click="selectFolder(i)" label outlined>{{f}}</v-chip>
              <v-icon small>mdi-chevron-right</v-icon>
            </span>
            <v-chip v-else label>{{f}}</v-chip>
          </span>
          <span v-if="selectedFolder.length==0" class="text--secondary">Please select folder</span>
        </div>
      </vuescroll>
    </v-sheet>
    <div class="files-panel">
      <div fluid class="files-grid">
        <v-lazy v-for="(f,i) in files" :key="i+f.name">
          <v-card class="file-card" :class="[{folder:f.isDir,file:!f.isDir}]" outlined>
            <div v-if="f.isDir" @click="openFolder(i)" class="icon-wrapper">
              <v-icon size="80" class="icon-closed">mdi-folder</v-icon>
              <v-icon size="80" class="icon-open">mdi-folder-open</v-icon>
            </div>
            <div v-else>
              <div class="icon-wrapper">
                <img v-if="isImage(f.ext)" @click="openViewer(i)" :src="getFilePath(i)" height="80" class="image">
                <video v-else-if="f.ext=='.mp4'" :src="getFilePath(i)" width="120" height="80" class="video"/>
                <v-icon v-else size="80">mdi-{{getFileIcon(f.ext)}}</v-icon>
                <v-chip class="ext px-1" small label>{{ f.ext || '???' }}</v-chip>
              </div>
            </div>
            <span class="caption name">{{f.name}}</span>
          </v-card>
        </v-lazy>
      </div>
    </div>
    
    <div v-show="navigationSide=='2'" class="py-6"></div>

    <NavDrawer v-if="$store.state.navDrawer" :openFolderPath="openFolderPath" @selectFolder="pathSplit($event)"/>

    <ImageViewer :viewer="viewer" :files="files" :indexImage="index" :folder="selectedFolder" @close="viewer=false"/>
  </vuescroll>
</template>


<script>
const fs = require('fs')
const path = require('path')
const shell = require('electron').shell

import vuescroll from 'vuescroll'

export default {
  name: 'FilesPage',
  components: {
    vuescroll,
    NavDrawer: () => import('@/components/app/NavDrawer.vue'),
    ImageViewer: () => import('@/components/app/ImageViewer.vue'),
  },
  mounted () {
    this.$nextTick(function () {
      this.$store.state.navDrawer = true
    })
  },
  beforeDestroy() {
    this.$store.state.navDrawer = false
  },
  data: ()=>({
    selectedFolder: [],
    files: [],
    index: 0,
    viewer: false,
    imageExt: ['.jpg','.jpeg','.jfif','.pjpeg','.pjp','.gif','.png','.webp'],
    openFolderPath: '',
    ops: {
      scrollPanel: { scrollingY: false },
      rail: { size: '4px', }
    },
  }),
  computed: {
    navigationSide() { return this.$store.state.Settings.navigationSide },
    tabs() { return this.$store.getters.tabs },
  },
  methods: {
    pathSplit(pathString) { this.selectedFolder = pathString.split(path.sep) },
    selectFolder(index) { 
      this.selectedFolder = this.selectedFolder.slice(0,index+1) 
      this.openFolderPath = this.selectedFolder.join(path.sep)
    },
    openFolder(index) { 
      this.selectedFolder.push(this.files[index].name)
      this.openFolderPath = this.selectedFolder.join(path.sep)
    },
    isImage(ext) { return this.imageExt.includes(ext.toLowerCase()) },
    openViewer(index) { 
      this.index = index
      this.viewer = true
    },
    getFilePath(index) { 
      let file = this.files[index]
      let folder = this.selectedFolder.join(path.sep)
      return path.join(folder, file.name+file.ext) 
    },
    getFileIcon(ext) {
      ext = ext.replace('.', '').toLowerCase()
      let music = ['mp3','aac','m4a','wav','flac','wma','ogg','midi']
      let video = ['wmv','avi','mkv']
      let text = ['txt','ini','doc','docx']
      let archive = ['zip','rar','tar']
      if (music.indexOf(ext)>-1) return 'file-music-outline' 
      else if (video.indexOf(ext)>-1) return 'file-video-outline' 
      else if (text.indexOf(ext)>-1) return 'file-document-outline' 
      else if (archive.indexOf(ext)>-1) return 'zip-box-outline'
      else return 'file-outline' 
    },
    readDir() {
      const dirPath = this.selectedFolder.join(path.sep)
      this.files = []
      fs.readdirSync(dirPath).forEach(file => {
        let stats 
        const filePath = path.join(dirPath, file)
        try { stats = fs.lstatSync(filePath) } 
        catch (err) { return /* console.error(err) */ }
        if (stats) {
          stats.isDir = stats.isDirectory()
          if (stats.isDir) stats.name = file
          else {
            stats.name = path.parse(file).name
            stats.ext = path.parse(file).ext
          }  
          this.files.push(stats)
        }
      })
      this.files = _.orderBy(this.files, 'isDir', ['desc'])
    },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
  },
  watch: {
    selectedFolder() { this.readDir() }
  },
}
</script>


<style lang="scss" scoped>
// TODO Add paddings if running OS is not Windows 
.files-panel {
  padding-top: 40px;
  padding-left: 300px;
}
.files-grid {
  padding: 10px;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
}
.folder-path-panel {
  height: 40px;
  overflow: hidden;
  z-index: 1;
  border-bottom: 1px solid rgba(122, 122, 122, 0.5);
  position: fixed;
  right: 0;
  left: 300px;
  top: calc(48px + 28px);
  &.tabs {
    top: calc(48px + 28px + 28px);  // system bar: 28px, app bar: 48px, tabs: 28px
  }
  &.side-bar {
    margin-left: 56px;
  }
}
.folder-path {
  display: flex;
  align-items: center;
  position: absolute;
  height: 40px;
  padding: 0 8px;
  .item {
    display: flex;
    align-items: center;
    > span {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
    }
  }
  .v-chip {
    padding: 0 5px;
    height: auto;
  }
  .hoverable {
    cursor: pointer;
    transition: .1s all;
    &:hover {
      color: var(--v-primary-base);
    }
  }
}
.file-card {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  &.folder {
    .v-icon {
      cursor: pointer;
    }
  }
  .icon-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    margin-top: 5px;
    .icon-open {
      display: none;
    }
    &:hover {
      .icon-closed {
        display: none;
      }
      .icon-open {
        display: inline-flex;
      }
    }
  }
  .ext {
    pointer-events: none;
    position: absolute;
    bottom: 2px; 
    right: 2px;
    height: auto;
  }
  .image {
    cursor: pointer;
    background-color: #ccc;
    max-width: 130px;
    &:hover {
      transform: scale(2);
      z-index: 1;
    }
  }
  .name {
    line-height: 1.3;
    padding: 5px;
    word-break: break-all;
    text-align: center;
  }
}
</style>