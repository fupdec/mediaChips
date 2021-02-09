<template>
  <vuescroll ref="mainContainer">

    <v-tabs v-model="tab" centered icons-and-text>
      <v-tab href="#videos-settings">Videos<v-icon>mdi-video</v-icon></v-tab>
      <v-tab href="#performers-settings">Performers<v-icon>mdi-account</v-icon></v-tab>
      <v-tab href="#appearance-settings">Appearance<v-icon>mdi-palette</v-icon></v-tab>
      <v-tab href="#application-settings">Privacy<v-icon>mdi-key</v-icon></v-tab>
      <v-tab href="#database-settings">Database<v-icon>mdi-database</v-icon></v-tab>
      <v-tab href="#about-settings">About<v-icon>mdi-information-variant</v-icon></v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item value="videos-settings">
        <v-card flat max-width="800" style="margin: auto;">
          <div class="pt-10">
            <v-btn @click="$store.state.Settings.dialogScanVideos=true" block color="primary" x-large>
              <v-icon size="26" left>mdi-plus</v-icon> Add new videos
            </v-btn>
          </div>

          <div class="subtitle mt-10 mb-1">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" left small>mdi-help-circle-outline</v-icon>
              </template>
              <span>The built-in player does not support all videos, <br>
                BUT it has additional features: markers, playlists, information editing. 
                <br> The list of features will be expanded in new releases!</span>
            </v-tooltip>
            Play video in:
          </div>
          <v-radio-group v-model="playerType" mandatory row>
            <v-radio label="Built-in player" value="0"></v-radio>
            <v-radio label="System player" value="1"></v-radio>
          </v-radio-group>
          <v-divider></v-divider>
          
          <!-- <div class="subtitle mt-10 mb-1">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" left small>mdi-help-circle-outline</v-icon>
              </template>
              <span>This is necessary to play video from a specific time. <br> 
                Works only with Media Player Classic.</span>
            </v-tooltip>
            Path to system player:
          </div>
          <v-row>
            <v-col cols="10">
              <v-text-field v-model="pathToSystemPlayer" outlined dense
                hint="e.g. C:\Program Files\MPC-HC64\mpc-hc64.exe" />
            </v-col>
            <v-col cols="2">
              <v-btn color="secondary" @click="testPathToSystemPlayer" block height="calc(100% - 26px)">Test</v-btn>
            </v-col>
          </v-row> -->
          <!-- TODO remove this option from settings JSON -->
          <v-row>
            <v-col cols="12" sm="6">
              <div class="subtitle mb-2">
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
              <v-btn @click="updateNumberOfVideos" color="secondary"> 
                <v-icon left>mdi-update</v-icon> Start updating </v-btn>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="subtitle mb-2">
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon v-bind="attrs" v-on="on" left small>
                      mdi-help-circle-outline
                    </v-icon>
                  </template>
                  <span>If you have moved the video, you can change the path manually</span>
                </v-tooltip>
                Update path in videos:
              </div>
              <v-btn color="secondary" @click="dialogUpdatePath=true">
                <v-icon left>mdi-dots-vertical</v-icon> Show details
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <v-dialog v-model="dialogUpdateNumberOfVideos" width="600" scrollable persistent>
          <v-card>
            <v-card-title>
              <div class="headline">Updating data from video</div>
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

        <v-dialog v-model="dialogUpdatePath" scrollable persistent>
          <v-card>
            <v-card-title class="edit-card-title pa-4">
              <div class="headline">Update path in videos</div>
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
                    <v-btn @click="searchInVideosPath" :disabled="pathForSearch==''" 
                      color="primary">Search</v-btn>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="pathForUpdate" dense outlined clearable
                      placeholder="Write file path here" label="Update videos with path"/>
                    <v-btn @click="updatePath" depressed color="primary"
                      :disabled="videosWithSamePath.length===0"> Update </v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-actions>
            <vuescroll>
              <v-card-text>
                <v-simple-table dense class="update-path-table">
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th class="text-left">Old path</th>
                        <th class="text-left">New path</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(video, i) in videosWithSamePath" :key="i">
                        <td class="caption" v-html="getOldPath(video.path)"></td>
                        <td class="caption" v-html="getNewPath(video.path)"></td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-card-text>
            </vuescroll>
          </v-card>
        </v-dialog>

        <v-card flat max-width="800" style="margin: auto;">
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

          <div class="subtitle mt-10 mb-2">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" left small>
                  mdi-help-circle-outline
                </v-icon>
              </template>
              <span>Will be generated automatically when the video page is opened.</span>
            </v-tooltip>
            <span>Video preview grid 3x3:</span>
          </div>
          <v-switch v-model="videoPreviewGrid" inset style="display:inline-block;">
            <template v-slot:label>
              <span v-if="videoPreviewGrid">Yes</span>
              <span v-else>No</span>
            </template>
          </v-switch>
        </v-card>
      </v-tab-item>
      <v-tab-item value="performers-settings">
        <v-card flat max-width="800" style="margin: auto;">
          <div class="headline text-h5 text-center pt-6 mb-4"> Parameters </div>
          <v-btn @click="$store.state.Settings.dialogManagePerformerParameters=true" 
            class="my-4" block color="primary">
            <v-icon left>mdi-shape</v-icon> Manage custom parameters
          </v-btn>
          <ManagePerformerParameters v-if="$store.state.Settings.dialogManagePerformerParameters"/>

          <div class="subtitle mt-8">Edit items of parameter:</div>
          <EditPerformerItemsOfParameter/>

          
          <div class="headline text-h5 text-center pt-10 mb-4"> Meter
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
        </v-card>
      </v-tab-item>
      <v-tab-item value="appearance-settings">
        <v-card flat max-width="800" style="margin: auto;" class="pb-10">
          <div class="headline text-h5 text-center pt-10">Theme</div>
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
              <v-btn @click="openDialogHeaderGradientLight" color="secondary">
                <v-icon left>mdi-palette</v-icon> Change
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" v-if="headerGradient">
              <div class="subtitle mb-2">Colors for header gradient (dark theme):</div>
              <v-btn @click="openDialogHeaderGradientDark" color="secondary">
                <v-icon left>mdi-palette</v-icon> Change
              </v-btn>
            </v-col>
          </v-row>

          <HeaderGradient :themeDark="gradientThemeDark"/>

          <ThemeColors />
          <v-divider></v-divider>

          <div class="headline text-h5 text-center mt-10">Fonts</div>
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

          <v-divider></v-divider>

          <div class="subtitle pt-8">Navigation menu position:</div>
          <v-radio-group v-model="navigationSide" mandatory row>
            <v-radio label="Side" value="1"></v-radio>
            <v-radio label="Bottom" value="2"></v-radio>
            <v-radio label="None" value="0"></v-radio>
          </v-radio-group>
          <div class="subtitle mt-8">Rating and favorite in card description:</div>
          <v-switch v-model="ratingAndFavoriteInCard" inset class="d-inline-flex">
            <template v-slot:label>
              <span v-if="ratingAndFavoriteInCard">Yes</span>
              <span v-else>No</span>
            </template>
          </v-switch>
          <div class="subtitle mb-2 mt-8">Limit of pages in pagination:</div>
          <v-btn-toggle 
            dense mandatory color="secondary"
            v-model="numberOfPagesLimit"
          >
            <v-btn outlined @click="changeNumberOfPagesLimit(5)" :value="5">5</v-btn>
            <v-btn outlined @click="changeNumberOfPagesLimit(7)" :value="7">7</v-btn>
            <v-btn outlined @click="changeNumberOfPagesLimit(9)" :value="9">9</v-btn>
            <v-btn outlined @click="changeNumberOfPagesLimit(11)" :value="11">11</v-btn>
            <v-btn outlined @click="changeNumberOfPagesLimit(13)" :value="13">13</v-btn>
            <v-btn outlined @click="changeNumberOfPagesLimit(15)" :value="15">15</v-btn>
          </v-btn-toggle>
        </v-card>
      </v-tab-item>
      <v-tab-item value="application-settings">
        <v-card flat max-width="800" style="margin: auto;">
          <div class="headline text-h5 text-center pt-6">Login</div>
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
        </v-card>
 <!-- TODO create function for backup settings. watch for changes in performer params -->
      </v-tab-item>
      <v-tab-item value="database-settings">
        <v-card flat max-width="900" style="margin: auto;" class="pb-10">
          <div class="headline text-h5 text-center py-6">Backups</div>
          <ManageBackups />

          <div class="headline text-h5 text-center red--text pt-10">Clear data</div>
          <div class="subtitle red--text">Clear data:</div>
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
          <v-btn color="red" @click="dialogResetToDefaultSettings=true">
            <v-icon left>mdi-restore</v-icon> Reset</v-btn>
            
        </v-card>
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
      </v-tab-item>
      <v-tab-item value="about-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-row>
            <v-col cols="4">
              <div>Adult Video Database 0.5.8</div>
              <p class="text--secondary">by fupdec</p>
              <v-btn color="#eee" light small @click="openGithub">
                <v-icon left>mdi-github</v-icon> Github
              </v-btn>
            </v-col>
            <v-col cols="4" class="text-center">
              <div>2021</div>
            </v-col>
            <v-col cols="4" class="text-right">
              <img src="/icons/icon.png" alt="avdb" width="82" height="82" class="mt-2">
            </v-col>
          </v-row>
        </v-card>
      </v-tab-item>
    </v-tabs-items>

    <div v-show="navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>


