<template>
  <div>
    <div class="headline text-h5 text-center pb-4">Application registration</div>
    <v-row>
      <v-col cols="12" sm="6" align="center">
        <v-btn @click="openDialog" color="primary" rounded>
          <v-icon left>mdi-key-variant</v-icon> Register with a license key </v-btn>
      </v-col>
      <v-col cols="12" sm="6" align="center">
        <v-btn v-if="registration.license_type!=='Lifetime'" @click="openLink('https://mediachips.app/')" rounded color="primary" class="mb-2">
          <v-icon left>mdi-key</v-icon> Buy lifetime license key </v-btn>
        <v-btn v-if="registration.license_type!=='Month'" @click="openLink('https://patreon.com/mediachips')" rounded color="#ff424d">
          <v-icon left>mdi-patreon</v-icon> {{registration.license_type!=='Lifetime'?'Subscribe monthly':'Support development'}} </v-btn>
      </v-col>
    </v-row>
    <div v-if="registration" class="mt-4">
      <div>License key: <span class="user-select">{{registration.license_code || '??'}}</span></div>
      <div class="d-flex justify-space-between">
        <span>
          <div>Expiration date: {{registration.license_expiry || '??'}}</div>
          <v-btn v-if="reg" @click="deactivateKey" color="red" small rounded dark class="mt-2"> 
            <v-icon left>mdi-cancel</v-icon> Deactivate key </v-btn>
        </span>
        <v-chip :color="reg?'green':'red'" outlined label> 
          <span>Application {{reg?'registered':'not registered'}}</span>
        </v-chip>
      </div>
    </div>
    
    <v-dialog v-model="dialogRegistration" scrollable persistent max-width="650" overlay-opacity="0.8">
      <v-stepper v-model="registrationSteps">
        <v-stepper-header style="height: 50px;">
          <v-stepper-step :complete="registrationSteps > 1" step="1" class="py-0">
            Entering key
          </v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step :complete="registrationSteps > 2" step="2" class="py-0">
            Key status
          </v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step step="3" class="py-0">
            Registration
          </v-stepper-step>
        </v-stepper-header>
        <v-divider></v-divider>
        <v-stepper-items>
          <v-stepper-content step="1" class="pa-0">
            <v-card :loading="isConnectionBusy">
              <v-card-text class="text-center">
                <v-form ref="license" v-model="validLicenseKey" class="d-flex" @submit.prevent>
                  <v-text-field v-model="licenseKey" :rules="[getLicenseRules]" autofocus
                    label="License key" hint="XXXXXX-XXXXXX-XXXXXX-XXXXXX" @keyup.enter="checkLicense"/>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="dialogRegistration=false" class="ma-2">
                  <v-icon left>mdi-cancel</v-icon> Cancel </v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="checkLicense" :disabled="isConnectionBusy" color="primary" class="ma-2">
                  <v-icon left>mdi-key-variant</v-icon> Check Key Status 
                  <v-icon large right>mdi-chevron-right</v-icon> </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-content>

          <v-stepper-content step="2" class="pa-0">
            <v-card :loading="isConnectionBusy">
              <v-card-text class="text-center body-1">
                <div>Key: <b>{{licenseKey}}</b></div>
                <div>Remaining number of devices for registration: <b>{{numberOfActivations}}</b></div>
                <div>Key expiration date: <b>{{licenseExpiryDate}}</b></div>
                <v-divider v-if="numberOfActivations==0||isKeyExpired" class="my-4"/>
                <div v-if="numberOfActivations==0">The number of activations has been exceeded.</div>
                <div v-if="isKeyExpired">This key has expired.</div>
                <div v-if="numberOfActivations==0||isKeyExpired">Please enter another key for continue.</div>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="closeDialog" class="ma-2">
                  <v-icon left>mdi-cancel</v-icon> Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="registrationSteps = 1" class="ma-2">
                  <v-icon large left>mdi-chevron-left</v-icon> Back to entering key </v-btn>
                <v-btn @click="register" color="primary" class="ma-2"
                  :disabled="numberOfActivations==0 || isConnectionBusy || isKeyExpired"> 
                  <v-icon left>mdi-key-variant</v-icon> Register app 
                  <v-icon large right>mdi-chevron-right</v-icon> </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-content>
          
          <v-stepper-content step="3" class="pa-0">
            <v-card :loading="isConnectionBusy">
              <v-card-text class="text-center body-1">
                <b v-if="reg" class="green--text">Congratulations!</b>
                <b v-else class="red--text">Failed to register the application</b>
                <div>{{registrationStatus}}</div>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog" block> OK </v-btn>
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-card>
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-dialog>
  </div>
