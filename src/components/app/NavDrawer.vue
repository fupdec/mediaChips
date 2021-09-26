<template>
  <v-card class="folder-tree" outlined rounded="0" :class="[{tabs:tabs.length>0,'bottom-bar':navigationSide=='2'}]">
    <v-card-actions>
      <v-select v-model="selectedDisk" :items="disks" label="Choose disk" solo dense
        prepend-icon="mdi-harddisk" hide-details class="disks" @change="selectDisk"
        :menu-props="{contentClass:'disks'}" item-text="_mounted" item-value="_mounted">
        <template v-slot:selection="data">
          <div class="mounted">{{data.item._mounted}}</div>
          <div class="space">{{calcSize(data.item._blocks)}}</div>
          <v-progress-linear :value="data.item._capacity" height="20" color="secondary">
            {{data.item._capacity}}
          </v-progress-linear>
        </template>
        <template v-slot:item="data">
          <div class="mounted">{{data.item._mounted}}</div>
          <div class="space">{{calcSize(data.item._blocks)}}</div>
          <v-progress-linear :value="data.item._capacity" height="20" color="secondary">
            {{data.item._capacity}}
          </v-progress-linear>
        </template>
      </v-select>
    </v-card-actions>
    
    <vuescroll>
      <v-card-text v-if="updatingFolderTree" class="text-center">
        <h3 class="mb-2">Creating a folder tree...</h3>
        <v-icon x-large class="loading-animation">mdi-loading</v-icon>
      </v-card-text>
      <v-card-text v-else class="pa-0">
        <v-treeview 
          :items="folders" 
          :load-children="loadChildren" 
          :open.sync="openIds" 
          item-key="path" 
          item-text="name" 
          dense hoverable 
          expand-icon="mdi-chevron-down"
        >
          <template v-slot:prepend="{ item, open }">
            <div @mouseup="selectFolder(item)" class="folder-icon">
              <v-icon size="18" :color="item.path==selectedFolder?'primary':''">
              {{ open ? 'mdi-folder-open' : 'mdi-folder' }}</v-icon>
            </div>
          </template>
          <template slot="label" slot-scope="{ item }">
            <span @mouseup="selectFolder(item)" 
              class="item-name" 
              :class="[{'selected':item.path==selectedFolder}]">
              {{ item.name }}
            </span>
          </template>
        </v-treeview>
      </v-card-text>
    </vuescroll>
  </v-card>
</template>


<script>
const fs = require("fs")
const path = require("path")
const nodeDiskInfo = require('node-disk-info')

import vuescroll from 'vuescroll'
import Functions from '@/mixins/Functions'

