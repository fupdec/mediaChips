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
          <v-btn color="primary" @click="testPathToSystemPlayer" block>Test</v-btn>
        </v-col>
      </v-row>

      <div class="subtitle mt-4 mb-2">
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" left small>
              mdi-help-circle-outline
            </v-icon>
          </template>
          <span>Number of videos, performers, tags and websites</span>
        </v-tooltip>
        Update data from videos:
      </div>
      <v-btn @click="updateNumberOfVideos" color="primary"> Start updating </v-btn>
      <v-dialog v-model="dialogUpdateNumberOfVideos" width="600" scrollable persistent>
        <v-card>
          <v-card-title>
            <div>Updating data from video</div>
            <v-spacer></v-spacer>
            <v-icon>mdi-video-outline</v-icon>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-10">
            <div v-if="updatingNumberOfVideos" class="text-center">
              <h3 class="mb-2">Update in progress...</h3>
              <v-icon x-large class="loading-animation">mdi-loading</v-icon>
            </div>
            <div v-else class="text-center">
              <h3 class="mb-2">Data updated!</h3>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn @click="dialogUpdateNumberOfVideos=false" :disabled="updatingNumberOfVideos"
              color="primary" class="ma-4">OK</v-btn>
            <v-spacer/>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <div class="headline text-h5 text-center mt-10 mb-4"> Video preview
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" right small>
              mdi-help-circle-outline
            </v-icon>
          </template>
          <span>Plays on hover</span>
        </v-tooltip>
      </div>
      <v-row>
        <v-col cols="12" sm="6">
          <div class="subtitle">Video preview enabled:</div>
          <v-switch v-model="videoPreview" inset style="display:inline-block;">
            <template v-slot:label>
              <span v-if="videoPreview">Yes</span>
              <span v-else>No</span>
            </template>
          </v-switch>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="subtitle mb-8">Delay before starting playback (in seconds):</div>
          <v-slider v-model="delayVideoPreview" :min="0" :max="5" :disabled="!videoPreview"
            hide-details :thumb-size="24" thumb-label="always" />
        </v-col>
      </v-row>

      <v-divider class="my-12"></v-divider>


      <div class="headline text-h4 text-center" id="performers">Performers</div>
      <div class="headline text-h5 text-center mt-10 mb-4"> Meter
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" right small>
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
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" left small>
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
      <v-container class="px-0">
        <v-row>
          <v-col cols="12" sm="6">
            <div class="subtitle mt-8">Dark mode:</div>
            <v-switch v-model="darkMode" inset style="display:inline-block;">
              <template v-slot:label>
                <span v-if="darkMode">Yes</span>
                <span v-else>No</span>
              </template>
            </v-switch>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="subtitle mt-8">Use header gradient:</div>
            <v-switch v-model="headerGradient" inset style="display:inline-block;">
              <template v-slot:label>
                <span v-if="headerGradient">Yes</span>
                <span v-else>No</span>
              </template>
            </v-switch>
          </v-col>
          <v-col cols="12" sm="6" v-if="headerGradient">
            <div class="subtitle mb-2">Colors for header gradient (light theme):</div>
            <v-btn @click="openDialogHeaderGradientLight" color="primary">
              <v-icon left>mdi-palette</v-icon> Change
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" v-if="headerGradient">
            <div class="subtitle mb-2">Colors for header gradient (dark theme):</div>
            <v-btn @click="openDialogHeaderGradientDark" color="primary">
              <v-icon left>mdi-palette</v-icon> Change
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <HeaderGradient :themeDark="gradientThemeDark"/>

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
      

      <div class="headline text-h4 text-center mt-6" id="login">Login</div>
      <v-container class="px-0">
        <v-row>
          <v-col cols="12" sm="3">
            <div class="subtitle mt-8">Password protect entry:</div>
            <v-switch v-model="passwordProtection" inset style="display:inline-block;">
              <template v-slot:label>
                <span v-if="passwordProtection">Yes</span>
                <span v-else>No</span>
              </template>
            </v-switch>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="subtitle mt-8 mb-2">Password:</div>
            <v-form ref="pass" v-model="validPass">
              <v-text-field :disabled="!passwordProtection"
                v-model="password" :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[getPasswordRules]" :type="showPassword ? 'text' : 'password'" solo  
                @click:append="showPassword = !showPassword" validate-on-blur counter dense
              />
              <v-btn v-if="passwordProtection" @click="savePass" color="primary" small :disabled="!validPass">
                <v-icon left>mdi-content-save</v-icon> Save
              </v-btn>
            </v-form>
          </v-col>
          <v-col cols="12" sm="5">
            <div class="subtitle mt-8 mb-2">Hint for password:</div>
            <v-form ref="hint" v-model="validHint">
              <v-text-field :disabled="!passwordProtection"
                v-model="hint" :rules="[getHintRules]" solo counter dense
                @click:append="showPassword = !showPassword" validate-on-blur
              />
              <v-btn v-if="passwordProtection" @click="saveHint" color="primary" small :disabled="!validHint">
                <v-icon left>mdi-content-save</v-icon> Save
              </v-btn>
            </v-form>
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
          <div>Adult Video Database 0.5.4</div>
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
import HeaderGradient from '@/components/pages/settings/HeaderGradient.vue'
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
    HeaderGradient,
    ThemeColors,
    ManageBackups,
    ClearDatabases,
    EditPerformerInfoParameters,
    vuescroll,
  },
  mounted () {
    this.$nextTick(function () {
      this.password = this.$store.getters.phrase
      this.hint = this.$store.getters.passwordHint
    })
  },
  data: ()=>({
    password: '',
    showPassword: false,
    validPass: false,
    hint: '',
    validHint: false,
    dialogUpdateNumberOfVideos: false,
    updatingNumberOfVideos: false,
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
    dialogChangeHeaderGradientLight: false,
    dialogChangeHeaderGradientDark: false,
    dialogUpdatePath: false,
    pathForSearch: '',
    pathForUpdate: '',
    videosWithSamePath: [],
    dialogResetToDefaultSettings: false,
    isScrollToTopVisible: false,
    gradientThemeDark: null,
  }),
  computed: {
    videoPreview: {
      get() {
        return this.$store.state.Settings.videoPreviewEnabled
      },
      set(value) {
        this.$store.dispatch('updateVideoPreviewEnabled', value)
      },
    },
    delayVideoPreview: {
      get() {
        return this.$store.state.Settings.delayVideoPreview
      },
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeDelayVideoPreview', value)
        }, 1000)
      },
    },
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
      set(value) {
        this.$store.dispatch('toggleNavigationSide', value)
      },
    },
    darkMode: {
      get() {
        return this.$store.getters.darkMode
      },
      set(value) {
        this.$vuetify.theme.dark = value
        this.$store.dispatch('toggleDarkMode', value)
      },
    },
    headerGradient: {
      get() {
        return this.$store.getters.headerGradient
      },
      set(value) {
        this.$store.dispatch('toggleHeaderGradient', value)
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
    passwordProtection: {
      get() {
        return this.$store.state.Settings.passwordProtection
      },
      set(value) {
        this.$store.dispatch('changePasswordProtection', value)
      },
    },
  },
  methods: {
    updateNumberOfVideos() {
      this.dialogUpdateNumberOfVideos = true
      this.updatingNumberOfVideos = true
      const videos = this.$store.getters.videos
      setTimeout(()=>{
        // update performer data
        this.$store.getters.performers.each(p=>{
          const vids = videos.filter(v=>(v.performers.includes(p.name)))
          p.videos = vids.value().length // write number of videos
          // get tags of videos
          let tagsAllVideos = vids.map('tags').value()
          let tags = []
          tagsAllVideos.map(vTags=>{ if (vTags.length>0) vTags.map(tag=>tags.push(tag)) })
          tags = tags.filter((x, i, a) => a.indexOf(x) === i) // get unique values
          tags = tags.filter(el => (el !== null && el !== undefined))
          p.videoTags = tags.sort((a, b) => a.localeCompare(b)) // write tags of videos
          // get websites of videos
          let websites = vids.map('website').value()
          websites = websites.filter((x, i, a) => a.indexOf(x) === i) // get unique values
          websites = websites.filter(el => (el !== null && el !== undefined && el !== ""))
          p.websites = websites.sort((a, b) => a.localeCompare(b)) // write websites of videos
        }).write()

        // update tag data
        this.$store.getters.tags.each(t=>{
          const vids = videos.filter(v=>(v.tags.includes(t.name)))
          t.videos = vids.value().length // write number of videos
          // get performers of tag
          let performers = this.$store.getters.performers.filter({tags:[t.name]}).map('name').value()
          t.performers = performers.sort((a, b) => a.localeCompare(b)) // write performers of tag
        }).write()

        // update website data
        this.$store.getters.websites.each(w=>{
          const vids = videos.filter({website: w.name})
          w.videos = vids.value().length // write number of videos
          // get performers of videos
          let performersAllVideos = vids.map('performers').value()
          let performers = []
          performersAllVideos.map(perfs=>{ if (perfs.length>0) perfs.map(p=>performers.push(p)) })
          performers = performers.filter((x, i, a) => a.indexOf(x) === i) // get unique values
          performers = performers.filter(el => (el !== null && el !== undefined))
          w.performers = performers.sort((a, b) => a.localeCompare(b)) // write performers of videos
          // get tags of videos
          let tagsAllVideos = vids.map('tags').value()
          let tags = []
          tagsAllVideos.map(vTags=>{ if (vTags.length>0) vTags.map(tag=>tags.push(tag)) })
          tags = tags.filter((x, i, a) => a.indexOf(x) === i) // get unique values
          tags = tags.filter(el => (el !== null && el !== undefined))
          w.videoTags = tags.sort((a, b) => a.localeCompare(b)) // write tags of videos
        }).write()
        this.updatingNumberOfVideos = false
      }, 500)
    },
    openDialogHeaderGradientLight() {
      this.gradientThemeDark = false
      this.$store.state.Settings.dialogHeaderGradient = true
    },
    openDialogHeaderGradientDark() {
      this.gradientThemeDark = true
      this.$store.state.Settings.dialogHeaderGradient = true
    },
    openGithub() {
      shell.openExternal('https://github.com/fupdec/Adult-Video-Database')
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
    savePass() {
      this.$store.dispatch('changePhrase', this.password)
    },
    saveHint() {
      this.$store.dispatch('changePasswordHint', this.hint)
    },
    getPasswordRules(pass) {
      if (pass.length > 100) {
        return 'Password must be less than 100 characters'
      } else if (pass.length===0) {
        return 'Password is required'
      } else if (pass.length<4) {
        return 'Password must be more than 3 characters'
      } else {
        return true
      }
    },
    getHintRules(pass) {
      if (pass.length > 100) {
        return 'Hint must be less than 100 characters'
      } else if (pass.length<4) {
        return 'Hint must be more than 3 characters'
      } else {
        return true
      }
    },
  },
}
</script>


<style lang="less" scoped>
.loading-animation {
  animation: rotate 0.5s infinite linear;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>