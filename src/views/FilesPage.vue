<template>
  <div>
    <div class="files-panel">
      <vuescroll>
        <div class="py-1 px-2 folder-path">
          <span v-for="(f,i) in selectedFolder" :key="i">
            <span v-if="i+1!=selectedFolder.length">
              <v-chip @click="selectFolder(i)" label outlined>{{f}}</v-chip>
              <v-icon small>mdi-chevron-right</v-icon>
            </span>
            <v-chip v-else label>{{f}}</v-chip>
          </span>
        </div>
        <hr>

        <v-container v-if="files.length" fluid class="files-grid">
          <v-card v-for="(f,i) in files" :key="i" class="file-card" :class="[{folder:f.isDir,file:!f.isDir}]" outlined>
            <div v-if="f.isDir" @click="openFolder(i)" class="icon-wrapper">
              <v-icon size="80" class="icon-closed">mdi-folder</v-icon>
              <v-icon size="80" class="icon-open">mdi-folder-open</v-icon>
            </div>
            <div v-else>
              <div class="icon-wrapper">
                <img v-if="isImage(f.ext)" @click="openViewer(i)" :src="getImagePath(i)" height="80" class="image">
                <v-icon v-else size="80">mdi-file-outline</v-icon>
                <v-chip class="ext px-1" small label>{{ f.ext || '???' }}</v-chip>
              </div>
            </div>
            <span class="caption name">{{f.name}}</span>
          </v-card>
          <div v-show="navigationSide=='2'" class="py-6"></div>
        </v-container>
        <div v-else class="empty-folder"> <v-icon size="120">mdi-folder-open-outline</v-icon> Folder is empty </div>
      </vuescroll>
    </div>

    <NavDrawer v-if="$store.state.navDrawer" :openFolderPath="openFolderPath" @selectFolder="pathSplit($event)"/>

    <ImageViewer :viewer="viewer" :files="files" :indexImage="index" :folder="selectedFolder" @close="viewer=false"/>
  </div>
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
  }),
  computed: {
    navigationSide() {return this.$store.state.Settings.navigationSide},
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
    getImagePath(index) { 
      let file = this.files[index]
      let folder = this.selectedFolder.join(path.sep)
      return path.join('file://', folder, file.name+file.ext) 
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
          stats.name = path.parse(file).name
          stats.isDir = stats.isDirectory()
          if (!stats.isDir) stats.ext = path.parse(file).ext
          this.files.push(stats)
        }
      })
      this.files = _.orderBy(this.files, 'isDir', ['desc'])
    }
  },
  watch: {
    selectedFolder() { this.readDir() }
  },
}
</script>


<style lang="scss" scoped>
.files-grid {
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
}
.files-panel {
  padding-left: 300px;
}
.folder-path {
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
.empty-folder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.5em;
  margin: 20% 30%;
}
</style>