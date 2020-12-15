<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">

    <div class="headline text-h3 text-center my-6">Settings</div>

    <v-container class="pb-10">
      <div class="headline text-h4 text-center mt-6" id="videos">Videos</div>
      <div class="mt-10">
        <v-btn @click="$store.state.Settings.dialogScanVideos=true" block color="primary" x-large>
          <v-icon size="26" left>mdi-plus</v-icon> Add new videos
        </v-btn>
      </div>
      
      <div class="subtitle mt-10 mb-1">Path to system player:</div>
      <div class="caption mb-2">
        <v-icon size="18" left>mdi-alert-box-outline</v-icon>
        This is necessary to play video from a specific time. 
        Works only with Media Player Classic.
      </div>
      <v-row>
        <v-col cols="10">
          <v-text-field v-model="pathToSystemPlayer" outlined dense
            hint="e.g. C:\Program Files\MPC-HC64\mpc-hc64.exe" />
        </v-col>
        <v-col cols="2">
          <v-btn outlined color="primary" @click="testPathToSystemPlayer" block>Test</v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-12"></v-divider>


      <div class="headline text-h4 text-center" id="performers">Performers</div>
      <div class="headline text-h5 text-center mt-10 mb-4"> Meter
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="mx-2" small>
              mdi-help-circle-outline
            </v-icon>
          </template>
          <span>Uses video tag values. 
            <br> Can be hidden by clicking on the button
            <v-icon size="18">mdi-gauge</v-icon> 
          </span>
        </v-tooltip>
      </div>
      
      <v-row>
        <v-col cols="12" sm="6">
          <div class="subtitle mb-10">Height:</div>
          <v-slider v-model="meterHeight" :min="1" :max="20"
            hide-details :thumb-size="32" thumb-label="always" />
        </v-col>
        <v-col cols="12" sm="6">
          <div class="subtitle mb-10">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" class="mx-2" small>
                  mdi-help-circle-outline
                </v-icon>
              </template>
              <span>Change if the meter of tags shows an incorrect value</span>
            </v-tooltip>
            Multiplier:
          </div>
          <v-slider v-model="meterMultiplier" :min="1" :max="100"
            hide-details :thumb-size="32" thumb-label="always" />
        </v-col>
      </v-row>

      <div class="subtitle mt-8 mb-2">Edit performer info parameters:</div>
      <EditPerformerInfoParameters/>
      
      <v-divider class="my-12"></v-divider>


      <div class="headline text-h4 text-center" id="tags">Tags</div>
      <i>No settings for tags</i>
      <v-divider class="my-12"></v-divider>


      <div class="headline text-h4 text-center" id="websites">Websites</div>
      <i>No settings for websites</i>
      <v-divider class="my-12"></v-divider>


      <div class="headline text-h4 text-center" id="appearance">Appearance</div>
      <div class="subtitle mt-8">Navigation menu position:</div>
      <v-radio-group v-model="navigationSide" mandatory row>
        <v-radio label="Side" value="1"></v-radio>
        <v-radio label="Bottom" value="0"></v-radio>
      </v-radio-group>
      
      <div class="subtitle mb-2 mt-8">Limit of pages in pagination:</div>
      <v-btn-toggle 
        dense mandatory color="primary"
        v-model="numberOfPagesLimit"
      >
        <v-btn outlined @click="changeNumberOfPagesLimit(5)" :value="5">5</v-btn>
        <v-btn outlined @click="changeNumberOfPagesLimit(7)" :value="7">7</v-btn>
        <v-btn outlined @click="changeNumberOfPagesLimit(9)" :value="9">9</v-btn>
        <v-btn outlined @click="changeNumberOfPagesLimit(11)" :value="11">11</v-btn>
        <v-btn outlined @click="changeNumberOfPagesLimit(13)" :value="13">13</v-btn>
        <v-btn outlined @click="changeNumberOfPagesLimit(15)" :value="15">15</v-btn>
      </v-btn-toggle>
    
      <div class="headline text-h5 text-center mt-10">Theme</div>
      <div class="subtitle mt-8">Dark mode:</div>
      <v-switch v-model="darkMode" inset style="display:inline-block;">
        <template v-slot:label>
          <span v-if="darkMode">Yes</span>
          <span v-else>No</span>
        </template>
      </v-switch>

      <ThemeColors />

      <v-container class="px-0">
        <v-row>
          <v-col cols="12" sm="6">
            <div class="subtitle mb-2">Text font:</div>
            <v-autocomplete
              v-model="textFont" :items="fonts"
              :style="`font-family:'${textFont}',sans-serif !important;`"
              solo dense placeholder="Main content font"
            >
              <template v-slot:item="data">
                <div :style="`font-family:'${data.item}',sans-serif !important;`">
                  {{data.item}}
                </div>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="subtitle mb-2">Header font:</div>
            <v-autocomplete
              v-model="headerFont" :items="fonts" 
              :style="`font-family:'${headerFont}',sans-serif !important;`"
              solo dense placeholder="Main content font"
            >
              <template v-slot:item="data">
                <span :style="`font-family:'${data.item}',sans-serif !important;`">
                  {{data.item}}
                </span>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
      </v-container>

      <v-divider class="my-12"></v-divider>
      

      <div class="headline text-h4 text-center mt-6" id="database">Database</div>
      <div class="subtitle mt-10">Manage backups:</div>
      <ManageBackups />


      <div class="subtitle mt-8">Update path in videos:</div>
      <v-btn color="primary" @click="dialogUpdatePath=true" class="mt-2">
        <v-icon left>mdi-dots-vertical</v-icon> Show details
      </v-btn>
      <v-dialog v-model="dialogUpdatePath" width="1200" scrollable persistent>
        <v-card>
          <v-card-title class="edit-card-title pa-4 headline">
            <div>
            Update path in videos</div>
            <v-spacer></v-spacer>
            <v-btn outlined @click="dialogUpdatePath=false" dark>
              <v-icon left>mdi-close</v-icon>Close
            </v-btn>
          </v-card-title>
          <v-card-actions class="text-center pb-2">
            <v-container>
              <v-row>
                <v-col cols="6">
                  <v-text-field 
                    v-model="pathForSearch" dense outlined clearable
                    placeholder="Write file path here" label="Search videos with path"
                    append-outer-icon="mdi-clipboard-arrow-right-outline" 
                    @click:append-outer="copyPathToUpload"
                  />
                  <v-btn 
                    @click="searchInVideosPath" :disabled="pathForSearch==''" outlined 
                  >Search
                  </v-btn>
                </v-col>
                <v-col cols="6">
                  <v-text-field 
                    v-model="pathForUpdate" dense outlined clearable
                    placeholder="Write file path here" label="Update videos with path"
                  />
                  <v-btn @click="updatePath" depressed color="primary">Update</v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-card-actions>
          <vuescroll>
            <v-card-text>
              <v-simple-table dense>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">Old path</th>
                      <th class="text-left">New path</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(video, i) in videosWithSamePath" :key="i">
                      <td class="caption">{{video.path}}</td>
                      <td class="caption">{{video.path.replace(pathForSearch,pathForUpdate)}}</td>
                    </tr>
                  </tbody>
                  <!-- TODO: highlight changeble part of string -->
                </template>
              </v-simple-table>
            </v-card-text>
          </vuescroll>
        </v-card>
      </v-dialog>

      <div class="subtitle mt-10 red--text">Clear data:</div>
      <div class="caption mb-2 red--text">
        <v-icon size="18" color="red" left>mdi-alert-outline</v-icon>
        This will completely delete all data. Data recovery is possible only from a backup.
        Make sure you create a backup before clearing.
      </div>
      <ClearDatabases typeOfDB="videos" />
      <ClearDatabases typeOfDB="performers" />
      <ClearDatabases typeOfDB="tags" />
      <ClearDatabases typeOfDB="websites" />
      <ClearDatabases typeOfDB="bookmarks" />
      <!-- TODO: delete apropriate bookmarks when deleted video, performer, tag or website -->
      

      <div class="subtitle mt-10 mb-2">Reset to default settings:</div>
      <v-btn color="orange" @click="dialogResetToDefaultSettings=true">
        <v-icon left>mdi-restore</v-icon> Reset</v-btn>
      <v-dialog v-model="dialogResetToDefaultSettings" width="600">
        <v-card>
          <v-card-title class="headline">
            Reset to default settings
            <v-spacer></v-spacer>
            <v-icon color="orange">mdi-alert</v-icon>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-6 text-center">
            This will reset only visuals: colors, fonts, cards styles and etc. <br>
            <b>Are you sure?</b>
          </v-card-text>
          <v-card-actions>
            <v-btn class="ma-4" @click="dialogResetToDefaultSettings = false">No</v-btn>
            <v-spacer></v-spacer>
            <v-btn class="ma-4" color="orange" @click="resetToDefaultSettings">
              <v-icon left>mdi-restore</v-icon> Yes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      
      <v-divider class="mt-16"></v-divider>
      <v-row>
        <v-col cols="4">
          <div>Adult Video Database 0.5.3</div>
          <p class="text--secondary">by fupdec</p>
          <v-btn color="#eee" light small @click="openGithub">
            <v-icon left>mdi-github</v-icon> Github
          </v-btn>
        </v-col>
        <v-col cols="4" class="text-center">
          <div>2020</div>
        </v-col>
        <v-col cols="4" class="text-right">
          <img src="/icons/icon.png" alt="avdb" width="82" height="82" class="mt-2">
        </v-col>
      </v-row>
    </v-container>


    <div v-show="$store.getters.navigationSide=='0'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </vuescroll>
