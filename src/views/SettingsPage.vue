<template>
  <vuescroll>
    <div class="headline text-h3 d-flex align-center justify-center py-6">
      <v-icon x-large left>mdi-cog-outline</v-icon> Settings
    </div>

    <v-tabs v-model="tab" centered icons-and-text class="settings-tabs">
      <v-tab href="#app-settings" draggable="false">App<v-icon>mdi-application</v-icon></v-tab>
      <v-tab href="#appearance-settings" draggable="false">Appearance<v-icon>mdi-palette</v-icon></v-tab>
      <v-tab href="#meta-settings" draggable="false">Meta<v-icon>mdi-shape</v-icon></v-tab>
      <v-tab href="#videos-settings" draggable="false">Videos<v-icon>mdi-video</v-icon></v-tab>
      <v-tab href="#privacy-settings" draggable="false">Privacy<v-icon>mdi-key</v-icon></v-tab>
      <v-tab href="#database-settings" draggable="false">Database<v-icon>mdi-database</v-icon></v-tab>
      <v-tab href="#about-settings" draggable="false">About<v-icon>mdi-information-variant</v-icon></v-tab>
    </v-tabs>
    <v-divider></v-divider>
    <v-tabs-items v-model="tab" class="settings-tabs">
      <v-tab-item value="app-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-btn @click="$store.state.Settings.dialogScanVideos=true" class="mb-10" block color="primary" x-large rounded>
            <v-icon large class="mr-4">mdi-video-plus</v-icon> Add new videos </v-btn>

          <WatchedFolders/>
          
          <v-card outlined class="mt-10 pb-4 px-4">
            <div class="headline text-center my-4"> Updating data from videos
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" right>mdi-help-circle-outline</v-icon>
                </template>
                <span>Will be updated number of videos for meta cards</span>
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
              <v-col cols="12" class="text-center">
                <div class="d-flex">
                  <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                    </template>
                    <span>Disable this option if stuttering occurs at the end of the process of adding new videos</span>
                  </v-tooltip>
                  <span class="mr-6">Update data after adding new videos:</span>
                  <v-switch v-model="updateDataAfterAddingNewVideos" :label="updateDataAfterAddingNewVideos?'Yes':'No'" inset class="d-inline mt-0 pt-0" hide-details/>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <v-card outlined class="mt-10 pa-4">
            <div class="headline text-center"> Serving video files and database </div>
            <v-btn @click="dialogUpdatePath=true" block rounded color="secondary" class="mt-4">
              <v-icon left>mdi-pencil</v-icon> Update path manually in multiple videos </v-btn>
            <v-btn @click="findVideoDuplicates" block rounded color="secondary" class="mt-4">
              <v-icon left>mdi-content-copy</v-icon> Open duplicate videos in a new tab </v-btn>
            <v-btn @click="openUserFolder" block rounded color="secondary" class="mt-4">
              <v-icon left>mdi-folder-account</v-icon> Open folder with user files in explorer </v-btn>
          </v-card>

          <v-card outlined class="mt-10 pa-4">
            <div class="d-flex align-center">
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
            <div class="d-flex mt-6">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                </template>
                <div>Features that do not work or are in the early stages of development. <br> For example: video folder tree, nested meta cards.</div>
              </v-tooltip>
              <span class="mr-6">Show experimental features:</span>
              <v-switch v-model="showExperimentalFeatures" :label="showExperimentalFeatures?'Yes':'No'" inset class="d-inline mt-0 pt-0" hide-details/>
            </div>
            <div class="d-flex mt-6">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                </template>
                <div>Data scrapers for performers, specific meta</div>
              </v-tooltip>
              <span class="mr-6">Show adult content:</span>
              <v-switch v-model="showAdultContent" :label="showAdultContent?'Yes':'No'" inset class="d-inline mt-0 pt-0" hide-details/>
            </div>
            <div v-if="showAdultContent" class="d-flex align-center mt-6">
              <v-btn @click="dialogAddMetaCardsTemplate=true" block rounded color="secondary">
                <v-icon left>mdi-plus</v-icon> Add most popular tags, performers, websites </v-btn>
            </div>
          </v-card>
        </v-card>
        <DialogAddMetaCardsTemplate v-if="dialogAddMetaCardsTemplate" :dialog="dialogAddMetaCardsTemplate" @finish="dialogAddMetaCardsTemplate=false"/>

        <v-dialog v-model="dialogUpdateNumberOfVideos" width="600" scrollable persistent>
          <v-card>
            <v-toolbar color="primary">
              <div class="headline"> Updating data from video </div>
              <v-spacer></v-spacer>
              <v-btn @click="dialogUpdateNumberOfVideos=false" :disabled="updatingNumberOfVideos" outlined> <v-icon left>mdi-close</v-icon> Close </v-btn>
            </v-toolbar>
            <v-card-text class="pt-10">
              <div v-if="updatingNumberOfVideos" class="text-center">
                <h3 class="mb-2">Update in progress...</h3>
                <v-icon x-large class="loading-animation">mdi-loading</v-icon>
              </div>
              <div v-else class="text-center">
                <h3 class="mb-2">Data updated!</h3>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-dialog v-model="dialogUpdatePath" scrollable persistent>
          <v-card>
            <v-toolbar color="primary">
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" left>mdi-help-circle-outline</v-icon>
                </template>
                <span>If you have moved the video, you can change the path manually</span>
              </v-tooltip>
              <div class="headline"> Update path in videos </div>
              <v-spacer></v-spacer>
              <v-btn @click="dialogUpdatePath=false" outlined> <v-icon left>mdi-close</v-icon> close </v-btn>
            </v-toolbar>
            <v-card-actions class="text-center pb-2">
              <v-container>
                <v-row>
                  <v-col cols="6">
                    <v-text-field 
                      v-model="pathForSearch" dense outlined clearable hide-details
                      placeholder="Write file path here" label="Search videos with path"
                      append-outer-icon="mdi-clipboard-arrow-right-outline" 
                      @click:append-outer="copyPathToUpload" />
                    <v-btn @click="searchInVideosPath" :disabled="pathForSearch==''" rounded class="mt-2" 
                      color="primary">Search</v-btn>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="pathForUpdate" dense outlined clearable hide-details
                      placeholder="Write file path here" label="Update videos with path"/>
                    <v-btn @click="updatePath" color="primary" rounded class="mt-2" 
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
      <v-tab-item value="appearance-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-btn @click="darkMode=!darkMode" color="primary" class="mb-10" block x-large rounded>
            <v-icon large class="mr-4">mdi-theme-light-dark</v-icon> Toggle Dark Mode </v-btn>

          <v-card outlined class="px-4">
            <div class="headline text-center py-4">Theme</div>
            <ThemeColors />
          </v-card>

          <v-card outlined class="mt-10 px-4">
            <div class="headline text-center py-4">Fonts</div>
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
              <span class="mr-6">Navigation bar:</span>
              <v-radio-group v-model="navigationSide" mandatory row hide-details class="mt-0 pt-0">
                <v-radio label="Side" value="1"></v-radio>
                <v-radio label="Bottom" value="2"></v-radio>
                <v-radio label="Hidden" value="0"></v-radio>
              </v-radio-group>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Position of icons <v-icon color="yellow darken-2">mdi-star</v-icon> 
                rating and <v-icon color="pink">mdi-heart</v-icon> favorite:</span>
              <v-switch v-model="ratingAndFavoriteInCard" inset hide-details class="mt-0 pt-0 d-inline-flex"
                :label="ratingAndFavoriteInCard?'Card description':'Card image'"/>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Show icons of meta in editing dialog:</span>
              <v-switch v-model="showIconsOfMetaInEditingDialog" inset hide-details 
                class="mt-0 pt-0 d-inline-flex" :label="showIconsOfMetaInEditingDialog?'Yes':'No'"/>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Show icons instead of text on filter chips:</span>
              <v-switch v-model="showIconsInsteadTextOnFiltersChips" :label="showIconsInsteadTextOnFiltersChips?'Yes':'No'" inset class="d-inline mt-0 pt-0" hide-details/>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Show empty meta value in card:</span>
              <v-switch v-model="showEmptyMetaValueInCard" :label="showEmptyMetaValueInCard?'Yes':'No'" inset class="d-inline mt-0 pt-0" hide-details/>
            </div>
            <div class="pt-7 d-flex">
              <span class="mr-6">Show borders on tab:</span>
              <v-switch v-model="tabBorders" inset hide-details 
                class="mt-0 pt-0 d-inline-flex" :label="tabBorders?'Yes':'No'"/>
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
              <v-slider v-model="zoom" min="0.5" step="0.01" max="2" hide-details 
                prepend-icon="mdi-magnify-minus-outline" append-icon="mdi-magnify-plus-outline"
                @click:prepend="zoomOut" @click:append="zoomIn"/>
              <v-btn @click="zoom=1" color="secondary" rounded class="ml-10">
                <v-icon left size="18">mdi-restore</v-icon> Reset to Default Zoom </v-btn>
            </div>
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="meta-settings">
        <MetaList/>
      </v-tab-item>
      <v-tab-item value="videos-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <MetaAssignedToVideos/>
          
          <v-card outlined class="pb-4 px-4">
            <div class="headline text-center py-4"> Video preview</div>
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
                    <v-radio v-bind="attrs" v-on="on" value="grid">
                      <template v-slot:label>
                        <v-icon color="warning" small left>mdi-alert</v-icon>
                        <div>Grid 3x3</div>
                      </template>
                    </v-radio>
                  </template>
                  <div class="d-flex flex-column align-center">
                    <v-alert type="warning" text outlined dense class="caption mt-2">
                      <span> This feature uses your CPU 100% during image generation. 
                      <br> Slow operation of the entire system is possible. Use on powerful processors.</span>
                    </v-alert>
                    <span>Will be generated automatically when the video page is opened.</span>
                    <span>The spinner in the status bar is displayed while the generation process is in progress.</span>
                    <span>When all the grids are ready, the cards will update automatically.</span>
                  </div>
                </v-tooltip>
              </v-radio-group>
            </div>
            <v-divider class="my-4"/>
            <v-row>
              <v-col cols="12">
                <div class="d-flex align-center">
                  <span class="mr-6">On hover:</span>
                  <v-radio-group v-model="videoPreviewHover" mandatory hide-details row class="mt-0 pt-0">
                    <v-radio label="None" value="none"></v-radio>
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <v-radio v-bind="attrs" v-on="on" value="timeline">
                          <template v-slot:label>
                            <v-icon color="warning" small left>mdi-alert</v-icon>
                            <div>Timeline</div>
                          </template>
                        </v-radio>
                      </template>
                      <div class="d-flex flex-column align-center">
                        <v-alert type="warning" text outlined dense class="caption mt-2">
                          <span> This feature uses your CPU 100% during image generation. 
                          <br> Slow operation of the entire system is possible. Use on powerful processors.</span>
                        </v-alert>
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
                        <span>Sections from the video are played. <br> Not all video formats are supported</span>
                      </div>
                    </v-tooltip>
                  </v-radio-group>
                </div>
              </v-col>
              <v-col v-if="videoPreviewHover=='video'" cols="12">
                <v-slider v-model="delayVideoPreview" :min="0" :max="5"
                  hide-details :thumb-size="24" thumb-label />
                <div class="caption text-center">Delay before starting playback (in seconds): {{delayVideoPreview}}</div>
              </v-col>
            </v-row>
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="privacy-settings">
        <v-card flat max-width="800" class="py-10" style="margin: auto;">
          <v-card outlined class="pb-4 px-4">
            <div class="headline text-center pt-4">Login</div>
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
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <ManageBackups />
          
          <v-card outlined class="mt-10 pb-4 px-4">
            <div class="headline text-center py-4">Clear generated images</div>
            <v-alert type="info" class="caption" dense text outlined>
              You can delete generated images to save disk space. They will be automatically recreated when needed.
            </v-alert>
            <ClearData dataName="timelines" dataType="images" btnText='timelines'/>
            <ClearData dataName="grids" dataType="images" btnText='grids'/>
            <ClearData dataName="markers" dataType="images" btnText='markers'/>
          </v-card>
          
          <v-card outlined class="mt-10 pb-4 px-4">
            <div class="headline text-center red--text py-4">Clear data</div>
            <v-alert type="error" class="caption" dense text outlined>
              This will completely delete all data. Data recovery is possible only from a backup.
              Make sure you create a backup before clearing.
            </v-alert>
            <ClearData dataName="videos" dataType="data" btnText='Videos'/>
            <ClearData dataName="meta" dataType="data" btnText='meta'/>
            <ClearData dataName="saved filters" dataType="data" btnText='saved filters' />
            <ClearData dataName="markers" dataType="data" btnText='markers' />
          </v-card>
        </v-card>
      </v-tab-item>
      <v-tab-item value="about-settings">
        <v-card flat max-width="800" style="margin: auto;" class="py-10">
          <v-card outlined class="pa-4 mb-10">
            <Registration />
          </v-card>
          <v-card outlined class="pa-4 mb-10">
            <div class="headline text-center pb-4">Updates</div>
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
                <v-btn @click="openLink('https://mediaChips.app/downloads/')" color="primary" rounded>
                  <v-icon left>mdi-download</v-icon> Download from official website </v-btn>
              </v-col>
            </v-row>
          </v-card>
          <About/>
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
const {app} = require('electron').remote
const axios = require("axios")
const cheerio = require("cheerio")
const { webFrame } = require('electron')

