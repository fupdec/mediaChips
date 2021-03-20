<template> 
  <v-dialog v-model="$store.state.Settings.dialogScanVideos" scrollable persistent>
    <v-stepper v-model="scanVideosForm">
      <v-stepper-header>
        <v-stepper-step :complete="scanVideosForm > 1" step="1">
          Choose folders
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="scanVideosForm > 2" step="2">
          Confirmation
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="3">
          Scanning process
        </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-card v-if="ffmpeg">
            <vuescroll>
              <v-card-text class="text-center">
                <v-textarea v-model="folderPaths" outlined 
                  label="Path to folder with videos"
                  hint="each path starts on a new line"
                ></v-textarea>

                <v-btn @click="chooseMultipleDir" outlined>
                  <v-icon left>mdi-folder-open</v-icon>Choose folders
                </v-btn>
              </v-card-text>
            </vuescroll>
            <v-card-actions>
              <v-btn @click="$store.state.Settings.dialogScanVideos=false" class="ma-2">
                Cancel
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn @click="scanVideosForm = 2" :disabled="folderPaths.length===0"
                color="primary" class="ma-2">
                Continue <v-icon large right>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
          <v-card v-else>
            <v-card-text class="text-center">
              <v-icon color="red" size="100" class="ma-4">mdi-alert-outline</v-icon>
              <div>ERROR: ffmpeg.exe or ffprobe.exe not found on path:<br>{{ffmpegDirectory}}</div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="$store.state.Settings.dialogScanVideos=false" class="ma-4">
                OK
              </v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-stepper-content>

        <v-stepper-content step="2">
          <v-card>
            <!-- TODO: ADD VALIDATION FOR PATH. MAYBE CHECKOUT WITH FS EVERY PATH -->
            <vuescroll>
              <v-card-text>
                <div class="text-center">
                  <v-icon large left color="blue">mdi-alert-circle-outline</v-icon>
                  The file information will be automatically added during the scan.
                  It is recommended to add performers (<v-icon small>mdi-account</v-icon>)
                  , tags (<v-icon size="14">mdi-tag</v-icon>)
                  and websites (<v-icon small>mdi-web</v-icon>) before scanning.<br>
                </div>
                <v-divider class="my-4"></v-divider>
                During the scan, the path to the file is checked against the names.<br>
                If the file is in a folder that has the name of a performer or a website, 
                then it will be automatically added to the video.<br>
                <br>
                Recommended folder structure "performer\website\video"

                <v-checkbox v-model="$store.state.Settings.searchTagsInFileName" 
                  label="Checking for tags in the file name" dense />
                <v-icon left color="blue">mdi-alert-circle-outline</v-icon>
                Checking for tags will be only by tags with the type "video". <br>
                This function works inaccurately, in contrast to the search for artists and websites, 
                since the search does not match the entire string, but a part. <br>
                For example in the file "BestCumshots.mp4" will be found and added tags "Cumshot" and "Hot".
              </v-card-text>
            </vuescroll>
            <v-card-actions>
              <v-btn @click="$store.state.Settings.dialogScanVideos = false" class="ma-2">
                Cancel
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn @click="scanVideosForm = 1" class="ma-2">
                <v-icon large left>mdi-chevron-left</v-icon> Back
              </v-btn>
              <v-btn @click="startScanProcess" color="primary" class="ma-2">
                <v-icon left>mdi-movie-search</v-icon>
                Start scanning process <v-icon large right>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-content>
        
        <v-stepper-content step="3">
          <v-card class="file-scan-dialog">
            <v-card-title class="headline">
              {{headerText}}
              <v-spacer></v-spacer>
              <span class="body-2">
                {{currentNumberOfScanVideos}} / {{totalNumberOfScanVideos}} videos scanned
              </span>
            </v-card-title>

            <v-card-actions>
              <v-progress-linear
              height="20" rounded class="progress-striped" 
              :class="{active: isProcessRun}"
              v-model="videoScanProgressBar">
                <template v-slot="{ value }">
                  <strong class="process-percents">{{ Math.ceil(value) }}%</strong>
                </template>
              </v-progress-linear>
            </v-card-actions>

            <v-card-actions v-if="currentVideoScanName!==''" class="py-1">
              {{currentVideoScanName}}
            </v-card-actions>

            <v-card-actions v-if="$store.state.Settings.scanProcRun" class="py-1">
              <v-progress-linear v-if="$store.state.Settings.scanProcRun"
                height="4" indeterminate reverse class="my-2">
              </v-progress-linear>
            </v-card-actions>

            <vuescroll>
              <v-card-text class="py-1" style="max-height: calc(100vh - 450px)">
                <v-alert style="overflow:hidden;"
                  v-model="alertFolderError" type="error" :icon="false" 
                  border="left" text dense outlined 
                > Folder read error: ({{errorFolders.length}}) <br>{{errorScanFolders}}
                </v-alert>
                <v-alert style="overflow:hidden;"
                  v-model="alertScanError" type="error" :icon="false" 
                  border="left" text dense outlined :height="alertScanErrorHeight" 
                > <v-row align="start">
                    <v-col class="grow">
                      Video file read error: ({{errorVideos.length}}) <br>{{errorScanVideos}}
                    </v-col>
                    <v-col class="shrink">
                      <v-btn depressed fab outlined width="24" height="24" color="error"
                        @click="alertScanErrorHeightChange"
                      ><v-icon size="16">mdi-arrow-up-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
                <v-alert style="overflow:hidden;"
                  v-model="alertDuplicateVideos" type="warning" :icon="false"
                  border="left" text dense outlined :height="alertDuplicateVideosHeight" 
                > <v-row align="start">
                    <v-col class="grow">
                      Already in the database: ({{duplicateVideos.length}}) 
                      <br>{{parsedDuplicateVideos}}
                    </v-col>
                    <v-col class="shrink">
                      <v-btn depressed fab outlined width="24" height="24" color="warning"
                        @click="alertDuplicateVideosHeightChange"
                      ><v-icon size="16">mdi-arrow-up-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
                <v-alert
                  v-model="noNewVideosAdded"
                  border="left" text dense outlined  type="info"
                > {{textNoVideosAdded}}
                </v-alert>
                <v-alert style="overflow:hidden;"
                  v-model="alertAddNewVideos" type="success" :icon="false"
                  border="left" text dense outlined :height="alertAddNewVideosHeight"
                > <v-row align="start">
                    <v-col class="grow"> Added: ({{newVideos.length}})
                      <br>{{parsedNewVideos}} </v-col>
                    <v-col class="shrink">
                      <v-btn depressed fab outlined width="24" height="24" color="success"
                        @click="alertAddNewVideosHeightChange"
                      ><v-icon size="16">mdi-arrow-up-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
              </v-card-text>
            </vuescroll>

            <v-card-actions>
              <v-btn v-if="$store.state.Settings.scanProcRun" @click="stop=true" color="red" dark class="ma-2"> 
                <v-icon left>mdi-stop</v-icon> Stop scanning
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn @click="endScanProcess" :disabled="$store.state.Settings.scanProcRun" 
                color="primary" class="ma-2"
              > <v-icon left>mdi-check-circle-outline</v-icon> OK </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-dialog>
