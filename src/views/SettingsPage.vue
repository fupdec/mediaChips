<template>
  <vuescroll>
    <div class="headline text-h3 d-flex align-center justify-center my-6">
      <v-icon x-large left>mdi-cog-outline</v-icon> Settings
    </div>

    <v-tabs v-model="tab" centered icons-and-text class="settings-tabs">
      <v-tab href="#meta-settings" draggable="false">Meta<v-icon>mdi-shape</v-icon></v-tab>
      <v-tab href="#app-settings" draggable="false">App<v-icon>mdi-application</v-icon></v-tab>
      <v-tab href="#appearance-settings" draggable="false">Appearance<v-icon>mdi-palette</v-icon></v-tab>
      <v-tab href="#videos-settings" draggable="false">Videos<v-icon>mdi-video</v-icon></v-tab>
      <v-tab href="#performers-settings" draggable="false">Performers<v-icon>mdi-account</v-icon></v-tab>
      <v-tab href="#tags-settings" draggable="false">Tags<v-icon>mdi-tag</v-icon></v-tab>
      <v-tab href="#privacy-settings" draggable="false">Privacy<v-icon>mdi-key</v-icon></v-tab>
      <v-tab href="#database-settings" draggable="false">Database<v-icon>mdi-database</v-icon></v-tab>
      <v-tab href="#about-settings" draggable="false">About<v-icon>mdi-information-variant</v-icon></v-tab>
    </v-tabs>
    <v-divider></v-divider>
    <v-tabs-items v-model="tab" class="settings-tabs">
      <v-tab-item value="app-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-btn @click="$store.state.Settings.dialogScanVideos=true" class="mb-10" block color="primary" x-large rounded>
            <v-icon size="26" left>mdi-plus</v-icon> Add new videos
          </v-btn>

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
          </v-card>

          <v-card outlined class="mt-10 pa-4">
            <div class="d-flex align-center">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                </template>
                <span>If you have moved the video, you can change the path manually</span>
              </v-tooltip>
              <span class="mr-6">Update path manually in multiple videos:</span>
              <v-btn @click="dialogUpdatePath=true" class="px-5" rounded color="secondary">
                <v-icon left>mdi-form-textbox</v-icon> Update path in videos </v-btn>
            </div>
            <div class="d-flex align-center mt-6">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                </template>
                <span>The built-in player does not support all videos, <br>
                  BUT it has additional features: markers, playlists and etc. 
                  <br> The list of features will be expanded in new releases!</span>
              </v-tooltip>
              <span class="mr-6">Play video in:</span>
              <v-switch v-model="isPlayVideoInSystemPlayer" inset class="d-inline mt-0 pt-0" hide-details
                :label="isPlayVideoInSystemPlayer? 'System player':'App`s player'"/>
            </div>
            <div class="d-flex mt-6">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                </template>
                <div class="d-flex flex-column type-hint">
                  <span>Item filters when typing. Useful when you have a lot of items.</span>
                  <span>How it works (the letters you type and the result): </span>
                  <span>Exact: <b>favo</b> -> my <b>favo</b>rite video</span>
                  <span>Inaccurate: <b>yrid</b> -> m<b>y</b> favo<b>ri</b>te vi<b>d</b>eo</span>
                </div>
              </v-tooltip>
              <span class="mr-6">Item filters:</span>
              <v-switch v-model="typingFiltersDefault" inset class="d-inline mt-0 pt-0" hide-details>
                <template v-slot:label>
                  <span v-if="typingFiltersDefault">Exact</span>
                  <span v-else>Inaccurate</span>
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
      <v-tab-item value="meta-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <MetaInVideoCard/>
          <ComplexMetaList/>
          <SimpleMetaList/>
        </v-card>
      </v-tab-item>
      <v-tab-item value="appearance-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-card outlined class="px-4">
            <div class="headline text-h5 text-center py-4">Theme</div>
            <div class="d-flex">
              <span class="mr-6">Dark mode:</span>
              <v-switch v-model="darkMode" :label="darkMode?'Enabled':'Disabled'" inset hide-details class="d-inline-flex mt-0 pt-0"/>
            </div>
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

          <v-card outlined class="mt-10 pa-4">
            <div class="d-flex">
              <span class="mr-6">Navigation menu position:</span>
              <v-radio-group v-model="navigationSide" mandatory row hide-details class="mt-0 pt-0">
                <v-radio label="Side" value="1"></v-radio>
                <v-radio label="Bottom" value="2"></v-radio>
                <v-radio label="None" value="0"></v-radio>
              </v-radio-group>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Position of icons <v-icon color="yellow darken-2">mdi-star</v-icon> 
                rating and <v-icon color="pink">mdi-heart</v-icon> favorite:</span>
              <v-switch v-model="ratingAndFavoriteInCard" inset hide-details class="mt-0 pt-0 d-inline-flex"
                :label="ratingAndFavoriteInCard?'Card description':'Card image'"/>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Icons of meta in editing dialog:</span>
              <v-switch v-model="showIconsOfMetaInEditingDialog" inset hide-details 
                class="mt-0 pt-0 d-inline-flex" :label="showIconsOfMetaInEditingDialog?'Show':'Hide'"/>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Tab borders:</span>
              <v-switch v-model="tabBorders" inset hide-details 
                class="mt-0 pt-0 d-inline-flex" :label="tabBorders?'Show':'Hide'"/>
            </div>
            <div class="pt-6">
              <span class="mr-6">Limit of pages in pagination:</span>
              <v-btn-toggle v-model="numberOfPagesLimit" dense mandatory color="secondary">
                <v-btn outlined :value="5">5</v-btn>
                <v-btn outlined :value="7">7</v-btn>
                <v-btn outlined :value="9">9</v-btn>
                <v-btn outlined :value="11">11</v-btn>
                <v-btn outlined :value="13">13</v-btn>
                <v-btn outlined :value="15">15</v-btn>
              </v-btn-toggle>
            </div>
            <div class="pt-6">
              <span class="mr-6">Gap in Card Grid:</span>
              <v-btn-toggle v-model="gapSize" dense mandatory color="secondary">
                <v-btn outlined value="xs">xs</v-btn>
                <v-btn outlined value="s">s</v-btn>
                <v-btn outlined value="m">m</v-btn>
                <v-btn outlined value="l">l</v-btn>
                <v-btn outlined value="xl">xl</v-btn>
              </v-btn-toggle>
            </div>
            <div class="mt-5 d-flex align-center">
              <span class="mr-6">Zoom: {{Math.floor(zoom*100)}}%</span>
              <v-slider v-model="zoom" min="0.5" step="0.1" max="2" hide-details/>
              <v-btn @click="zoom=1" color="secondary" rounded class="ml-10">
                <v-icon left size="18">mdi-restore</v-icon> Reset to Default Zoom </v-btn>
            </div>
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="videos-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
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
          
          <v-card outlined class="pb-4 px-4">
            <div class="headline text-h5 text-center py-4"> Video preview</div>
            <div class="d-flex align-center">
              <span class="mr-6">Static:</span>
              <v-radio-group v-model="videoPreviewStatic" mandatory hide-details row class="mt-0 pt-0">
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <v-radio v-bind="attrs" v-on="on" label="Thumb" value="thumb"/>
                  </template>
                  <div class="d-flex flex-column align-center">
                    <v-icon dark>mdi-image</v-icon>
                    <span>Default thumb</span>
                  </div>
                </v-tooltip>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <v-radio v-bind="attrs" v-on="on" label="Grid 3x3" value="grid"/>
                  </template>
                  <div class="d-flex flex-column align-center">
                    <v-icon dark large class="mb-2">mdi-apps</v-icon>
                    <span>Will be generated automatically when the video page is opened.</span>
                    <span>The spinner in the status bar is displayed while the generation process is in progress.</span>
                    <span>When all the grids are ready, the cards will update automatically.</span>
                  </div>
                </v-tooltip>
              </v-radio-group>
            </div>
            <v-divider class="my-4"/>
            <v-row>
              <v-col cols="12" sm="7">
                <div class="d-flex align-center">
                  <span class="mr-6">On hover:</span>
                  <v-radio-group v-model="videoPreviewHover" mandatory hide-details row class="mt-0 pt-0">
                    <v-radio label="None" value="none"></v-radio>
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <v-radio v-bind="attrs" v-on="on" label="Timeline" value="timeline"/>
                      </template>
                      <div class="d-flex flex-column align-center">
                        <v-icon dark>mdi-view-carousel</v-icon>
                        <span>A frame from the video appears.</span>
                        <span>The frame depends on the position of the cursor.</span>
                        <span>Frames will be generated automatically when the video page is opened.</span>
                        <span>The spinner in the status bar is displayed while the generation process is in progress.</span>
                      </div>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <v-radio v-bind="attrs" v-on="on" label="Video" value="video"/>
                      </template>
                      <div class="d-flex flex-column align-center">
                        <v-icon dark>mdi-video</v-icon>
                        <span>Sections from the video are played</span>
                      </div>
                    </v-tooltip>
                  </v-radio-group>
                </div>
              </v-col>
              <v-col v-if="videoPreviewHover=='video'" cols="12" sm="5" class="py-0">
                <v-slider v-model="delayVideoPreview" :min="0" :max="5"
                  hide-details :thumb-size="24" thumb-label />
                <div class="caption text-center">Delay before starting playback (in seconds): {{delayVideoPreview}}</div>
              </v-col>
            </v-row>
          </v-card>
        </v-card>
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
        <!-- TODO create migration database to new version of app. backups with old version don't work with new -->
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
            <ClearDatabases typeOfDB="saved filters" />
            <ClearDatabases typeOfDB="markers" />
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="about-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-card outlined class="pa-4 mb-10">
            <Registration />
          </v-card>
          <v-card outlined class="pa-4 mb-10">
            <div class="headline text-h5 text-center pb-4">Updates</div>
            <v-row>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center justify-center mt-2">
                  <div class="mr-6">Check for updates at startup:</div>
                  <v-switch v-model="checkForUpdatesAtStartup" class="mt-0 pt-0 d-inline-flex"  
                    :label="checkForUpdatesAtStartup?'Yes':'No'" inset hide-details/>
                </div>
              </v-col>
              <v-col cols="12" sm="6" align="center">
                <v-btn v-if="!updateApp" @click="checkForUpdates" :loading="isCheckingUpdate" color="primary" rounded>
                  <v-icon left>mdi-update</v-icon> Check for updates manually</v-btn>
              </v-col>
              <v-col cols="12" v-if="updateApp" class="text-center">
                <span class="pt-4 pr-4">New version available!</span>
                <v-btn @click="openLink('https://avdb.app/downloads/')" color="primary" rounded>
                  <v-icon left>mdi-download</v-icon> Download from official website </v-btn>
              </v-col>
            </v-row>
          </v-card>
          <v-card outlined class="pa-4">
            <div class="d-flex">
              <div>
                <div>Adult Video Database 0.8.2 (Carter)</div>
                <div class="text--secondary">by fupdec</div>
              </div>
              <v-spacer></v-spacer>
              <div class="text-center d-flex flex-column">
                <img :src="logoPath" alt="avdb" width="82" height="82">
                <span>2021</span>
              </div>
            </div>
            <div>Links</div>
            <div class="d-flex flex-wrap mt-2">
              <v-btn @click="openLink('https://avdb.app/')" color="#1da6ff" rounded class="px-5 mb-2 mr-2">
                <v-icon left>mdi-web</v-icon> website </v-btn>
              <v-btn @click="openLink('https://github.com/fupdec/Adult-Video-Database')" color="#eee" light rounded class="px-5 mb-2 mr-2">
                <v-icon left>mdi-github</v-icon> Github </v-btn>
              <v-btn @click="openLink('https://reddit.com/r/avdb/')" color="#ff4500" rounded class="px-5 mb-2 mr-2">
                <v-icon left>mdi-reddit</v-icon> Reddit </v-btn>
              <v-btn @click="openLink('https://discord.gg/QSnXFvXZVh')" color="#7289DA" rounded class="px-5 mb-2 mr-2">
                <v-icon left>mdi-discord</v-icon> Discord </v-btn>
              <v-btn @click="openLink('https://patreon.com/avdb')" color="#ff424d" rounded class="px-5 mb-2 mr-2">
                <v-icon left>mdi-patreon</v-icon> patreon </v-btn>
            </div>
            <v-divider class="my-4"></v-divider>
            <div class="d-flex flex-column">
              <div>Thanks to the people who worked on these wonderful libraries:</div>
              <div class="d-flex flex-wrap">
                <span @click="openLink('https://github.com/electron')" class="link">Electron</span>
                <span @click="openLink('https://github.com/vuejs/vue')" class="link">vue</span>
                <span @click="openLink('https://github.com/vuetifyjs/vuetify')" class="link">vuetify</span>
                <span @click="openLink('https://github.com/vuejs/vuex')" class="link">vuex</span>
                <span @click="openLink('https://www.ffmpeg.org/')" class="link">FFmpeg</span>
                <span @click="openLink('https://github.com/whyboris/Video-Hub-App')" class="link">Video Hub App</span>
                <span @click="openLink('https://github.com/apexcharts')" class="link">apexcharts</span>
                <span @click="openLink('https://github.com/archiverjs/node-archiver')" class="link">archiver</span>
                <span @click="openLink('https://github.com/axios/axios')" class="link">axios</span>
                <span @click="openLink('https://github.com/cheeriojs/cheerio')" class="link">cheerio</span>
                <span @click="openLink('https://github.com/zloirock/core-js')" class="link">core-js</span>
                <span @click="openLink('https://github.com/eugeneware/ffmpeg-static')" class="link">ffmpeg-static</span>
                <span @click="openLink('https://github.com/joshwnj/ffprobe-static')" class="link">ffprobe-static</span>
                <span @click="openLink('https://github.com/pqina/filepond')" class="link">filepond</span>
                <span @click="openLink('https://github.com/fluent-ffmpeg/node-fluent-ffmpeg')" class="link">fluent-ffmpeg</span>
                <span @click="openLink('https://github.com/jprichardson/node-fs-extra')" class="link">fs-extra</span>
                <span @click="openLink('https://github.com/oliver-moran/jimp')" class="link">jimp</span>
                <span @click="openLink('https://github.com/typicode/lowdb')" class="link">lowdb</span>
                <span @click="openLink('https://github.com/cristiammercado/node-disk-info')" class="link">node-disk-info</span>
                <span @click="openLink('https://github.com/antelle/node-stream-zip')" class="link">node-stream-zip</span>
                <span @click="openLink('https://github.com/dylang/shortid')" class="link">shortid</span>
                <span @click="openLink('https://github.com/Norserium/vue-advanced-cropper')" class="link">vue-advanced-cropper</span>
                <span @click="openLink('https://github.com/P3trur0/vue-country-flag')" class="link">vue-country-flag</span>
                <span @click="openLink('https://github.com/vuejs/vue-router')" class="link">vue-router</span>
                <span @click="openLink('https://www.npmjs.com/package/vue-the-mask')" class="link">vue-the-mask</span>
                <span @click="openLink('https://github.com/SortableJS/Vue.Draggable')" class="link">vuedraggable</span>
                <span @click="openLink('https://github.com/YvesCoding/vuescroll')" class="link">vuescroll</span>
                <span @click="openLink('https://github.com/Simonwep/selection')" class="link">selection</span>
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
const {app} = require('electron').remote
const axios = require("axios")
const cheerio = require("cheerio")
const { webFrame } = require('electron')