import MetaList from '@/components/pages/meta/MetaList.vue'
import MetaAssignedToVideos from '@/components/pages/meta/MetaAssignedToVideos.vue'
import ThemeColors from '@/components/pages/settings/ThemeColors.vue'
import ClearData from '@/components/pages/settings/ClearData.vue'
import Registration from '@/components/pages/settings/Registration.vue'
import vuescroll from 'vuescroll'

// TODO separate each tab to components

export default {
  name: 'SettingsPage',
  components: {
    MetaList,
    MetaAssignedToVideos,
    ThemeColors,
    WatchedFolders: () => import('@/components/pages/settings/WatchedFolders.vue'),
    ManageBackups: () => import('@/components/pages/settings/ManageBackups.vue'),
    ClearData,
    vuescroll,
    Registration,
    About: () => import('@/components/app/About.vue'),
    DialogAddMetaCardsTemplate: () => import("@/components/pages/meta/DialogAddMetaCardsTemplate.vue"),
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
    dialogAddMetaCardsTemplate: false,
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
    autoUpdateDataFromVideos: {
      get() {return this.$store.state.Settings.autoUpdateDataFromVideos},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'autoUpdateDataFromVideos', value})},
    },
    updateDataAfterAddingNewVideos: {
      get() {return this.$store.state.Settings.updateDataAfterAddingNewVideos},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'updateDataAfterAddingNewVideos', value})},
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
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'isPlayVideoInSystemPlayer', value})
        ipcRenderer.send('changeMenuItem', 'systemPlayer', value )
      },
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
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'passwordProtection', value})
        ipcRenderer.send('changeMenuItem', 'lock', value )
      },
    },
    getMeterImg() {return path.join(this.$store.getters.getPathToUserData, `/img/templates/meter.png`)},
    typingFiltersDefault: {
      get() {return this.$store.state.Settings.typingFiltersDefault},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'typingFiltersDefault', value})},
    },
    showEmptyMetaValueInCard: {
      get() {return this.$store.state.Settings.showEmptyMetaValueInCard},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'showEmptyMetaValueInCard', value})},
    },
    showIconsInsteadTextOnFiltersChips: {
      get() {return this.$store.state.Settings.showIconsInsteadTextOnFiltersChips},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'showIconsInsteadTextOnFiltersChips', value})},
    },
    showExperimentalFeatures: {
      get() {return this.$store.state.Settings.showExperimentalFeatures},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'showExperimentalFeatures', value})},
    },
    showAdultContent: {
      get() {return this.$store.state.Settings.showAdultContent},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'showAdultContent', value})},
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
    openLink(link) { shell.openExternal(link) },
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
    openUserFolder () { shell.openExternal(this.$store.getters.getPathToUserData) },
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
    checkForUpdates() {
      this.isCheckingUpdate = true
      axios.get(`https://github.com/fupdec/mediaChips/releases`).then((response) => {
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
    zoomOut() { this.zoom = (this.zoom - 0.01) || 0.5 },
    zoomIn() { this.zoom = (this.zoom + 0.01) || 2 },
    findVideoDuplicates() { 
      let videos = this.$store.getters.videos.value()
      const result = _.flow([
        arr => _.groupBy(arr, 'size'), // group elements by id
        g => _.filter(g, o => o.length > 1), // remove groups that have less than two members
        _.flatten // flatten the results to a single array
      ])(videos)
      
      let tabId = Date.now()
      let tab = { 
        name: 'Duplicate videos', 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: [{
          by: 'path',
          cond: 'one of',
          val: result.map(i=>i.path),
          type: 'boolean',
          flag: 'duplicateVideos',
          lock: true,
        }],
        sortBy: 'size',
        sortDirection: 'asc',
        page: 1,
        icon: 'content-copy'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
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