<script>
import HeaderGradient from '@/components/pages/settings/HeaderGradient.vue'
import ThemeColors from '@/components/pages/settings/ThemeColors.vue'
import ManageBackups from '@/components/pages/settings/ManageBackups.vue'
import ClearDatabases from '@/components/pages/settings/ClearDatabases.vue'
import ManagePerformerParameters from '@/components/pages/settings/ManagePerformerParameters.vue'
import EditPerformerItemsOfParameter from '@/components/pages/settings/EditPerformerItemsOfParameter.vue'
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
    ManagePerformerParameters,
    EditPerformerItemsOfParameter,
    vuescroll,
  },
  mounted () {
    this.$nextTick(function () {
      this.password = this.$store.state.Settings.phrase
      this.hint = this.$store.state.Settings.passwordHint
    })
  },
  data: ()=>({
    tab: 'videos',
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
    foundedPath: '',
    pathForUpdate: '',
    videosWithSamePath: [],
    dialogResetToDefaultSettings: false,
    gradientThemeDark: null,
  }),
  computed: {
    videoPreview: {
      get() {
        return this.$store.state.Settings.videoPreviewEnabled
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'videoPreviewEnabled', value})
      },
    },
    videoPreviewGrid: {
      get() {
        return this.$store.state.Settings.videoPreviewGridEnabled
      },
      set(value) {
        const values = {
          key: 'videoPreviewGridEnabled',
          value: value,
        }
        this.$store.dispatch('updateSettingsState', values)
      },
    },
    delayVideoPreview: {
      get() {
        return this.$store.state.Settings.delayVideoPreview
      },
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'delayVideoPreview', value})
        }, 1000)
      },
    },
    numberOfPagesLimit: {
      get() {
        return this.$store.state.Settings.getNumberOfPagesLimit
      },
      set(number) {
        this.$store.dispatch('updateSettingsState', {key:'numberOfPagesLimit', value:number})
      }
    },
    navigationSide: {
      get() {
        return this.$store.state.Settings.navigationSide
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'navigationSide', value})
      },
    },
    playerType: {
      get() {
        return this.$store.state.Settings.playerType
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'playerType', value})
      },
    },
    ratingAndFavoriteInCard: {
      get() {
        return this.$store.state.Settings.ratingAndFavoriteInCard
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'ratingAndFavoriteInCard', value})
      },
    },
    darkMode: {
      get() {
        return this.$store.state.Settings.darkMode
      },
      set(value) {
        this.$vuetify.theme.dark = value
        this.$store.dispatch('updateSettingsState', {key:'darkMode', value})
      },
    },
    headerGradient: {
      get() {
        return this.$store.state.Settings.headerGradient
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'headerGradient', value})
      },
    },
    textFont: {
      get() {
        return this.$store.state.Settings.textFont
      },
      set(font) {
        this.$store.dispatch('updateSettingsState', {key:'textFont', value: font})
      },
    },
    headerFont: {
      get() {
        return this.$store.state.Settings.headerFont
      },
      set(font) {
        this.$store.dispatch('updateSettingsState', {key:'headerFont', value: font})
      },
    },
    meterHeight: {
      get() {
        return this.$store.state.Settings.meterHeight
      },
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'meterHeight', value})
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
          this.$store.dispatch('updateSettingsState', {key:'meterMultiplier', value})
        }, 1000)
      },
    },
    pathToSystemPlayer: {
      get() {
        return this.$store.state.Settings.pathToSystemPlayer
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'pathToSystemPlayer', value})
      },
    },
    passwordProtection: {
      get() {
        return this.$store.state.Settings.passwordProtection
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'passwordProtection', value})
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
    changeNumberOfPagesLimit(number) {
      this.$store.dispatch('updateSettingsState', {key:'numberOfPagesLimit', value: number})
    },
    searchInVideosPath() {
      this.videosWithSamePath = _.cloneDeep( this.$store.getters.videos
        .filter(v => ( v.path.includes(this.pathForSearch) )).value() )
      if (this.videosWithSamePath) this.foundedPath = this.pathForSearch
    },
    getOldPath(videoPath) {
      let pathParts = videoPath.split(this.foundedPath)
      return pathParts.join(`<b>${this.foundedPath}</b>`)
    },
    getNewPath(videoPath) {
      let pathParts = videoPath.split(this.foundedPath)
      return pathParts.join(`<b>${this.pathForUpdate}</b>`)
    },
    updatePath() {
      this.$store.getters.videos.filter(video => (
        video.path.includes(this.foundedPath)
      )).each(video => {
        video.path = video.path.split(this.foundedPath).join(this.pathForUpdate)
      }).write()
      this.videosWithSamePath = []
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
      this.$store.dispatch('updateSettingsState', {key:'phrase', value:this.password})
    },
    saveHint() {
      this.$store.dispatch('updateSettingsState', {key:'passwordHint', value:this.hint})
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


<style lang="less">
.update-path-table {
  table {
    width:100%;
    table-layout:fixed;
    td {
      word-break: break-all;
      &:nth-child(odd) {
        b {
          color: red;
        }
      }
      &:nth-child(even) {
        b {
          color: green;
        }
      }
    }
  }
}
</style>

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