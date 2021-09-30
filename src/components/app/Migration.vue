<template>
  <div>
    <v-dialog v-model="dialog" persistent scrollable fullscreen no-click-animation>
      <v-card class="pb-4">
        <v-toolbar color="warning" max-height="64">
          <div class="headline">Updating the database to the latest version</div>
          <v-spacer></v-spacer>
          <v-btn @click="close" outlined><v-icon left>mdi-logout</v-icon>Close application</v-btn>
        </v-toolbar>
        <v-card-text>
          <v-alert type="warning" text outlined class="mt-4">
            Your database is not compatible with this version of the application. To use the app you need to complete the migration process.
          </v-alert>
          <v-alert type="info" text outlined class="mb-10">Make sure you have a backup before migrating
          </v-alert>
          <ManageBackups />
          <v-btn @click="start" color="success" block x-large rounded class="mt-6"> <v-icon class="mr-4" large>mdi-database-sync</v-icon> Start the migration process</v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFinish" persistent width="500">
      <v-card>
        <v-toolbar color="info" max-height="64">
          <div class="headline">Migration complete</div>
        </v-toolbar>
        <v-card-text>
          <v-alert type="info" text outlined class="mt-4">
            You can now use the application. <br> Please close the application and start it again.
          </v-alert>
          <v-btn @click="close" color="success" block x-large rounded><v-icon class="mr-2" large>mdi-logout</v-icon> Close application</v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const remote = require('electron').remote
const win = remote.getCurrentWindow()
const {app} = require('electron').remote

import ManageBackups from '@/components/pages/settings/ManageBackups.vue'

export default {
  name: 'Migration',
  props: {
    version: String,
  },
  components: {ManageBackups},
  mounted () {
    this.$nextTick(function () {
      this.getVersionsForMigration()
    })
  },
  data: () => ({
    dialog: false,
    dialogFinish: false,
    versions: ['0.10.4'],
    versionsForMigration: [],
  }),
  computed: {
    databaseVersion() { return this.$store.state.Settings.databaseVersion },
    actualVersion() { return app.getVersion() },
  },
  methods: {
    start() {
      if (this.versionsForMigration.includes('0.10.4')) {
        let metaCareer = this.$store.getters.meta.find({id:'career'}).value()
        if (!metaCareer) this.$store.getters.meta.push({
          "id": "career",
          "type": "specific",
          "settings": {
            "name": "Career status",
            "icon": "list-status"
          }
        }).write()
      }
      this.$store.dispatch('updateSettingsState', {key:'databaseVersion', value:this.actualVersion})
      this.dialogFinish = true
    },
    getVersionsForMigration() {
      function getVer(version) { return version.split('.').map( s => s.padStart(10) ).join('.') }
      
      for (let i = 0; i < this.versions.length; i++) {
        if (getVer(this.databaseVersion) < getVer(this.versions[i])) {
          this.versionsForMigration = this.versions.slice(i)
          break
        }
      }
      if (this.versionsForMigration.length) this.dialog = true 
    },
    close() { win.close() },
  },
}
</script>