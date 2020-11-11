<template>   
  <div>
    <v-row>
      <v-col cols="10">
        <v-data-table
          v-model="selectedBackup" :headers="headers" :items="backups" item-key="date"
          single-select show-select dense class="elevation-2"
          no-data-text="No backups have been created" @input="backupError=false"
        ><template v-slot:top>
          <v-alert type="error" dense text :value="backupError">
            Please select a backup
          </v-alert>
        </template>
        </v-data-table>
      </v-col>
      <v-col cols="2">
        <v-btn @click="dialogCreateBackup = true" 
          light depressed small block class="backup-btn" color="#8ffe71"
        ><v-icon left>mdi-database-plus</v-icon> Create
        </v-btn>

        <v-btn  @click="openDialogRestoreBackup" :disabled="isNoBackups"
          light depressed small block class="backup-btn" color="#ffdf97" 
        ><v-icon left>mdi-database-refresh</v-icon> Restore 
        </v-btn>

        <v-btn  @click="importBackup"
          light depressed small block class="backup-btn" color="#91cdff" 
        ><v-icon left>mdi-database-import</v-icon> Import 
        </v-btn>
        
        <v-btn @click="exportBackup" :disabled="isNoBackups"
          light depressed small block class="backup-btn" color="#ffbcd8"
        ><v-icon left>mdi-database-export</v-icon> Export 
        </v-btn>

        <v-btn @click="openDialogDeleteBackup" :disabled="isNoBackups"
          light depressed small block class="backup-btn" color="#ff6f64"
        ><v-icon left>mdi-database-remove</v-icon> Delete 
        </v-btn>
      </v-col>
    </v-row>
    <v-dialog v-model="dialogCreateBackup" width="400" persistent>
      <v-card :loading="isCreatingBackupRun" loader-height="5">
        <v-card-text class="py-6 title">Create a backup?</v-card-text>
        <v-card-text class="text-center">
          <v-icon size="72" color="green">mdi-database-plus</v-icon>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="dialogCreateBackup=false" :disabled="isCreatingBackupRun"
            class="ma-2">Close</v-btn>
          <v-btn @click="createBackup" :disabled="isCreatingBackupRun"
            class="ma-2" color="green"> Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogRestoreBackup" width="400" persistent>
      <v-card :loading="isRestoringBackupRun" loader-height="5">
        <v-card-text v-if="!isBackupRestoredSuccessfully" class="text-center">
          <div class="subtitle-2 py-6">
            This will replace current state of the database.
            <br>Confirm if you are sure.
          </div>
          <v-icon size="72" color="red">mdi-alert-outline</v-icon>
        </v-card-text>
        <v-card-text v-else class="text-center py-6">
          Backup restored. Need to restart application.
          <v-btn @click="restartApp" class="ma-6" color="green">Restart</v-btn>
        </v-card-text>
        <v-card-text v-if="isBackupRestoredError" class="text-center py-6">
          An error occurred while restoring.
        </v-card-text>
        <v-card-actions v-if="!isBackupRestoredSuccessfully">
          <v-spacer></v-spacer>
          <v-btn @click="dialogRestoreBackup = false" :disabled="isRestoringBackupRun" 
            class="ma-2">Close</v-btn>
          <v-btn @click="restoreBackup" :disabled="isRestoringBackupRun" 
            class="ma-2" depressed color="primary">Restore</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDeleteBackup" width="400" persistent>
      <v-card>
        <v-card-text class="py-6 title">Delete a backup?</v-card-text>
        <v-card-text class="text-center">
          <v-icon size="72" color="red">mdi-database-remove</v-icon>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="dialogDeleteBackup=false" class="ma-2">Close</v-btn>
          <v-btn @click="deleteBackup" class="ma-2" color="red">Delete
          </v-btn>
        </v-card-actions>
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

