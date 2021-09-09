<template>   
  <div>
    <v-btn @click="openDialog" color="primary" block x-large rounded>
      <v-icon large class="mr-4">mdi-database</v-icon> Manage backups </v-btn>

    <v-dialog v-if="dialog" v-model="dialog" scrollable persistent max-width="800">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">Backups management</span>
          <v-spacer></v-spacer>
          <v-btn @click="dialog=false, backups=[]" outlined> <v-icon left>mdi-close</v-icon> Close </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text>
            <v-alert :value="backupError" type="info" dense text> Please select a backup </v-alert>
            <v-data-table v-model="selectedBackup" :headers="headers" :items="backups" item-key="date"
              single-select show-select dense class="elevation-2"
              no-data-text="No backups have been created" @input="backupError=false"/>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="mb-2">
          <v-btn @click="dialogCreateBackup=true" class="pr-4" rounded color="success">
            <v-icon left>mdi-database-plus</v-icon> Create </v-btn>
          <v-spacer></v-spacer>
          <v-btn  @click="openDialogRestoreBackup" :disabled="isNoBackups" class="pr-4" rounded color="warning">
            <v-icon left>mdi-database-refresh</v-icon> Restore </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="openDialogDeleteBackup" :disabled="isNoBackups" class="pr-4" rounded color="error">
            <v-icon left>mdi-database-remove</v-icon> Delete </v-btn>
          <v-spacer></v-spacer>
          <v-btn  @click="importBackup" class="pr-4" rounded color="info">
            <v-icon left>mdi-database-import</v-icon> Import </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="exportBackup" :disabled="isNoBackups" class="pr-4" rounded color="info">
            <v-icon left>mdi-database-export</v-icon> Export </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogCreateBackup" width="600" persistent>
      <v-card>
        <v-toolbar color="success">
          <span class="headline">Create a backup?</span>
          <v-spacer></v-spacer>
          <v-btn @click="dialogCreateBackup=false" :disabled="isProcessRun"
            class="mx-4" outlined> <v-icon left>mdi-close</v-icon> close </v-btn>
          <v-btn @click="createBackup" :disabled="isProcessRun" outlined> 
            <v-icon left>mdi-database-plus</v-icon> Create
          </v-btn>
        </v-toolbar>
        <v-card-text v-if="isProcessRun" class="text-center">
          <h3 class="py-4">Creating in progress...</h3>
          <v-icon x-large class="loading-animation">mdi-loading</v-icon>
        </v-card-text>
        <v-card-text v-else class="py-6 text-center">
          <v-icon size="72" color="info" class="py-4">mdi-information-outline</v-icon>
          <div>All data, settings and images will be archived</div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogRestoreBackup" width="600" persistent>
      <v-card>
        <v-toolbar color="warning">
          <div class="headline"> Restore the backup? </div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogRestoreBackup=false, isBackupRestoredError=false" :disabled="isProcessRun" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> close </v-btn>
          <v-btn @click="restoreBackup" :disabled="isProcessRun" outlined> <v-icon left>mdi-backup-restore</v-icon>Restore</v-btn>
        </v-toolbar>
        <v-card-text v-if="isProcessRun" class="text-center">
          <h3 class="py-4">Restoring in progress...</h3>
          <v-icon x-large class="loading-animation">mdi-loading</v-icon>
        </v-card-text>
        <v-card-text v-else class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div>This will replace current state of the database.<br>It is recommended to create a backup before restoring <br>to avoid data loss in case of an error.</div>
          <v-alert v-if="isBackupRestoredError" type="error" text dense outlined class="mt-6">An error occurred while restoring</v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="isBackupRestoredSuccessfully" width="500" persistent>
      <v-card>
        <v-card-text class="text-center py-6  d-flex flex-column align-center">
          Backup successfully restored. Need to restart application.
          <v-btn @click="restartApp" class="mx-6 mt-6" color="primary">
            <v-icon left>mdi-restart</v-icon> Restart </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogRestoreBackupError" width="500" persistent>
      <v-card>
        <v-card-text class="text-center py-6  d-flex flex-column align-center">
          <div class="red--text">An error occurred while restoring a backup. Need to restart application.</div>
          <v-btn @click="restartApp" class="mx-6 mt-6" color="primary">
            <v-icon left>mdi-restart</v-icon> Restart </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDeleteBackup" width="550" persistent>
      <v-card>
        <v-toolbar color="error">
          <div class="headline"> Delete the backup? </div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteBackup=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteBackup" outlined> <v-icon left>mdi-check</v-icon>Yes</v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div>This action will remove selected backup from application.</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