export default {
  name: 'NavDrawer',
  props: {
    openFolderPath: String,
  },
  components: {
    vuescroll,
  },
  mixins: [Functions],
  mounted () {
    this.$nextTick(function () {
      this.initFolderTree()
    })
  },
  data: () => ({
    updatingFolderTree: false,
    selectedFolder: '',
    folders: [],
    disks: [],
    prevSelectedFolders: [],
    depth: 2,
    openIds: [],
    excludes: ['.git','node_modules','System Volume Information','$Recycle.Bin'],
  }),
  computed: {
    selectedFolders: {
      get() { return this.$store.state.Videos.tree },
      set(value) { this.$store.state.Videos.tree = value },
    },
    selectedDisk: {
      get() { return this.$store.state.Settings.selectedDisk },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'selectedDisk', value}) },
    },
    navigationSide() { return this.$store.state.Settings.navigationSide },
    tabs() { return this.$store.getters.tabs },
  },
  methods: {
    initFolderTree() {
      this.updatingFolderTree = true
      this.prevSelectedFolders = _.clone(this.selectedFolders)
      if (this.disks.length===0) {
        setTimeout(()=>{
          try {
            this.disks = nodeDiskInfo.getDiskInfoSync()
            if (this.selectedDisk) {
              const isSelectedDiskExists = _.find(this.disks, disk=>(disk._mounted===this.selectedDisk))
              if (!isSelectedDiskExists) {
                this.selectedDisk = this.disks[0]._mounted
              }
            } else {
              this.selectedDisk = this.disks[0]._mounted
            }
            this.readDiskFolders()
          } catch (e) {
            console.error(e)
          }
        }, 500)
      } else this.updatingFolderTree = false
    },
    readDiskFolders() {
      const selected = this.selectedFolders.filter(folder=>(folder.includes(this.selectedDisk)))
      if (!selected.length) {
        this.selectedFolders = []
      }
      this.folders = this.mapDir(this.selectedDisk+path.sep, this.excludes)
      this.updatingFolderTree = false
    },
    cancelFilterByTree() {
      this.selectedFolders = _.clone(this.prevSelectedFolders)
    },
    clearSelectedFolders() {
      this.selectedFolders = []
      this.$store.dispatch('filterVideos')
    },
    filterByTree() {
      this.$store.dispatch('filterVideos')
    },
    selectDisk() {
      this.updatingFolderTree = true
      setTimeout(()=>{this.readDiskFolders()}, 500)
    },
    selectFolder(event, item) {
      event.stopPropagation()
      if (this.selectedFolders.includes(item.path)) {
        const index = this.selectedFolders.indexOf(item.path)
        if (index > -1) {
          this.selectedFolders.splice(index, 1)
        }
      } else {
        this.selectedFolders.push(item.path)
      }
    },
    loadChildren(item) {
      const folder = this.mapDir(item.path+path.sep, this.excludes)
      if (folder.length) {
        item.children.push(...folder)
      } else item.children = undefined
    },
    isIgnored(fileName, ignoredDirs) {
      return ignoredDirs.some((dir) => {
        return dir.toLowerCase() === fileName.toLowerCase()
      })
    },
    mapDir(directory, ignoredDirs, deep = 1) {
      let dirMap
      try {
        dirMap = fs.readdirSync(directory, ignoredDirs)
      } catch (err) {
        // if (err.code === 'ENOENT') {
        //   console.log(directory + ' not found!')
        // } else if (err.code === 'EACCES') {
        //   console.log('No access rights to the ' + directory)
        // } else {
        //   throw err
        // }
        return []
      }
      return dirMap.map((dir) => {
        if(!this.isIgnored(dir, ignoredDirs)) {
          const dirPath = path.join(directory, dir)
          let stats 
          try {
            stats = fs.lstatSync(dirPath)
          } catch (err) {
            // console.error(err)
          }
          if(stats) {
            if(stats.isDirectory()) {
              let newDirMap = []
              if (!this.depth || deep < this.depth) {
                const nextDeep = deep + 1
                newDirMap = this.mapDir(dirPath, ignoredDirs, nextDeep)
              }
              const res = {
                name: dir,
                path: dirPath,
              }
              if(newDirMap.length) {
                res.children = []
              }
              return res
            }
          }
        }
      }).filter(function(x) { return x !== undefined })
    },
    selectFolder(item) { 
      this.selectedFolder = item.path
      this.$emit('selectFolder', item.path)
    },
  },
  watch: {
    openFolderPath(newPath) { 
      // if (this.openIds.indexOf(newPath)<0) this.openIds.push(newPath)
      this.selectedFolder = newPath
    },
  },
}
</script>


<style lang="less">
.folder-tree {
  position: fixed;
  top: calc(48px + 28px);
  bottom: calc(20px);
  width: 300px;
  &.tabs {
    top: calc(48px + 28px + 28px);  // system bar: 28px, app bar: 48px, tabs: 28px
  }
  &.bottom-bar {
    bottom: calc(20px + 56px); // status bar: 20px, bottom bar: 56px
  }
}
.disks {
  .mounted {
    min-width: 30%;
  }
  .space {
    min-width: 50%;
    text-align: right;
    padding-right: 10px;
    font-size: 12px;
  }
  .v-progress-linear__background {
    display: block !important;
  }
  .v-progress-linear__content {
    font-size: 12px;
  }
}
.v-treeview--dense .v-treeview-node__root {
  min-height: 24px;
}
.v-application--is-ltr .v-treeview-node__content {
  margin-left: 2px;
}
.v-treeview-node__root {
  padding-left: 2px;
  padding-right: 0;
}
.v-treeview-node__prepend {
  margin-right: 0 !important;
}
.v-treeview-node__label {
  display: flex;
  .item-name {
    height: 100%;
    width: 100%;
    &.selected {
      color: var(--v-primary-base);
      &:before {
        content: '';
        position: absolute;
        width: 200%;
        left: -100%;
        height: 100%;
        opacity: 0.12;
        z-index: -1;
        pointer-events: none;
        background-color: var(--v-primary-base);
      }
    }
  }
}
</style>