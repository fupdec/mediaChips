<template>
	<div class="app-bar-container">
    <div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-account-plus</v-icon>
              </v-btn>
            </template>
            <span>Add new performer</span>
          </v-tooltip>
        </template>
        <v-card width="500">
          <v-card-title class="py-1">
            <span class="headline">Add new performer</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-account-plus</v-icon>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pb-0">
            <v-form ref="form" v-model="validPerformerName">
              <v-textarea
                v-model="performerName" required :rules="nameRules" outlined label="Names"
                hint='Write a name on a new line to add several performers at once.' no-resize
              ></v-textarea>
              <v-alert
                v-model="alertDuplicatePerformers" border="left" text dense class="mt-6" 
                close-text="Close" type="warning" dismissible icon="mdi-account-multiple-outline"
              > Already in the database: {{duplicatePerformers}} </v-alert>
              <v-alert
                v-model="alertAddNewPerformers" border="left" text dense close-text="Close"
                icon="mdi-account-plus-outline" type="success" dismissible class="mt-6" 
              > Added: {{newPerformers}} </v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="pasteText" color="secondary" class="mb-2 ml-2" small> 
              <v-icon left>mdi-clipboard-text-outline</v-icon> Paste text
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn 
              @click="addNewPerformer" :disabled="!validPerformerName"
              color="primary" class="mb-2 mr-2" small
            > <v-icon left>mdi-account-plus-outline</v-icon> Add
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </div>
    <PerformersAppbarActions />

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="openRandomPerformer" icon tile v-on="on"> 
            <v-icon>mdi-dice-5</v-icon>
        </v-btn>
      </template>
      <span>Open random performer</span>
    </v-tooltip>
    
    <v-spacer></v-spacer>

    <PerformersAppbarCardView />
	</div>
</template>


<script>
const shortid = require("shortid")

import { ipcRenderer } from 'electron'

export default {
  name: 'PerformersAppbar',
  components: {
    PerformersAppbarActions: () => import('@/components/elements/PerformersAppbarActions.vue'),
    PerformersAppbarCardView: () => import('@/components/elements/PerformersAppbarCardView.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    validPerformerName: false,
    performerName: "",
    alertDuplicatePerformers: false,
    alertAddNewPerformers: false,
    duplicatePerformers: "",
    newPerformers: "",
    nameRules: [
      v => !!v || 'Name is required',
      v => v.length > 2 || 'Name must be more than 2 characters',
      v => !/[%"?<>{}\[\]]/g.test(v) || 'Name must not content \\/\%\"?<>{}\[\]',
    ],
  }),
  computed: {
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    async pasteText() {
      this.performerName = await navigator.clipboard.readText()
    },
    addNewPerformer() {
      // filter user entered data
      let performersArray  = this.performerName.trim()
      performersArray = performersArray.replace(/[\\/\%\"?<>{}\[\]]/g, '')
      performersArray = performersArray.split(/\r?\n/)
      performersArray = performersArray.filter((el)=>(el != ""))
      performersArray = performersArray.map(s => s.trim())
      console.log(`start:::${performersArray.join(', ')}:::end`)
      let dups = []
      let newPerformers = []
      let db = this.$store.getters.performers
      let params = this.$store.state.Settings.customParametersPerformer

      async function addPerformerInDb() {
        for (const performer of performersArray) {
          // check for duplicate name of performer
          let duplicate = db.find(p=>(p.name.toLowerCase()===performer.toLowerCase())).value()
          if (duplicate) {
            console.warn(`performer ${JSON.stringify(duplicate.name)} already in DB`)
            dups.push(duplicate.name)
            continue;
          }

          // create performer info
          let performerID = shortid.generate()
          let performerInfo = {
            id: performerID,
            name: performer,
            date: Date.now(),
            edit: Date.now(),
            aliases: [],
            tags: [],
            favorite: false,
            bookmark: false,
            rating: 0,
            nations: [],
            birthday: "",
            start: "",
            end: "",
            ethnicity: [],
            hair: [],
            eyes: [],
            height: "",
            weight: "",
            bra: "",
            waist: "",
            hip: "",
            boobs: [],
            cups: [],
            category: [],
            videos: 0,
            tags: [],
            videoTags: [],
            websites: [],
            views: 0,
          }

          for (let param in params) {
            let type = params[param].type
            if (type == 'boolean') {
              performerInfo[params[param].name] = false
            } else if (type == 'number' || type == 'string' || type == 'date') {
              performerInfo[params[param].name] = ''
            } else if (type == 'array') {
              performerInfo[params[param].name] = []
            }
          }

          // add performerInfo to DB
          await db.push(performerInfo).write()
          newPerformers.push(performer)
          console.log(`added performer "${performerInfo.name}": ${JSON.stringify(performerInfo)}`);
        }
      }
      addPerformerInDb().then(() => {
        this.duplicatePerformers = dups.join(", ")
        if(this.duplicatePerformers) {
          this.alertDuplicatePerformers = true
        } else { this.alertDuplicatePerformers = false }
        this.newPerformers = newPerformers.join(", ")
        console.log("Performers added!");
        if(this.newPerformers) {
          this.alertAddNewPerformers = true
        } else { this.alertAddNewPerformers = false }
        this.performerName = ""
        this.$store.commit('updatePerformers')
        this.$store.dispatch('filterPerformers', true)
        ipcRenderer.send('updatePlayerDb', 'performers') // update performers in player window
      })
    },
    openRandomPerformer() {
      const performers = this.$store.getters.filteredPerformers.value()
      if (performers.length == 0) return
      if (performers.length == 1) {
        this.openPerformerPage(performers[0].id)
        return
      }
      const rand = this.getRandomIntInclusive(1, performers.length)
      const performerId = performers[rand-1].id
      this.openPerformerPage(performerId)
    },
    getRandomIntInclusive(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    openPerformerPage(performerId) {
      this.$router.push(`/performer/:${performerId}?tabId=default`)
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.colored {
  border-radius: 3px;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)
}
</style>