const fs = require('fs-extra')
const path = require("path")
const { dialog } = require('electron').remote
const { ipcRenderer } = require('electron')
const archiver = require('archiver')
const StreamZip = require('node-stream-zip')
const rimraf = require("rimraf")

import vuescroll from 'vuescroll'

export default {
  name: 'ManageBackups',
  components: { vuescroll },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    backups: [],
    selectedBackup: [],
    isProcessRun: false,
    headers: [
      { text: 'Date, time', value: 'date' },
      { text: 'Videos', value: 'videos' },
      { text: 'Total size (MB)', value: 'size', sort: (a,b)=>(a-b) }, 
      { text: 'Version', value: 'version' }, 
    ],
    backupError: false,
    isBackupRestoredSuccessfully: false,
    isBackupRestoredError: false,
    dialog: false,
    dialogCreateBackup: false,
    dialogRestoreBackup: false,
    dialogRestoreBackupError: false,
    dialogDeleteBackup: false,
    compatibleVersions: ['0.9.0','0.9.1','0.9.2','0.9.3','0.10.0','0.10.1','0.10.2'],
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    isNoBackups() { return this.backups.length == 0 },
  },
  methods: {
    getBackups() {
      let backups = []
      const backupsPath = path.join(this.pathToUserData, '/backups/')
      fs.readdirSync(backupsPath).forEach(file => {
        if (path.extname(file) !== '.zip') return false
        const pathToFile = path.join(backupsPath, file)
        const zip = new StreamZip({ file: pathToFile, storeEntries: true })
        zip.on('error', err => { 
          this.$store.commit('addLog', {
            type: 'error',
            text: `Backup ${file} corrupted. Please remove it manually.`
          })
          zip.close()
          return false
        })
        zip.on('ready', () => {
          let backupInfo = zip.entryDataSync('info.json').toString('utf8')
          backupInfo = JSON.parse(backupInfo)
          if (backupInfo.version===undefined) backupInfo.version = '0.8.2'
          backupInfo.size = (fs.statSync(pathToFile).size / 1024 / 1024).toFixed(2)
          backups.push(backupInfo)
          zip.close()
        })
      })
      return backups
    },
    clearFiles(directory) {
      return new Promise((resolve) => {
        rimraf(directory, () => { 
          if (!fs.existsSync(directory)) fs.mkdirSync(directory) 
          resolve()
        })
      })
    },
    createBackup() {
      this.isProcessRun = true
      let currentdate = new Date(),
          date = currentdate.getDate(),
          month = currentdate.getMonth()+1,
          hours = currentdate.getHours(),
          mins = currentdate.getMinutes(),
          secs = currentdate.getSeconds(),
          backupName = currentdate.getFullYear() + "."
                      + (month>9?month:'0'+month) + "." 
                      + (date>9?date:'0'+date) + " "  
                      + (hours>9?hours:'0'+hours) + "-"  
                      + (mins>9?mins:'0'+mins) + "-" 
                      + (secs>9?secs:'0'+secs),
          currentDB = path.join(this.pathToUserData, '/databases/'),
          currentFiles = path.join(this.pathToUserData, '/media/'),
          settings = path.join(this.pathToUserData, 'dbs.json'),
          backupInfo = {},
          vm = this
          
      backupInfo.date = backupName
      backupInfo.videos = this.$store.getters.videosTotal
      backupInfo.version = this.$store.state.Settings.databaseVersion || '0.8.2'

      // console.log('backup creation started')
      let output = fs.createWriteStream(path.join(this.pathToUserData,'/backups/'+backupName+'.zip'))
      let archive = archiver('zip')
      output.on('close', function() {
        backupInfo.size = archive.pointer()
        vm.$store.dispatch('setNotification', {type:'success', text:'Backup successfully created'})
        vm.$store.commit('addLog', {text:'💾 Backup successfully created', type:'success'})
        vm.isProcessRun = false
        vm.backups = vm.getBackups()
        // console.log(archive.pointer() + ' total bytes')
        // console.log('archiver has been finalized and the output file descriptor has closed.')
        vm.dialogCreateBackup = false
      })
      archive.on('error', function(err) { 
        this.$store.commit('addLog', { text: err, type: 'error' })
        throw err 
      })
      archive.pipe(output)
      archive.directory(currentDB, 'databases')
      archive.directory(currentFiles, 'media')
      archive.append(JSON.stringify(backupInfo), { name: 'info.json' })
      archive.file(settings, { name: 'dbs.json' })
      archive.finalize()
      this.selectedBackup = []
    },
    openDialogRestoreBackup() {
      if (this.selectedBackup.length == 0) {
        this.backupError = true
        return false
      } else if (!this.compatibleVersions.includes(this.selectedBackup[0].version)) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: 'This backup is not compatible with the current version of the application'
        })
        this.backupError = false
        return false
      } else {
        this.dialogRestoreBackup = true
        this.backupError = false
      }
    },
    async restoreBackup() {
      this.isProcessRun = true
      let date = this.selectedBackup[0].date
      const pathMedia = path.join(this.pathToUserData, '/media/')
      const pathDatabases = path.join(this.pathToUserData, '/databases/')
      const pathSettings = path.join(this.pathToUserData, '/dbs.json')
      const pathTemp = path.join(this.pathToUserData, '/temp')

      function copyDirToTemp (srcDir, destName) {
        return new Promise((resolve, reject) => {
          try {
            fs.copySync(srcDir, path.join(pathTemp, destName))
            console.log('success!')
            resolve()
          } catch (err) {
            console.error(err)
            reject()
          }
        })
      }

      function copyFromTempDir (destDir, srcName) {
        return new Promise((resolve, reject) => {
          try {
            fs.copySync(path.join(pathTemp, srcName), destDir )
            console.log('success!')
            resolve()
          } catch (err) {
            console.error(err)
            reject()
          }
        })
      }
      
      let backupPath = path.join(this.pathToUserData, '/backups/'+date+'.zip')
      let backupDestinationPath = path.join(this.pathToUserData)

      if (!fs.existsSync(backupPath)) {
        this.isProcessRun = false
        this.isBackupRestoredError = true
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: 'Archive with this backup does not exist'
        })
      }
      
      const zip = new StreamZip({ file: backupPath, storeEntries: true })
      zip.on('ready', async () => {
        if (fs.existsSync(pathTemp)) await this.clearFiles(pathTemp)
        else fs.mkdirSync(pathTemp) 
        console.log('folder TEmp created!')

        await copyDirToTemp(pathMedia, '/media')
        await copyDirToTemp(pathDatabases, '/databases')
        fs.copyFile(pathSettings, path.join(pathTemp, '/dbs.json'), (err) => {
          if (err) console.error(err)
          else console.log("success!")
        })

        await this.clearFiles(pathMedia)
        await this.clearFiles(pathDatabases)

        zip.extract(null, backupDestinationPath, async (err, count) => {
          if (err) {
            this.isProcessRun = false
            this.isBackupRestoredError = true
            console.log(err)
          } else {
            let backupInfoPath = path.join(this.pathToUserData, '/info.json')
            fs.unlink(backupInfoPath)
            await this.clearFiles(pathTemp)
            this.$store.commit('addLog', { text: 'Backup successfully restored', type: 'success' })
            this.isProcessRun = false
            this.isBackupRestoredSuccessfully = true
            // console.log(`Extracted ${count} entries`)
          }
          zip.close()
        })
      })
      zip.on('error', async (err) => {
        this.isBackupRestoredError = true
        await this.clearFiles(pathMedia)
        await this.clearFiles(pathDatabases)
        fs.copyFile(path.join(pathTemp, '/dbs.json'), pathSettings, (err) => {
          if (err) console.error(err)
          else console.log("success!")
        })
        await copyFromTempDir(pathMedia, '/media')
        await copyFromTempDir(pathDatabases, '/databases')
        await this.clearFiles(pathTemp)
        this.isProcessRun = false
        this.dialogRestoreBackupError = true
        console.log(err)
      })
      this.selectedBackup = []
    },
    importBackup() {
      let importPath = path.join(this.pathToUserData, '/backups/')

      dialog.showOpenDialog(null, { properties: ['openFile'] }).then(result => {
        if (result.filePaths.length === 0) return false
        let backupPath = result.filePaths[0]
        if (path.extname(backupPath) !== '.zip') {
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: 'The selected file is not a backup'
          })
          return false
        } else if (fs.existsSync(path.join(importPath, path.basename(backupPath)))) {
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: 'This backup already exists'
          })
          return false
        }
        // read info.json from backup archive
        const zip = new StreamZip({ file: backupPath, storeEntries: true })
        zip.on('error', err => { 
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: 'The selected file is not a backup'
          })
          zip.close()
          return false
        })
        zip.on('ready', () => {
          let backupInfo = zip.entryDataSync('info.json').toString('utf8')
          backupInfo = JSON.parse(backupInfo)

          fs.copyFile(backupPath, importPath+backupInfo.date+'.zip', (err) => {
            if (err) {
              this.$store.commit('addLog', { text: err, type: 'error' })
              throw err
            } else {
              this.$store.commit('addLog', { 
                text: `Backup "${backupInfo.date}" successfully imported`, 
                type: 'success'
              })
              this.backups = this.getBackups()
            }
          })
          zip.close()
        })
      }).catch(err => { this.$store.commit('addLog', { text: err, type: 'error' }) })
      this.selectedBackup = []
    },
    exportBackup() {
      if (this.selectedBackup.length == 0) { this.backupError = true; return false } 
      else this.backupError = false
      dialog.showOpenDialog(null, { properties: ['openDirectory'] }).then(result => {
        if (result.filePaths.length === 0) return false
        let date = this.selectedBackup[0].date
        let backupPath = path.join(this.pathToUserData, '/backups/'+date+'.zip')
        let exportPath = path.join(result.filePaths[0], '/'+date+'.zip')
        fs.copyFile(backupPath, exportPath, (err) => {
          if (err) { this.$store.commit('addLog', { text: err, type: 'error' }) ; throw err } 
          else this.$store.commit('addLog', { text: `Backup "${date}" successfully exported`, type: 'success' })
        })
        this.selectedBackup = []
      }).catch(err => { 
        this.$store.commit('addLog', { text: err, type: 'error' }) 
        this.selectedBackup = []
      })
    },
    openDialogDeleteBackup() {
      if (this.selectedBackup.length == 0) {
        this.backupError = true
        return false
      } else {
        this.backupError = false
        this.dialogDeleteBackup = true
      }
    },
    deleteBackup() {
      let backupDate = this.selectedBackup[0].date
      let backupPath = path.join(this.pathToUserData, '/backups/'+backupDate+'.zip')
      if (fs.existsSync(backupPath)) {
        fs.unlink(backupPath, err => {
          if (err) { this.$store.commit('addLog', { text: err, type: 'error' }); throw err }
          else this.deleteBackupFromDb(backupDate)
        })
      } else this.deleteBackupFromDb(backupDate)
      this.dialogDeleteBackup = false
      this.selectedBackup = []
    },
    deleteBackupFromDb(backupDate) {
      this.$store.commit('addLog', { text: `Backup "${backupDate}" successfully deleted`, type: 'info' })
      this.backups = this.getBackups()
    },
    restartApp() { ipcRenderer.send('reload') },
    openDialog() {
      this.dialog = true
      setTimeout(() => { this.backups = this.getBackups() }, 500)
    },
  },
}
</script>