</template>

<script>
const { dialog } = require('electron').remote
const fs = require('fs')
const path = require('path')

import vuescroll from 'vuescroll'
import fileScanProc from '@/components/pages/settings/VideoScanner'

export default {
  name: 'ScanVideos',
  props: {
    newFiles: Array,
    stage: Number,
	},
  components: {
    vuescroll
	},
  mounted() {
    this.$nextTick(function () {
      if (this.stage>0) this.scanVideosForm = this.stage
      this.ffmpegExists()
      this.folderPaths = this.$store.state.Settings.folders.map(f=>f.path).join('\n')
    })
  },
  updated() {
    this.ffmpegExists()
  },
  beforeDestroy() {
    this.$emit('close')
  },
  data: () => ({
    scanVideosForm: 1,
    folderPaths: '',
    headerText: 'Videos scanning in progress...',
    videoScanProgressBar: 0,
    currentVideoScanName: '',
    isVideoScanFinished: false,
    currentNumberOfScanVideos: 0,
    totalNumberOfScanVideos: 0,
    alertFolderError: false,
    alertScanError: false,
    alertScanErrorHeight: 100,
    alertDuplicateVideos: false,
    alertDuplicateVideosHeight: 100,
    alertAddNewVideos: false,
    alertAddNewVideosHeight: 100,
    errorFolders: [],
    errorVideos: [],
    duplicateVideos: [],
    newVideos: [],
    noNewVideosAdded: false,
    textNoVideosAdded: '',
    ffmpeg: true,
    stop: false,
  }),
  computed: {
    errorScanFolders() {
      return this.errorFolders.join(', \n')
    },
    errorScanVideos() {
      return this.errorVideos.join(', \n')
    },
    parsedDuplicateVideos() {
      return this.duplicateVideos.join(', \n')
    },
    parsedNewVideos() {
      return this.newVideos.join(', \n')
    },
    isProcessRun() {
      return this.$store.state.Settings.scanProcRun
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    ffmpegDirectory() {
      return path.join(this.pathToUserData, `/ffmpeg`)
    },
  },
  methods: {
    ffmpegExists() {
      let ffmpegPath = path.join(this.pathToUserData, `/ffmpeg/ffmpeg.exe`)
      let ffprobePath = path.join(this.pathToUserData, `/ffmpeg/ffprobe.exe`)
      if (fs.existsSync(ffmpegPath) || fs.existsSync(ffprobePath)) {
        this.ffmpeg = true
      } else this.ffmpeg = false
    },
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
      this.alertFolderError = false
      this.alertScanError = false
      this.alertDuplicateVideos = false
      this.alertAddNewVideos = false
      this.errorFolders = []
      this.errorVideos = []
      this.duplicateVideos = []
      this.newVideos = []
      this.noNewVideosAdded = false
      this.stop = false
      
      let formats = /\.3gp$|\.avi$|\.dat$|\.f4v$|\.flv$|\.m4v$|\.mkv$|\.mod$|\.mov$|\.mp4$|\.mpeg$|\.mpg$|\.mts$|\.rm$|\.rmvb$|\.swf$|\.ts$|\.vob$|\.webm$|\.wmv$|\.yuv$/

      const vm = this

      let folders = this.folderPaths.split('\n')
      let filesArray = []
      if (this.newFiles.length) {
        filesArray = this.newFiles
      } else {
        for (const folder of folders) {
          filesArray = filesArray.concat(vm.findInDir(folder, formats))
        }
      }
      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
      }

      async function processArray(files) {
        let percentsPerFile = 100/files.length 
        vm.totalNumberOfScanVideos = files.length
        // console.log(percentsPerFile)
        for (const file of files) {
          if (vm.stop) break // stop process
          vm.currentVideoScanName = file
          let fileProcResult = await fileScanProc(file)
          if (fileProcResult.errorVideo) {
            vm.alertScanError = true
            vm.errorVideos.unshift(fileProcResult.errorVideo)
          }
          if (fileProcResult.duplicate) {
            vm.alertDuplicateVideos = true
            vm.duplicateVideos.unshift(fileProcResult.duplicate)
          }
          if (fileProcResult.success) {
            vm.alertAddNewVideos = true
            vm.newVideos.unshift(fileProcResult.success.path)
          }
          ++vm.currentNumberOfScanVideos
          vm.videoScanProgressBar += percentsPerFile
          if (vm.videoScanProgressBar > 100) {
            vm.videoScanProgressBar = 100
          }
          // console.log(vm.videoScanProgressBar)
          console.log(fileProcResult)
          await sleep(10)
        }
        vm.isVideoScanFinished = true
        // console.log(vm.updateVideosInStore);
        console.log('Files scaned!');
      }

      processArray(filesArray).then(()=>{
        vm.currentVideoScanName = ''
        if (vm.newVideos.length===0 && vm.totalNumberOfScanVideos!==0) {
          vm.noNewVideosAdded = true
          vm.textNoVideosAdded = 'No videos have been added.'
        }
        if (vm.newVideos.length===0 && vm.totalNumberOfScanVideos===0) {
          vm.noNewVideosAdded = true
          vm.textNoVideosAdded = 'There is no video in the selected folder.'
        } 
        vm.$store.state.Settings.scanProcRun = false
        vm.$store.commit('updateVideos')
        vm.$store.dispatch('filterVideos')
        vm.headerText = 'Video scanning process completed!'
      })
    },
    findInDir(dir, filter, fileList = []) {
      let files
      try {
        files = fs.readdirSync(dir)
      } catch (err) {
        console.log(err)
        files = []
        this.alertFolderError = true
        this.errorFolders.unshift(dir)
      }

      files.forEach((file) => {
        const filePath = path.join(dir, file)
        let fileStat
        try {
          fileStat = fs.lstatSync(filePath)
        } catch (error) {
          console.log(error)
          return
        }

        if (fileStat.isDirectory()) {
          this.findInDir(filePath, filter, fileList)
        } else if (filter.test(filePath.toLowerCase())) {
          fileList.push(filePath)
        }
      })

      return fileList
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
      this.$store.state.updateFoldersData = Date.now()
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

<style lang="less">
.file-scan-dialog {
  .v-alert__content {
    font-size: 10px;
    white-space: pre-line;
  }
}
.btn-top .v-btn {
  align-self: flex-start;
  margin: 0;
}
.progress-striped {
  .v-progress-linear__determinate {
    &.primary {
      overflow: hidden;
      position: absolute;
      &:after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 25%,
        transparent 0, transparent 50%, rgba(255, 255, 255, 0.25) 0,
        rgba(255, 255, 255, 0.25) 75%, transparent 0, transparent);
        background-size: 40px 40px;
        background-repeat: repeat;
        transition: width 4s ease-in-out;
        height: 100%;
        width: 100%;
      }
    }
  }
  &.active {
    .v-progress-linear__determinate {
      &.primary {
        &:after {
          animation: cssProgressActive 2s linear infinite;
        }
      }
    }
  }
  &[aria-valuenow="100"] {
    .v-progress-linear__determinate {
      &.primary {
        &:after {
          animation-play-state: paused;
        }
      }
    }
  }
}
.bordered {
  margin-top: 10px;
  border: 1px dashed #7a7a7a;
  padding: 20px;
  border-radius: 5px;
}
.process-percents {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 0 2px 0;
  border-radius: 10px;
  display: block;
  line-height: 1;
}

@keyframes cssProgressActive {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 40px;
  }
}
</style>