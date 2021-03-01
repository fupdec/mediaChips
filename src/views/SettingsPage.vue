<template>
  <vuescroll ref="mainContainer">

    <v-tabs v-model="tab" centered icons-and-text>
      <v-tab href="#videos-settings" draggable="false">Videos<v-icon>mdi-video</v-icon></v-tab>
      <v-tab href="#performers-settings" draggable="false">Performers<v-icon>mdi-account</v-icon></v-tab>
      <v-tab href="#tags-settings" draggable="false">Tags<v-icon>mdi-tag</v-icon></v-tab>
      <v-tab href="#appearance-settings" draggable="false">Appearance<v-icon>mdi-palette</v-icon></v-tab>
      <v-tab href="#privacy-settings" draggable="false">Privacy<v-icon>mdi-key</v-icon></v-tab>
      <v-tab href="#database-settings" draggable="false">Database<v-icon>mdi-database</v-icon></v-tab>
      <v-tab href="#about-settings" draggable="false">About<v-icon>mdi-information-variant</v-icon></v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item value="videos-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <div class="pb-10">
            <v-btn @click="$store.state.Settings.dialogScanVideos=true" block color="primary" x-large rounded>
              <v-icon size="26" left>mdi-plus</v-icon> Add new videos
            </v-btn>
          </div>
          <div class="d-flex justify-center">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
              </template>
              <span>The built-in player does not support all videos, <br>
                BUT it has additional features: markers, playlists, information editing. 
                <br> The list of features will be expanded in new releases!</span>
            </v-tooltip>
            <span class="mr-10">Play video in:</span>
            <!-- TODO add checkbox instead radio buttons -->
            <v-radio-group v-model="playerType" mandatory hide-details row class="mt-0 pt-0">
              <v-radio label="Built-in player" value="0"></v-radio>
              <v-radio label="System player" value="1"></v-radio>
            </v-radio-group>
          </div>

          <v-card outlined class="mt-10 px-4">
            <div class="headline text-h5 text-center my-4"> Folders
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" right>mdi-help-circle-outline</v-icon>
                </template>
                <span>Add folders with your videos so that app can watch
                  <br> new videos and check deleted ones</span>
              </v-tooltip>
            </div>
            <v-list dense v-if="folders.length" shaped class="pb-0 pl-2">
              <v-list-item v-for="(folder, i) in folders" :key="i" class="folder-list-item">
                <div class="folder-name">
                  <div v-if="folderNameEdit==i">
                    <v-btn @click="folderNameEdit=-1" class="mr-2" color="red" icon fab x-small title="Cancel">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-text-field v-model="folderName" class="d-inline-flex" hide-details outlined dense />
                    <v-btn @click="saveFolderName(i)" :disabled="folderName==''" class="ml-2" color="green" icon fab x-small title="Save folder name">
                      <v-icon>mdi-check</v-icon>
                    </v-btn>
                  </div>
                  <div v-else>
                    <v-btn @click="folderNameEdit=i, folderName=folder.name" class="mr-2" icon fab x-small title="Edit folder name">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-chip label outlined>
                      <span>{{folder.name}}</span>
                    </v-chip>
                  </div>
                  <v-chip label outlined>
                    <v-icon left>mdi-folder</v-icon>
                    <span>{{folder.path}}</span>
                  </v-chip>
                </div>
                <v-btn @click="removeFolder(i)" class="ml-2" color="red" icon fab x-small title="Remove folder">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-list-item>
            </v-list>
            <div v-else class="text-center overline pt-2">
              <v-icon size="40">mdi-folder-outline</v-icon>
              <div>There are no watched folders yet</div>
            </div>
            <v-card-actions>
              <v-btn @click="addFolder" rounded dark color="green" class="pr-4">
                <v-icon left>mdi-plus</v-icon> Add watched folder
              </v-btn>
              <v-spacer></v-spacer>
              <div class="d-flex align-center">
                <div class="mr-6">
                  Watch folders:
                </div>
                <v-switch v-model="watchFolders" inset class="d-inline" :disabled="folders.length==0">
                  <template v-slot:label>
                    <span v-if="watchFolders">Yes</span>
                    <span v-else>No</span>
                  </template>
                </v-switch>
              </div>
            </v-card-actions>
          </v-card>
          
          <v-card outlined class="mt-10 pb-4 px-4">
            <div class="headline text-h5 text-center my-4"> Updating data from videos
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" right>mdi-help-circle-outline</v-icon>
                </template>
                <span>The following data from the videos will be updated: <br>
                  - number of videos for performers, tags and websites <br>
                  - tags for performers and websites <br>
                  - performers for tags and websites <br>
                  - websites for performers</span>
              </v-tooltip>
            </div>

            <v-row>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center justify-center">
                  <div class="mr-6">Start update automatically:</div>
                  <v-switch v-model="autoUpdateDataFromVideos" inset hide-details class="mt-0 pt-0 d-inline-flex">
                    <template v-slot:label>
                      <span v-if="autoUpdateDataFromVideos">Yes</span>
                      <span v-else>No</span>
                    </template>
                  </v-switch>
                </div>
                <v-slider v-model="updateIntervalDataFromVideos" :min="5" :max="60" step="5"
                  :disabled="!autoUpdateDataFromVideos" hide-details thumb-label />
                <div class="caption text-center">Update interval (in minutes): {{updateIntervalDataFromVideos}}</div>
              </v-col>
              <v-col cols="12" sm="6" class="text-center">
                <v-btn @click="updateDataFromVideos" color="secondary" rounded class="mb-4"> 
                  <v-icon left>mdi-update</v-icon> Start update manually </v-btn>
                <div class="d-flex align-center justify-center">
                  <div class="mr-6">Run update at app start:</div>
                  <v-switch v-model="updateDataFromVideosOnStart" inset dense hide-details class="mt-0 pt-0 d-inline-flex">
                    <template v-slot:label>
                      <span v-if="updateDataFromVideosOnStart">Yes</span>
                      <span v-else>No</span>
                    </template>
                  </v-switch>
                </div>
              </v-col>
            </v-row>
            <v-divider class="my-4"/>
            <v-row>
              <v-col cols="12">
                <div class="d-flex align-center">
                  <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                    </template>
                    <span>If you have moved the video, you can change the path manually</span>
                  </v-tooltip>
                  <span class="mr-10">Manually update the video path:</span>
                  <v-btn color="secondary" @click="dialogUpdatePath=true" rounded>
                    <v-icon left>mdi-form-textbox</v-icon> Update path
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card>
          
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
          
          <v-card outlined class="mt-10 pb-4 px-4">
            <div class="headline text-h5 text-center py-4"> Video preview</div>

            <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="d-flex align-center">
                  <div class="mr-6">
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                      </template>
                      <span>Plays on hover</span>
                    </v-tooltip>
                    Video preview enabled:
                  </div>
                  <v-switch v-model="videoPreview" inset class="d-inline">
                    <template v-slot:label>
                      <span v-if="videoPreview">Yes</span>
                      <span v-else>No</span>
                    </template>
                  </v-switch>
                </div>
              </v-col>
              <v-col cols="12" sm="6" class="py-0">
                <v-slider v-model="delayVideoPreview" :min="0" :max="5" :disabled="!videoPreview"
                  hide-details :thumb-size="24" thumb-label />
                <div class="caption text-center">Delay before starting playback (in seconds): {{delayVideoPreview}}</div>
              </v-col>
            </v-row>

            <v-divider class="my-4"/>

            <div class="d-flex align-center">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                </template>
                <span>Will be generated automatically when the video page is opened.</span>
              </v-tooltip>
              <span class="mr-6">Video preview grid 3x3:</span>
              <v-switch v-model="videoPreviewGrid" inset class="d-inline">
                <template v-slot:label>
                  <span v-if="videoPreviewGrid">Yes</span>
                  <span v-else>No</span>
                </template>
              </v-switch>
            </div>
          </v-card>
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
      </v-tab-item>
      <v-tab-item value="performers-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-card outlined class="pb-4 px-4">
            <div class="headline text-h5 text-center py-4"> Parameters </div>
            <v-btn @click="$store.state.Settings.dialogManagePerformerParameters=true" 
              class="my-4" block color="primary">
              <v-icon left>mdi-shape</v-icon> Manage custom parameters
            </v-btn>
            <ManagePerformerParameters v-if="$store.state.Settings.dialogManagePerformerParameters"/>

            <div class="mt-8">Edit items of parameter:</div>
            <EditPerformerItemsOfParameter/>
          </v-card>
          
          <v-card outlined class="mt-10 px-4">
            <div class="headline text-h5 text-center py-4"> Meter
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" right>mdi-help-circle-outline</v-icon>
                </template>
                <v-card class="my-2">
                  <v-card-actions>
                    <div class="text-center mx-4">
                      You can use a meter to <br>see how hot the performer is. <br>
                      The larger the tag value, <br>the more the meter will fill. <br><br>
                      Tags from the video are used <br> in which the performer is involved. <br><br>
                      Most likely none of your performers <br> will have a fully filled scale. <br>
                      To increase the scale, <br>you can use a multiplier<br> in the settings -> performer.
                    </div>
                    <v-img :src="getMeterImg" width="165"/><br>
                  </v-card-actions>
                </v-card>
              </v-tooltip>
            </div>
            <v-row>
              <v-col cols="12" sm="6">
                <div class="text-center">Height</div>
                <v-slider v-model="meterHeight" :min="1" :max="20"
                  hide-details :thumb-size="32" thumb-label />
                <div class="caption text-center">{{meterHeight}} pixels</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-center">
                  <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                    </template>
                    <span>Change if the meter of tags shows an incorrect value</span>
                  </v-tooltip>
                  Multiplier
                </div>
                <v-slider v-model="meterMultiplier" :min="1" :max="100"
                  hide-details :thumb-size="32" thumb-label />
                <div class="caption text-center">Value: {{meterMultiplier}} %</div>
              </v-col>
            </v-row>
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="tags-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-card outlined class="pb-4 px-4">
            <div class="headline text-h5 text-center py-4"> Parameters </div>
            <div>Edit items of parameter:</div>
            <EditTagItemsOfParameter/>
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="appearance-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-card outlined class="px-4">
            <div class="headline text-h5 text-center py-4">Theme</div>
            <v-row>
              <v-col cols="12">
                <div class="d-flex">
                  <span class="mr-6">Dark mode:</span>
                  <v-switch v-model="darkMode" inset hide-details class="d-inline-flex mt-0 pt-0">
                    <template v-slot:label>
                      <span v-if="darkMode">Yes</span>
                      <span v-else>No</span>
                    </template>
                  </v-switch>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="d-flex">
                  <span class="mr-6">Use header gradient:</span>
                  <v-switch v-model="headerGradient" inset hide-details class="d-inline-flex mt-0 pt-0">
                    <template v-slot:label>
                      <span v-if="headerGradient">Yes</span>
                      <span v-else>No</span>
                    </template>
                  </v-switch>
                </div>
              </v-col>
              <v-col cols="12" sm="6" v-if="headerGradient">
                <div class="mb-2">Colors for header gradient (light theme):</div>
                <v-btn @click="openDialogHeaderGradientLight" color="secondary">
                  <v-icon left>mdi-palette</v-icon> Change
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" v-if="headerGradient">
                <div class="mb-2">Colors for header gradient (dark theme):</div>
                <v-btn @click="openDialogHeaderGradientDark" color="secondary">
                  <v-icon left>mdi-palette</v-icon> Change
                </v-btn>
              </v-col>
            </v-row>

            <HeaderGradient :themeDark="gradientThemeDark"/>

            <ThemeColors />
          </v-card>

          <v-card outlined class="mt-10 px-4">
            <div class="headline text-h5 text-center py-4">Fonts</div>
            <v-row>
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="textFont" :items="fonts" label="Text font"
                  :style="`font-family:'${textFont}',sans-serif !important;`"
                  outlined dense placeholder="Main content font" class="overline"
                >
                  <template v-slot:item="data">
                    <div :style="`font-family:'${data.item}',sans-serif !important;`">
                      {{data.item}}
                    </div>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="headerFont" :items="fonts" label="Header font"
                  :style="`font-family:'${headerFont}',sans-serif !important;`"
                  outlined dense placeholder="Main content font" class="overline"
                >
                  <template v-slot:item="data">
                    <span :style="`font-family:'${data.item}',sans-serif !important;`">
                      {{data.item}}
                    </span>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
          </v-card>

          <v-card outlined class="mt-10 pb-4 px-4">
            <div class="headline text-h5 text-center py-4">Application</div>

            <div class="d-flex">
              <span class="mr-6">Navigation menu position:</span>
              <v-radio-group v-model="navigationSide" mandatory row hide-details class="mt-0 pt-0">
                <v-radio label="Side" value="1"></v-radio>
                <v-radio label="Bottom" value="2"></v-radio>
                <v-radio label="None" value="0"></v-radio>
              </v-radio-group>
            </div>
            <div class="mt-8 d-flex">
              <span class="mr-6">Rating and Favorite in Card Description:</span>
              <v-switch v-model="ratingAndFavoriteInCard" inset hide-details class="mt-0 pt-0 d-inline-flex">
                <template v-slot:label>
                  <span v-if="ratingAndFavoriteInCard">Yes</span>
                  <span v-else>No</span>
                </template>
              </v-switch>
            </div>
            <div class="py-8">
              <span class="mr-6">Limit of pages in pagination:</span>
              <v-btn-toggle v-model="numberOfPagesLimit" dense mandatory color="secondary">
                <v-btn outlined @click="changeNumberOfPagesLimit(5)" :value="5">5</v-btn>
                <v-btn outlined @click="changeNumberOfPagesLimit(7)" :value="7">7</v-btn>
                <v-btn outlined @click="changeNumberOfPagesLimit(9)" :value="9">9</v-btn>
                <v-btn outlined @click="changeNumberOfPagesLimit(11)" :value="11">11</v-btn>
                <v-btn outlined @click="changeNumberOfPagesLimit(13)" :value="13">13</v-btn>
                <v-btn outlined @click="changeNumberOfPagesLimit(15)" :value="15">15</v-btn>
              </v-btn-toggle>
            </div>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="dialogResetToDefaultSettings=true" rounded dark color="red" large class="pr-3">
                <v-icon left>mdi-restore</v-icon> Reset to default</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-card>
        <v-dialog v-model="dialogResetToDefaultSettings" width="600">
          <v-card>
            <v-card-title class="headline">
              Reset to default settings
              <v-spacer></v-spacer>
              <v-icon color="red">mdi-alert</v-icon>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pt-6 text-center">
              This will reset all visuals: colors, fonts, card styles and etc. <br>
              <b>Are you sure?</b>
            </v-card-text>
            <v-card-actions>
              <v-btn @click="dialogResetToDefaultSettings=false" class="ma-4">No</v-btn>
              <v-spacer></v-spacer>
              <v-btn @click="resetToDefaultSettings" class="ma-4" color="red" dark>
                <v-icon left>mdi-restore</v-icon> Yes
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-tab-item>
      <v-tab-item value="privacy-settings">
        <v-card flat max-width="800" class="py-10" style="margin: auto;">
          <v-card outlined class="pb-4 px-4">
            <div class="headline text-h5 text-center pt-4">Login</div>
            <v-row>
              <v-col cols="12">
                <div class="mt-8 d-flex">
                  <span class="mr-6">Password protect entry:</span>
                  <v-switch v-model="passwordProtection" inset hide-details class="mt-0 pt-0 d-inline-flex">
                    <template v-slot:label>
                      <span v-if="passwordProtection">Yes</span>
                      <span v-else>No</span>
                    </template>
                  </v-switch>
                </div>
              </v-col>
              <v-col v-if="passwordProtection" cols="12" sm="6">
                <div class="mt-8 mb-2 text-center">Password</div>
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
              <v-col v-if="passwordProtection" cols="12" sm="6">
                <div class="mt-8 mb-2 text-center">Hint for password</div>
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
        </v-card>
      </v-tab-item>
      <v-tab-item value="database-settings">
        <v-card flat max-width="1000" style="margin: auto;" class="py-10">
          <v-card outlined class="pb-4 px-4">
            <div class="headline text-h5 text-center py-4">Backups</div>
            <ManageBackups />
          </v-card>
          
          <v-card outlined class="mt-10 pb-4 px-4">
            <div class="headline text-h5 text-center red--text py-4">Clear data</div>
            <div class="red--text">Clear data:</div>
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
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="about-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-card outlined class="pa-4">
            <div class="d-flex">
              <div>
                <div>Adult Video Database 0.6.6</div>
                <p class="text--secondary">by fupdec</p>
                <v-btn @click="openGithub" color="#eee" light rounded class="px-5">
                  <v-icon left>mdi-github</v-icon> Github
                </v-btn>
              </div>
              <v-spacer></v-spacer>
                <v-btn @click="openPatreon" color="#ff424d" class="pa-5">
                  <v-icon left>mdi-patreon</v-icon> Support development on Patreon
                </v-btn>
              <v-spacer></v-spacer>
              <div class="text-center d-flex flex-column">
                <img src="/icons/icon.png" alt="avdb" width="82" height="82">
                <span>2021</span>
              </div>
            </div>
          </v-card>
        </v-card>
      </v-tab-item>
    </v-tabs-items>

    <div v-show="navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>


