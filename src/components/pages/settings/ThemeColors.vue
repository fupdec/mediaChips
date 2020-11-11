<template> 
  <v-container class="px-0">
    <v-row>
      <v-col cols="12" sm="6">
        <div class="subtitle">Light theme colors:</div>
        <v-btn light
          class="ma-2" depressed :color="appColorLightPrimary"
          @click.stop="dialogAppColorLightPrimary = true"
        >Primary</v-btn>
        <v-dialog
          v-model="dialogAppColorLightPrimary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightPrimary"
          ></v-color-picker>
        </v-dialog>

        <v-btn light
          class="ma-2" depressed :color="appColorLightSecondary"
          @click.stop="dialogAppColorLightSecondary = true"
        >Secondary</v-btn>
        <v-dialog
          v-model="dialogAppColorLightSecondary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightSecondary"
          ></v-color-picker>
        </v-dialog>

        <v-btn light
          class="ma-2" depressed :color="appColorLightAccent"
          @click.stop="dialogAppColorLightAccent = true"
        >Accent</v-btn>
        <v-dialog
          v-model="dialogAppColorLightAccent"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightAccent"
          ></v-color-picker>
        </v-dialog>

        <v-btn light
          class="ma-2" depressed :color="appColorLightHeader"
          @click.stop="dialogAppColorLightHeader = true"
        >Header</v-btn>
        <v-dialog
          v-model="dialogAppColorLightHeader"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightHeader"
          ></v-color-picker>
        </v-dialog>
      </v-col>
      <v-col cols="12" sm="6">
        <div class="subtitle">Dark theme colors:</div>
        <v-btn dark
          class="ma-2" depressed :color="appColorDarkPrimary"
          @click.stop="dialogAppColorDarkPrimary = true"
        >Primary</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkPrimary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkPrimary"
          ></v-color-picker>
        </v-dialog>

        <v-btn dark
          class="ma-2" depressed :color="appColorDarkSecondary"
          @click.stop="dialogAppColorDarkSecondary = true"
        >Secondary</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkSecondary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkSecondary"
          ></v-color-picker>
        </v-dialog>

        <v-btn dark
          class="ma-2" depressed :color="appColorDarkAccent"
          @click.stop="dialogAppColorDarkAccent = true"
        >Accent</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkAccent"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkAccent"
          ></v-color-picker>
        </v-dialog>

        <v-btn dark
          class="ma-2" depressed :color="appColorDarkHeader"
          @click.stop="dialogAppColorDarkHeader = true"
        >Header</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkHeader"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkHeader"
          ></v-color-picker>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>