import MetaInVideoCard from '@/components/pages/meta/MetaInVideoCard.vue'
import ComplexMetaList from '@/components/pages/meta/ComplexMetaList.vue'
import SimpleMetaList from '@/components/pages/meta/SimpleMetaList.vue'
import ThemeColors from '@/components/pages/settings/ThemeColors.vue'
import ManageBackups from '@/components/pages/settings/ManageBackups.vue'
import ClearDatabases from '@/components/pages/settings/ClearDatabases.vue'
import ManagePerformerParameters from '@/components/pages/settings/ManagePerformerParameters.vue'
import EditPerformerItemsOfParameter from '@/components/pages/settings/EditPerformerItemsOfParameter.vue'
import EditTagItemsOfParameter from '@/components/pages/settings/EditTagItemsOfParameter.vue'
import Registration from '@/components/pages/settings/Registration.vue'
import vuescroll from 'vuescroll'

// TODO separate each tab to components

export default {
  name: 'SettingsPage',
  components: {
    MetaInVideoCard,
    ComplexMetaList,
    SimpleMetaList,
    ThemeColors,
    ManageBackups,
    ClearDatabases,
    ManagePerformerParameters,
    EditPerformerItemsOfParameter,
    EditTagItemsOfParameter,
    vuescroll,
    Registration,
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
    isCheckingUpdate: false,
    updateApp: false,
  }),
  computed: {
    updateIntervalDataFromVideos: {
      get() {return this.$store.state.Settings.updateIntervalDataFromVideos},
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'updateIntervalDataFromVideos', value})
        }, 1000)
      },
    },
    watchFolders: {
      get() { return this.$store.state.Settings.watchFolders},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'watchFolders', value})},
    },
    autoUpdateDataFromVideos: {
      get() {return this.$store.state.Settings.autoUpdateDataFromVideos},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'autoUpdateDataFromVideos', value})},
    },
    updateDataFromVideosOnStart: {
      get() {return this.$store.state.Settings.updateDataFromVideosOnStart},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'updateDataFromVideosOnStart', value})},
    },
    delayVideoPreview: {
      get() {return this.$store.state.Settings.delayVideoPreview},
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'delayVideoPreview', value})
        }, 1000)
      },
    },
    numberOfPagesLimit: {
      get() {return this.$store.state.Settings.numberOfPagesLimit},
      set(number) {this.$store.dispatch('updateSettingsState', {key:'numberOfPagesLimit', value:number})}
    },
    navigationSide: {
      get() {return this.$store.state.Settings.navigationSide},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'navigationSide', value})},
    },
    gapSize: {
      get() {return this.$store.state.Settings.gapSize},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'gapSize', value})},
    },
    isPlayVideoInSystemPlayer: {
      get() {return this.$store.state.Settings.isPlayVideoInSystemPlayer},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'isPlayVideoInSystemPlayer', value})},
    },
    ratingAndFavoriteInCard: {
      get() {return this.$store.state.Settings.ratingAndFavoriteInCard},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'ratingAndFavoriteInCard', value})},
    },
    tabBorders: {
      get() {return this.$store.state.Settings.tabBorders},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'tabBorders', value})},
    },
    showIconsOfMetaInEditingDialog: {
      get() {return this.$store.state.Settings.showIconsOfMetaInEditingDialog},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'showIconsOfMetaInEditingDialog', value})},
    },
    darkMode: {
      get() {return this.$store.state.Settings.darkMode},
      set(value) {
        this.$vuetify.theme.dark = value
        this.$store.dispatch('updateSettingsState', {key:'darkMode', value})
        ipcRenderer.send('toggleDarkMode', value)
      },
    },
    textFont: {
      get() {return this.$store.state.Settings.textFont},
      set(font) {this.$store.dispatch('updateSettingsState', {key:'textFont', value: font})},
    },
    headerFont: {
      get() {return this.$store.state.Settings.headerFont},
      set(font) {this.$store.dispatch('updateSettingsState', {key:'headerFont', value: font})},
    },
    meterHeight: {
      get() {return this.$store.state.Settings.meterHeight},
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'meterHeight', value})
        }, 1000)
      },
    },
    meterMultiplier: {
      get() {return this.$store.state.Settings.meterMultiplier},
      set(value) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'meterMultiplier', value})
        }, 1000)
      },
    },
    pathToSystemPlayer: {
      get() {return this.$store.state.Settings.pathToSystemPlayer},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'pathToSystemPlayer', value})},
    },
    passwordProtection: {
      get() {return this.$store.state.Settings.passwordProtection},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'passwordProtection', value})},
    },
    getMeterImg() {return path.join(this.$store.getters.getPathToUserData, `/img/templates/meter.png`)},
    folders: {
      get() {return this.$store.state.Settings.folders},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'folders', value})},
    },
    logoPath() {return path.join('file://', __static, '/icons/icon.png')},
    typingFiltersDefault: {
      get() {return this.$store.state.Settings.typingFiltersDefault},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'typingFiltersDefault', value})},
    },
    checkForUpdatesAtStartup: {
      get() {return this.$store.state.Settings.checkForUpdatesAtStartup},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'checkForUpdatesAtStartup', value})},
    },
    videoPreviewStatic: {
      get() {return this.$store.state.Settings.videoPreviewStatic},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'videoPreviewStatic', value})},
    },
    videoPreviewHover: {
      get() {return this.$store.state.Settings.videoPreviewHover},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'videoPreviewHover', value})},
    },
    zoom: {
      get() {
        let val = this.$store.state.Settings.zoom
        webFrame.setZoomFactor(val)
        return val
      },
      set(value) {this.$store.dispatch('updateSettingsState', {key:'zoom', value})},
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
    openLink(link) {
      shell.openExternal(link)
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
    checkForUpdates() {
      this.isCheckingUpdate = true
      axios.get(`https://github.com/fupdec/Adult-Video-Database/releases`).then((response) => {
        if(response.status === 200) {
          this.isCheckingUpdate = false
          const html = response.data;
          const $ = cheerio.load(html)
          let lastVersion = $('.release-header .f1 a').eq(0).text().trim()
          lastVersion = lastVersion.match(/\d{1,2}.\d{1,2}.\d{1,2}/)[0]
          let currentVersion = app.getVersion()
          if (this.compareVersion(currentVersion, lastVersion)) {
            this.updateApp = true
            this.$store.dispatch('setNotification', {
              type: 'info',
              text: `New version ${lastVersion} available!`
            })
          } else {
            this.$store.dispatch('setNotification', {
              type: 'info',
              text: `You are using the latest version of the application`
            })
          }
        } else {
          this.isCheckingUpdate = false
          this.$store.dispatch('setNotification', {
            type: 'error',
            text: `An internet connection error occurred while checking for updates`
          })
        }
      })
    },
    compareVersion(currentVersion, lastVersion) {
      lastVersion = lastVersion.split('.').map( s => s.padStart(10) ).join('.')
      currentVersion = currentVersion.split('.').map( s => s.padStart(10) ).join('.')
      return lastVersion > currentVersion
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
.link {
  margin-right: 15px;
  cursor: pointer;
}
.type-hint {
  b {
    text-decoration: underline;
  }
}
</style>