<script>
const path = require("path")
const { spawn } = require( 'child_process' )
const shell = require('electron').shell
const { ipcRenderer } = require('electron')
const { dialog } = require('electron').remote

import HeaderGradient from '@/components/pages/settings/HeaderGradient.vue'
import ThemeColors from '@/components/pages/settings/ThemeColors.vue'
import ManageBackups from '@/components/pages/settings/ManageBackups.vue'
import ClearDatabases from '@/components/pages/settings/ClearDatabases.vue'
import ManagePerformerParameters from '@/components/pages/settings/ManagePerformerParameters.vue'
import EditPerformerItemsOfParameter from '@/components/pages/settings/EditPerformerItemsOfParameter.vue'
import EditTagItemsOfParameter from '@/components/pages/settings/EditTagItemsOfParameter.vue'
import vuescroll from 'vuescroll'

export default {
  name: 'SettingsPage',
  components: {
    HeaderGradient,
    ThemeColors,
    ManageBackups,
    ClearDatabases,
    ManagePerformerParameters,
    EditPerformerItemsOfParameter,
    EditTagItemsOfParameter,
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
    folderName: '',
    folderNameEdit: -1,
    password: '',
    showPassword: false,
    validPass: false,
    hint: '',
    validHint: false,
    dialogUpdateNumberOfVideos: false,
    updatingNumberOfVideos: false,
    fonts: [
      'Arimo',
      'Lato',
      'Lobster',
      'Merriweather',
      'Montserrat',
      'Nunito',
      'OpenSans',
      'OpenSansCondensed',
      'Oswald',
      'PTSans',
      'Quicksand',
      'Raleway',
      'Roboto',
      'RobotoCondensed',
      'Ubuntu'
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
    updateIntervalDataFromVideos: {
      get() {
        return this.$store.state.Settings.updateIntervalDataFromVideos
      },
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'updateIntervalDataFromVideos', value})
        }, 1000)
      },
    },
    watchFolders: {
      get() {
        return this.$store.state.Settings.watchFolders
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'watchFolders', value})
      },
    },
    autoUpdateDataFromVideos: {
      get() {
        return this.$store.state.Settings.autoUpdateDataFromVideos
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'autoUpdateDataFromVideos', value})
      },
    },
    updateDataFromVideosOnStart: {
      get() {
        return this.$store.state.Settings.updateDataFromVideosOnStart
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'updateDataFromVideosOnStart', value})
      },
    },
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
        ipcRenderer.send('toggleDarkMode', value)
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
    getMeterImg() {
      return path.join(this.$store.getters.getPathToUserData, `/img/templates/meter.png`)
    },
    folders: {
      get() {
        return this.$store.state.Settings.folders
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'folders', value})
      },
    },
  },
  methods: {
    updateDataFromVideos() {
      this.dialogUpdateNumberOfVideos = true
      this.updatingNumberOfVideos = true
      setTimeout(()=>{
        // update performer data
        this.$store.dispatch('updateDataFromVideos')
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
    openPatreon() {
      shell.openExternal('https://www.patreon.com/avdb')
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
    async updatePath() {
      await this.$store.getters.videos.filter(video => (
        video.path.includes(this.foundedPath)
      )).each(video => {
        video.path = video.path.split(this.foundedPath).join(this.pathForUpdate)
      }).write()
      this.videosWithSamePath = []
      setTimeout(() => {this.$store.state.updateFoldersData = Date.now()}, 1000)
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
    addFolder() {
      dialog.showOpenDialog(null, {
        properties: ['openDirectory','multiSelections']
      }).then(result => {
        if (result.filePaths.length !== 0) {
          for (let i=0; i<result.filePaths.length; i++) {
            let folderPath = result.filePaths[i]
            let folder = {
              name: folderPath,
              path: folderPath,
            }
            if (_.filter(this.folders, {name: folderPath}).length) {
              this.$store.dispatch('setNotification', {
                type: 'error',
                text: `Folder with path "${folderPath}" already added.`
              })
            } else {
              this.folders.push(folder)
              this.folders = this.folders
            }
          }
        }
      }).catch(err => {
        console.log(err)
      })
    },
    saveFolderName(i) {
      this.folders[i].name = this.folderName
      this.folders = this.folders
      this.folderNameEdit = -1
    },
    removeFolder(i) {
      this.folders.splice(i, 1)
      if (this.folders.length==0) this.watchFolders = false
      this.folders = this.folders
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
.folder-list-item {
  display: flex;
  justify-content: space-between;
  width: 100%;
  background-color: rgba(150, 150, 150, 0.1);
  padding-left: 5px;
  padding-right: 3px;
  margin-bottom: 3px;
  .folder-name {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    .v-input__slot {
      min-height: 32px !important;
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