export default {
  name: 'ManageBackups',
  components: {
	},
  mounted() {
    this.$nextTick(function () {
      if (this.$store.state.Settings.backups.length!==0) this.isNoBackups=false
      this.backups = this.getBackups()
    })
  },
  data: () => ({
    backups: [],
    selectedBackup: [],
    isCreatingBackupRun: false,
    isRestoringBackupRun: false,
    headers: [
      { text: 'Date, time', value: 'date' },
      { text: 'Videos', value: 'videos' },
      { text: 'Performers', value: 'performers' },
      { text: 'Tags', value: 'tags' },
      { text: 'Websites', value: 'websites' },
      { text: 'Total size (MB)', value: 'size', sort: (a,b)=>(a-b) }, 
    ],
    backupError: false,
    isNoBackups: true,
    isBackupRestoredSuccessfully: false,
    isBackupRestoredError: false,
    dialogCreateBackup: false,
    dialogRestoreBackup: false,
    dialogDeleteBackup: false,
  }),
  computed: {
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    getBackups() {
      if (this.$store.state.Settings.backups.length === 0) {
        this.isNoBackups = true 
      } else {
        this.isNoBackups = false
      }
      let backups = JSON.parse(JSON.stringify(this.$store.state.Settings.backups))
      let backupsFixedSize = backups.map(backup=>{
        backup.size = (backup.size / 1024 / 1024).toFixed(2)
        return backup
      })
      return backupsFixedSize
    },
    clearFiles(directory) {
      fs.readdir(directory, (err, files) => {
        if (err) throw err

        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err
          })
        }
      })
    },
    getRestoreBackupRules(name) {
      if (name.length===0) {
        return 'Need to choose any backup'
      } else {
        return true
      }
    },
    createBackup() {
      this.isCreatingBackupRun = true
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
          backupDB = path.join(this.pathToUserData, '/backups/'+backupName+'/databases/'),
          backupInfo = {},
          vm = this
          
      backupInfo.date = backupName
      backupInfo.videos = this.$store.getters.videosTotal
      backupInfo.performers = this.$store.getters.performersTotal
      backupInfo.tags = this.$store.getters.tagsTotal
      backupInfo.websites = this.$store.getters.websitesTotal

      console.log('backup creation started')
      let output = fs.createWriteStream(path.join(this.pathToUserData,'/backups/'+backupName+'.zip'))
      let archive = archiver('zip')
      output.on('close', function() {
        backupInfo.size = archive.pointer()
        vm.$store.getters.settings.get('backups').push(backupInfo).write()
        vm.$store.dispatch('setNotification', {
          type: 'success',
          text: 'Backup successfully created'
        })
        vm.isCreatingBackupRun = false
        vm.$store.dispatch('updateBackups')
        vm.backups = vm.getBackups()
        console.log(archive.pointer() + ' total bytes')
        console.log('archiver has been finalized and the output file descriptor has closed.')
        vm.dialogCreateBackup = false
      })
      archive.on('error', function(err) { 
        vm.$store.dispatch('setNotification', { type: 'error', text: err })
        throw err 
      })
      archive.pipe(output)
      archive.directory(currentDB, 'databases')
      archive.directory(currentFiles, 'media')
      archive.append(JSON.stringify(backupInfo), { name: 'info.json' })
      archive.finalize()
    },
    openDialogRestoreBackup() {
      if (this.selectedBackup.length == 0) {
        this.backupError = true
        return false
      } else {
        this.dialogRestoreBackup = true
        this.backupError = false
      }
    },
    async restoreBackup() {
      this.isRestoringBackupRun = true
      let date = this.selectedBackup[0].date,
          appDb = path.join(this.pathToUserData, '/databases/'),
          appFiles = path.join(this.pathToUserData, '/media/'),
          backupDB = path.join(this.pathToUserData, '/backups/temp/databases/'),
          backupFiles = path.join(this.pathToUserData, '/backups/temp/media/')
      // clear folders with media
      await this.clearFiles(appFiles + 'thumbs/')
      await this.clearFiles(appFiles + 'previews/')
      await this.clearFiles(appFiles + 'performers/')
      await this.clearFiles(appFiles + 'tags/')
      await this.clearFiles(appFiles + 'websites/')
      await this.clearFiles(appDb)
      let backupPath = path.join(this.pathToUserData, '/backups/'+date+'.zip')
      let backupDestinationPath = path.join(this.pathToUserData)

      const zip = new StreamZip({
        file: backupPath,
        storeEntries: true
      })
      zip.on('ready', () => {
        zip.extract(null, backupDestinationPath, (err, count) => {
          if (err) {
            this.isRestoringBackupRun = false
            this.isBackupRestoredError = true
            console.log(err);
          } else {
            let backupInfoPath = path.join(this.pathToUserData, '/info.json')
            fs.unlink(backupInfoPath)

            this.$store.dispatch('setNotification', {
              type: 'success',
              text: 'Backup successfully restored'
            })
            this.isRestoringBackupRun = false
            this.isBackupRestoredSuccessfully = true
            console.log(`Extracted ${count} entries`);
          }
          zip.close();
        })
      })
    },
    importBackup() {
      dialog.showOpenDialog(null, {
        properties: ['openFile']
      }).then(result => {
        if (result.filePaths.length !== 0) {
          let backupPath = result.filePaths[0]
          let extension = backupPath.substr(backupPath.lastIndexOf('.') + 1)
          if (extension !== 'zip') {
            this.$store.dispatch('setNotification', {
              type: 'error',
              text: 'The selected file is not a backup'
            })
            return false
          }
          let backupInfo = {}
          // read info.json from backup archive
          const zip = new StreamZip({
            file: backupPath,
            storeEntries: true
          })
          zip.on('ready', () => {
            backupInfo = zip.entryDataSync('info.json').toString('utf8')
            backupInfo = JSON.parse(backupInfo)

            let importPath = path.join(this.pathToUserData, '/backups/')
            let duplicate = this.$store.getters.settings.get('backups').find({'date':backupInfo.date}).value()
            if (duplicate !== undefined) {
              this.$store.dispatch('setNotification', {
                type: 'error',
                text: 'This backup already exists'
              })
              return false
            } else {
              backupInfo.size = fs.statSync(backupPath).size
              fs.copyFile(backupPath, importPath+backupInfo.date+'.zip', (err) => {
                if (err) {
                  this.$store.dispatch('setNotification', {
                    type: 'error',
                    text: err
                  })
                  throw err
                } else {
                  this.$store.getters.settings.get('backups').push(backupInfo).write()
                  this.$store.dispatch('setNotification', {
                    type: 'success',
                    text: 'Backup successfully imported'
                  })
                  this.$store.dispatch('updateBackups')
                  this.backups = this.getBackups()
                }
              })
            }
            zip.close()
          })
        }
      }).catch(err => {
        console.log(err)
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: err
        })
      })
    },
    exportBackup() {
      if (this.selectedBackup.length == 0) {
        this.backupError = true
        return false
      } else {
        this.backupError = false
      }
      dialog.showOpenDialog(null, {
        properties: ['openDirectory']
      }).then(result => {
        if (result.filePaths.length !== 0) {
          let date = this.selectedBackup[0].date
          let backupPath = path.join(this.pathToUserData, '/backups/'+date+'.zip')
          let exportPath = path.join(result.filePaths[0], '/'+date+'.zip')
          fs.copyFile(backupPath, exportPath, (err) => {
            if (err) {
              this.$store.dispatch('setNotification', {
                type: 'error',
                text: err
              })
              throw err
            } else {
              this.$store.dispatch('setNotification', {
                type: 'success',
                text: 'Backup successfully exported'
              })
              console.log('backup was exported')
            }
          })
        }
      }).catch(err => {
        console.log(err)
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: err
        })
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
      fs.unlink(backupPath, err => {
        if (err) {
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: err
          })
          throw err
        } else {
          this.$store.getters.settings.get('backups').remove({ 'date': backupDate }).write()
          this.$store.dispatch('setNotification', {
            type: 'success',
            text: 'Backup successfully deleted'
          })
          this.$store.dispatch('updateBackups')
          this.backups = this.getBackups()
        }
      })
      this.dialogDeleteBackup = false
    },
    restartApp() {
      ipcRenderer.send('reload')
    },
  },
}
</script>

<style lang="less">
.backup-btn {
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>