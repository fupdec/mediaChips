<template>   
  <v-card outlined class="mt-10 px-4">
    <div class="headline text-center my-4"> Folders
      <v-tooltip right>
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on" right>mdi-help-circle-outline</v-icon>
        </template>
        <span>Add folders with your videos so that app can watch
          <br> new videos and check deleted ones</span>
      </v-tooltip>
    </div>
    <v-list dense v-if="folders.length" shaped class="pb-0 pl-2">
      <v-list-item v-for="(folder, i) in folders" :key="i" class="folder-list">
        <div class="folder-item">
          <div v-if="folderNameEdit==i" class="name">
            <v-btn @click="folderNameEdit=-1" class="mr-1" color="red" icon fab x-small title="Cancel">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-text-field v-model="folderName" class="d-inline-flex" hide-details outlined dense />
            <v-btn @click="saveFolderName(i)" :disabled="folderName==''" class="ml-1" color="green" icon fab x-small title="Save folder name">
              <v-icon>mdi-check</v-icon>
            </v-btn>
          </div>
          <div v-else class="name">
            <v-btn @click="folderNameEdit=i, folderName=folder.name" class="mr-1" icon fab x-small title="Edit folder name">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-chip label outlined :title="folder.name">
              <span>{{folder.name}}</span>
            </v-chip>
          </div>
          <v-chip @click="openFolder(folder.path)" label outlined class="path" :title="`Open in explorer: ${folder.path}`">
            <v-icon left class="icon-closed">mdi-folder</v-icon>
            <v-icon left class="icon-open">mdi-folder-open</v-icon>
            <span>{{folder.path}}</span>
          </v-chip>
        </div>
        <v-switch v-model="folder.watch" @change="updateFolders" class="ml-4 mt-0 pt-0" hide-details title="Toggle watch"/>
        <v-btn @click="removeFolder(i)" class="ml-2" color="red" icon fab x-small title="Remove folder"> <v-icon>mdi-close</v-icon> </v-btn>
      </v-list-item>
    </v-list>
    <div v-else class="text-center overline pt-2">
      <v-icon size="40">mdi-folder-outline</v-icon>
      <div>There are no watched folders yet</div>
    </div>
    <v-card-actions>
      <v-btn @click="addFolder" rounded dark color="green" class="pr-4">
        <v-icon left>mdi-plus</v-icon> Add watched folder
      </v-btn>
      <v-spacer></v-spacer>
      <div class="d-flex align-center">
        <div class="mr-6"> Watch folders: </div>
        <v-switch v-model="watchFolders" :label="watchFolders?'Yes':'No'" inset class="d-inline" :disabled="folders.length==0"/>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script>
const shell = require('electron').shell
const { dialog } = require('electron').remote

import vuescroll from 'vuescroll'

export default {
  name: 'WatchedFolders',
  components: { vuescroll },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    folderName: '',
    folderNameEdit: -1,
  }),
  computed: {
    watchFolders: {
      get() { return this.$store.state.Settings.watchFolders},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'watchFolders', value})},
    },
    folders: {
      get() {return this.$store.state.Settings.folders},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'folders', value})},
    },
  },
  methods: {
    addFolder() {
      dialog.showOpenDialog(null, {
        properties: ['openDirectory','multiSelections']
      }).then(result => {
        if (result.filePaths.length !== 0) {
          for (let i=0; i<result.filePaths.length; i++) {
            let folderPath = result.filePaths[i]
            let folder = {
              name: folderPath,
              path: folderPath,
              watch: true,
            }
            if (_.filter(this.folders, {name: folderPath}).length) {
              this.$store.dispatch('setNotification', {
                type: 'error',
                text: `Folder with path "${folderPath}" already added.`
              })
            } else {
              this.folders.push(folder)
              this.updateFolders()
            }
          }
        }
      }).catch(err => { console.log(err) })
    },
    saveFolderName(i) {
      this.folders[i].name = this.folderName
      this.updateFolders()
      this.folderNameEdit = -1
    },
    removeFolder(i) {
      this.folders.splice(i, 1)
      if (this.folders.length==0) this.watchFolders = false
      this.updateFolders()
    },
    updateFolders() { this.folders = this.folders },
    openFolder(folderPath) { shell.openPath(folderPath) },
  },
}
</script>


<style lang="scss" scoped>
.folder-list {
  display: flex;
  justify-content: space-between;
  width: 100%;
  background-color: rgba(150, 150, 150, 0.1);
  padding-left: 5px;
  padding-right: 3px;
  margin-bottom: 3px;
  .folder-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: calc(100% - 40px);
    .v-input__slot {
      min-height: 32px !important;
    }
    .name {
      display: flex;
      align-items: center;
      max-width: calc(50% - 40px);
    }
    .path {
      max-width: 40%;
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
  }
}
</style>