export default {
  name: 'ThemeColors',
  components: {
	},
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogAppColorLightPrimary: false,
    dialogAppColorLightSecondary: false,
    dialogAppColorLightAccent: false,
    dialogAppColorLightHeader: false,
    dialogAppColorDarkPrimary: false,
    dialogAppColorDarkSecondary: false,
    dialogAppColorDarkAccent: false,
    dialogAppColorDarkHeader: false,
  }),
  computed: {
    appColorLightPrimary: {
      get() {
        return this.$store.getters.appColorLightPrimary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightPrimary', color)
        }, 500)
      },
    },
    appColorLightSecondary: {
      get() {
        return this.$store.getters.appColorLightSecondary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightSecondary', color)
        }, 500)
      },
    },
    appColorLightAccent: {
      get() {
        return this.$store.getters.appColorLightAccent
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightAccent', color)
        }, 500)
      },
    },
    appColorLightHeader: {
      get() {
        return this.$store.getters.appColorLightHeader
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightHeader', color)
        }, 500)
      },
    },
    appColorDarkPrimary: {
      get() {
        return this.$store.getters.appColorDarkPrimary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkPrimary', color)
        }, 500)
      },
    },
    appColorDarkSecondary: {
      get() {
        return this.$store.getters.appColorDarkSecondary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkSecondary', color)
        }, 500)
      },
    },
    appColorDarkAccent: {
      get() {
        return this.$store.getters.appColorDarkAccent
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkAccent', color)
        }, 500)
      },
    },
    appColorDarkHeader: {
      get() {
        return this.$store.getters.appColorDarkHeader
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkHeader', color)
        }, 500)
      },
    },
  },
  methods: {
    alertScanErrorHeightChange() {
      if (this.alertScanErrorHeight == 100) {
        this.alertScanErrorHeight = undefined
      } else {
        this.alertScanErrorHeight = 100
      }
    },
    alertDuplicateVideosHeightChange() {
      if (this.alertDuplicateVideosHeight == 100) {
        this.alertDuplicateVideosHeight = undefined
      } else {
        this.alertDuplicateVideosHeight = 100
      }
    },
    alertAddNewVideosHeightChange() {
      if (this.alertAddNewVideosHeight == 100) {
        this.alertAddNewVideosHeight = undefined
      } else {
        this.alertAddNewVideosHeight = 100
      }
    },
    chooseMultipleDir() {
      dialog.showOpenDialog(null, {
        properties: ['openDirectory','multiSelections']
      }).then(result => {
        if (result.filePaths.length !== 0) {
          this.folderPaths = result.filePaths.join('\n')
        }
      }).catch(err => {
        console.log(err)
      })
    },
    scanDir() {
      this.$store.state.Settings.scanProcRun = true
      this.headerText = 'Videos scanning in progress...'

      this.videoScanProgressBar = 0
      this.isVideoScanFinished = false
      this.currentNumberOfScanVideos = 0
      this.totalNumberOfScanVideos = 0
      this.alertScanError = false
      this.alertDuplicateVideos = false
      this.alertAddNewVideos = false
      this.errorVideos = []
      this.duplicateVideos = []
      this.newVideos = []
      this.noNewVideosAdded = false
      
      let formats = /\.3gp|\.avi|\.dat|\.f4v|\.flv|\.m4v|\.mkv|\.mod|\.mov|\.mp4|\.mpeg|\.mpg|\.mts|\.rm|\.rmvb|\.swf|\.ts|\.vob|\.webm|\.wmv|\.yuv$/

      const vm = this

      let folders = this.folderPaths.split('\n')
      let filesArray = []
      for (const folder of folders) {
        filesArray = filesArray.concat(vm.findInDir(folder, formats))
      }

      async function processArray(files) {
        let percentsPerFile = 100/files.length 
        vm.totalNumberOfScanVideos = files.length
        // console.log(percentsPerFile)
        for (const file of files) {
          vm.currentVideoScanName = file
          let fileProcResult = await fileScanProc(file)
          if (fileProcResult.errorVideo) {
            vm.alertScanError = true
            vm.errorVideos.push(fileProcResult.errorVideo)
          }
          if (fileProcResult.duplicate) {
            vm.alertDuplicateVideos = true
            vm.duplicateVideos.push(fileProcResult.duplicate)
          }
          if (fileProcResult.success) {
            vm.alertAddNewVideos = true
            vm.newVideos.push(fileProcResult.success.path)
          }
          ++vm.currentNumberOfScanVideos
          vm.videoScanProgressBar += percentsPerFile
          if (vm.videoScanProgressBar > 100) {
            vm.videoScanProgressBar = 100
          }
          // console.log(vm.videoScanProgressBar)
          console.log(fileProcResult)
        }
        vm.isVideoScanFinished = true
        // console.log(vm.updateVideosInStore);
        console.log('Files scaned!');
      }

      processArray(filesArray).then(()=>{
        vm.currentVideoScanName = ''
        if (vm.newVideos.length===0 && vm.totalNumberOfScanVideos!==0) {
          vm.noNewVideosAdded = true
          vm.textNoVideosAdded = 'No videos have been added. All videos are already in the database.'
        }
        if (vm.newVideos.length===0 && vm.totalNumberOfScanVideos===0) {
          vm.noNewVideosAdded = true
          vm.textNoVideosAdded = 'There is no video in the selected folder.'
        } 
        vm.$store.state.Settings.scanProcRun = false
        vm.$store.commit('updateVideos')
        vm.headerText = 'Video scanning process completed!'
      })
    },
    findInDir(dir, filter, fileList = []) {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(filePath);

        if (fileStat.isDirectory()) {
          this.findInDir(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
          fileList.push(filePath);
        }
      });

      return fileList;
    },
    getPathRules(path) {
      if (path.length===0) {
        return 'Path is required'
      } else {
        return true
      }
    },
    startScanProcess() {
      this.scanVideosForm = 3
      setTimeout(()=>{
        this.scanDir()
      },500)
    },
    endScanProcess() {
      this.$store.state.Settings.dialogScanVideos = false
      this.scanVideosForm = 1
    },
  },
  watch: {
    alertScanError(val) {
      if (!val) {
        // Custom action when the alert was hidden
        this.errorVideos = []
      }
    },
    alertDuplicateVideos(val) {
      if (!val) {
        // Custom action when the alert was hidden
        this.duplicateVideos = []
      }
    },
    alertAddNewVideos(val) {
      if (!val) { this.newVideos = [] }
    },
  },
}
</script>