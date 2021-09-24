<template>
  <vuescroll>
    <div class="py-1 px-2 folder-path">
      <span v-for="(f,i) in selectedFolder" :key="i">
        <span v-if="i+1!=selectedFolder.length">
          <span @click="selectFolder(i)" class="hoverable">{{f}}</span>
          <v-icon small>mdi-chevron-right</v-icon>
        </span>
        <span v-else>{{f}}</span>
      </span>
    </div>
    <hr>

    <v-container fluid class="card-grid card-size-2 gap-size-2">
      <v-card v-for="(f,i) in files" :key="i" class="meta-card file-card">
        <span v-if="f.isDir">
          <v-icon>mdi-folder-outline</v-icon>
        </span>
        <span v-else>
          <img v-if="isImage(f.ext)" :src="getImagePath(i)" height="100">
          <v-icon>mdi-file-outline</v-icon>
          <span class="ext">{{ f.ext || '???' }}</span>
        </span>
        <div>{{f.name}}</div>
      </v-card>
    </v-container>

    <NavDrawer v-if="$store.state.navDrawer" @selectFolder="pathSplit($event)"/>

    <div v-show="navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>


<script>
const fs = require('fs')
const path = require('path')

import vuescroll from 'vuescroll'

export default {
  name: 'FilesPage',
  components: {
    vuescroll,
    NavDrawer: () => import('@/components/app/NavDrawer.vue'),
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
    imageExt: ['.jpg','.jpeg','.jfif','.pjpeg','.pjp','.gif','.png','.webp'],
  }),
  computed: {
    navigationSide() {return this.$store.state.Settings.navigationSide},
  },
  methods: {
    pathSplit(pathString) { this.selectedFolder = pathString.split(path.sep) },
    selectFolder(index) { this.selectedFolder = this.selectedFolder.slice(0,index+1) },
    isImage(ext) { return this.imageExt.includes(ext) },
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
        catch (err) { console.error(err) }
        if (stats) {
          console.log(stats)
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
.folder-path {
  .hoverable {
    cursor: pointer;
    transition: .1s all;
    &:hover {
      color: var(--v-primary-base);
    }
  }
}
.file-card {
  .ext {
    border-radius: 3px;
    border-width: 1px;
    border-style: solid;
    padding: 0 3px 1px;
  }
}
</style>