</template>


<script>
import ThemeColors from '@/components/pages/settings/ThemeColors.vue'
import ManageBackups from '@/components/pages/settings/ManageBackups.vue'
import ClearDatabases from '@/components/pages/settings/ClearDatabases.vue'
import EditPerformerInfoParameters from '@/components/pages/settings/EditPerformerInfoParameters.vue'
import vuescroll from 'vuescroll'
const fs = require('fs-extra')
const path = require("path")
const { spawn } = require( 'child_process' )
const shell = require('electron').shell

export default {
  name: 'SettingsPage',
  components: {
    ThemeColors,
    ManageBackups,
    ClearDatabases,
    EditPerformerInfoParameters,
    vuescroll,
  },
  mounted () {
    this.$nextTick(function () {
    })
  },
  data: ()=>({
    fonts: [
      'Lato',
      'Lobster',
      'Merriweather',
      'Montserrat',
      'OpenSans',
      'OpenSansCondensed',
      'Oswald',
      'PTSans',
      'Quicksand',
      'Roboto',
      'RobotoCondensed'
    ],
    dialogUpdatePath: false,
    pathForSearch: '',
    pathForUpdate: '',
    videosWithSamePath: [],
    dialogResetToDefaultSettings: false,
    isScrollToTopVisible: false,
  }),
  computed: {
    numberOfPagesLimit: {
      get() {
        return this.$store.getters.getNumberOfPagesLimit
      },
      set(number) {
        this.$store.dispatch('changeNumberOfPagesLimit', number)
      }
    },
    navigationSide: {
      get() {
        return this.$store.getters.navigationSide
      },
      set(navigationSideValue) {
        this.$store.dispatch('toggleNavigationSide', navigationSideValue)
      },
    },
    darkMode: {
      get() {
        return this.$store.getters.darkMode
      },
      set(darkModeValue) {
        this.$vuetify.theme.dark = darkModeValue
        this.$store.dispatch('toggleDarkMode', darkModeValue)
      },
    },
    textFont: {
      get() {
        return this.$store.getters.getTextFont
      },
      set(font) {
        this.$store.dispatch('changeTextFont', font)
      },
    },
    headerFont: {
      get() {
        return this.$store.getters.getHeaderFont
      },
      set(font) {
        this.$store.dispatch('changeHeaderFont', font)
      },
    },
    meterHeight: {
      get() {
        return this.$store.state.Settings.meterHeight
      },
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeMeterHeight', value)
        }, 1000)
      },
    },
    meterMultiplier: {
      get() {
        return this.$store.state.Settings.meterMultiplier
      },
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeMeterMultiplier', value)
        }, 1000)
      },
    },
    pathToSystemPlayer: {
      get() {
        return this.$store.state.Settings.pathToSystemPlayer
      },
      set(value) {
        this.$store.dispatch('changePathToSystemPlayer', value)
      },
    },
  },
  methods: {
    openGithub() {
      shell.openExternal('https://github.com/fupdec/AdultVideoDataBase')
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    changeNumberOfPagesLimit(number) {
      this.$store.dispatch('changeNumberOfPagesLimit', number)
    },
    searchInVideosPath() {
      if (this.$store.getters.videos.value().length>1) {
        this.videosWithSamePath = this.$store.getters.videos.filter(v=>(
          v.path.includes(this.pathForSearch)
        )).value()
      }
    },
    updatePath () {
      this.$store.getters.videos.filter(video => (
        video.path.includes(this.pathForSearch)
      )).each(video => {
        video.path = video.path.replace(this.pathForSearch, this.pathForUpdate)
      }).write()
    },
    copyPathToUpload () {
      this.pathForUpdate = this.pathForSearch
    },
    testPathToSystemPlayer () {
      spawn(`${this.pathToSystemPlayer}`)
    },
    resetToDefaultSettings() {
      this.$store.dispatch('resetSettingsToDefault')
      this.dialogResetToDefaultSettings = false
    },
  },
}
</script>