</template>


<script>
import { machineIdSync } from 'node-machine-id'
import Keys from '@/mixins/Keys.vue'

const axios = require("axios")
const shell = require('electron').shell
const { ipcRenderer } = require('electron')

export default {
  name: 'Registration',
  components: {},
  mixins: [Keys], 
  mounted() {
    this.$nextTick(function () {
      if (this.registration.length==0) this.registration = JSON.stringify(this.defaultLicenseObject)
    })
  },
  data: () => ({
    dialogRegistration: false,
    registrationSteps: 1,
    licenseKey: '',
    validLicenseKey: false,
    isConnectionBusy: false,
    numberOfActivations: null,
    licenseExpiryDate: '',
    isKeyExpired: false,
    registrationStatus: '',
    defaultLicenseObject: {
      license_code: '',
      license_created: '',
      license_expiry: '',
      license_type: '',
      client_email: '',
      client_name: '',
      fingerprint_1: '',
      fingerprint_2: '',
      fingerprint_3: '',
    },
  }),
  computed: {
  },
  methods: {
    getLicenseRules(key) {
      if (key.length > 50) return 'Key must be less than 50 characters'
      else if (key.length===0) return 'Key is required'
      else return true
    },
    openDialog() {
      this.registrationSteps = 1
      this.licenseKey = this.registration.license_code || ''
      this.dialogRegistration = true
    },
    closeDialog() {
      this.dialogRegistration = false
      setTimeout(() => { this.registrationSteps = 1 }, 1000)
    },
    openLink(link) { shell.openExternal(link) },
    checkLicense() {
      this.$refs.license.validate()
      if (!this.validLicenseKey) return
      this.isConnectionBusy = true
      let query = `${this.domain}check?api_key=${this.apiKey}&license_code=${this.licenseKey}`
      axios.get(query).then((response) => {
        this.isConnectionBusy = false
        if(response.status === 200) {
          if (response.data) {
            let fingerprints = [response.data.fingerprint_1,response.data.fingerprint_2,response.data.fingerprint_3]
            let numberOfActivations = 0
            for (let i = 0; i < fingerprints.length; i++) {
              if (!fingerprints[i].length) ++numberOfActivations
            }
            let today = new Date()
            today = today.toISOString().substring(0, 10)
            this.isKeyExpired = today > response.data.license_expiry
            if (fingerprints.includes(machineIdSync())) ++numberOfActivations  // if this device already activated
            this.licenseExpiryDate = response.data.license_expiry
            this.numberOfActivations = numberOfActivations
            this.registrationSteps = 2
          } else {
            this.$store.dispatch('setNotification', {
              type: 'error',
              text: `Key "${this.licenseKey}" not found`
            })
          }
        } else {
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: `An internet connection error occurred while checking key`
          })
        }
      }).catch(error => {
        this.isConnectionBusy = false
        this.$store.commit('setNotification', {type: 'error',text: error.response.data.message})
      })
    },
    register() {
      this.isConnectionBusy = true
      let id = machineIdSync()
      let query = `${this.domain}activate?api_key=${this.apiKey}&license_code=${this.licenseKey}&fingerprint=${id}`
      axios.get(query).then((response) => {
        if(response.status === 200) {
          this.registrationStatus = response.data.message
          this.registration = JSON.stringify(response.data.license)
          this.registrationSteps = 3
          ipcRenderer.send('updatePlayerDb', 'settings')
        } else {
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: `An internet connection error occurred while checking for updates`
          })
        }
        this.isConnectionBusy = false
      }).catch(error => {
        this.isConnectionBusy = false
        this.$store.commit('setNotification', {type:'error',text:error.response.data.message})
      })
    },
    deactivateKey() {
      let id = machineIdSync()
      let code = this.registration.license_code
      let query = `${this.domain}deactivate?api_key=${this.apiKey}&license_code=${code}&fingerprint=${id}`
      axios.get(query).then((response) => {
        if(response.status === 200) {
          this.registration = JSON.stringify(this.defaultLicenseObject)
          this.$store.dispatch('setNotification', {type:'info',text:response.data.message})
          this.licenseKey = ''
          ipcRenderer.send('updatePlayerDb', 'settings')
        } else {
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: `An internet connection error occurred while checking for updates`
          })
        }
      }).catch(error => {
        this.$store.commit('setNotification', {type:'error',text:error.response.data.message})
      })
    },
  },
}
</script>