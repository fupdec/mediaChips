<template>
  <div v-if="$store.state.Videos.dialogEditVideoInfo">
    <v-bottom-sheet v-model="sheet" inset scrollable persistent content-class="video-sheet">
      <v-card>
        <v-card-actions class="pa-0">
          <v-btn @click="close" class="close-btn" fab small>
            <v-icon>mdi-close</v-icon></v-btn>
          <v-responsive :aspect-ratio="16/9">
            <div class="video-container">
              <img :src="'file://' + getImg()">
              <video ref="video" autoplay loop :poster="'file://' + getImg()" muted></video>
            </div>
            <div class="gradient" :style="gradient"></div>
            <v-card-actions class="actions">
              <v-btn @click="playVideo" small outlined fab :disabled="!videoExists" :color="darkMode?'#ccc':'#777'">
                <v-icon large>mdi-play</v-icon> </v-btn>
              <v-btn @click="toggleMuted" small outlined fab class="mr-4" :color="darkMode?'#ccc':'#777'">
                <v-icon v-if="muted">mdi-volume-off</v-icon>
                <v-icon v-else>mdi-volume-high</v-icon>
              </v-btn>
              <v-rating v-model="rating" clearable hover half-increments size="30"
                :color="darkMode?'#ccc':'#777'" :background-color="darkMode?'#ccc':'#777'" 
                empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"/>
              <v-btn @click="favorite=!favorite" class="mx-2" :color="darkMode?'#ccc':'#777'" icon large> 
                <v-icon size="25">mdi-heart{{favorite? '':'-outline'}}</v-icon>
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn @click="saveVideoInfo" large outlined rounded :color="darkMode?'#ccc':'#777'" class="pr-3">
                <v-icon left>mdi-content-save</v-icon> save </v-btn>
            </v-card-actions>
            <div class="headline video-title text--secondary text-h4">{{fileName}}</div>
            <v-btn class="file-info-icon" fab x-small>
              <v-icon>mdi-information-variant</v-icon>
            </v-btn>
            <v-card class="file-info">
              <div>
                <v-icon left size="18">mdi-monitor-screenshot</v-icon>
                Resolution: {{video.resolution}}
              </div>
              <div>
                <v-icon left size="18">mdi-file-video</v-icon>
                File extension: .{{fileExtension}}
              </div>
              <div>
                <v-icon left size="18">mdi-harddisk</v-icon>
                File size: {{calcSize(video.size)}}
              </div>
              <div>
                <v-icon left size="18">mdi-eye-outline</v-icon>
                Views: {{video.views||0}}
              </div>
              <div>
                <v-icon left size="18">mdi-calendar-plus</v-icon>
                Added: {{added}}
              </div>
              <div>
                <v-icon left size="18">mdi-calendar-edit</v-icon>
                Last edit: {{edit}}
              </div>
              <div>
                <v-icon left size="18">mdi-calendar-clock</v-icon>
                Last viewed: {{viewed}}
              </div>
            </v-card>
          </v-responsive>
        </v-card-actions>
        <vuescroll>
          <v-card-text class="pa-0">
            <v-row class="mx-2 mt-4">
              <v-col v-for="(m,i) in metaAssignedToVideos" :key="i+key" cols="12" lg="6" class="pt-0">
                <v-autocomplete v-if="m.type=='complex'" :items="getCards(m.id)" 
                  @input="setVal($event,m.id)" :value="values[m.id]"
                  multiple hide-selected :ref="m.id"
                  :label="getMeta(m.id).settings.name" item-value="id"
                  :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                  append-outer-icon="mdi-plus" append-icon="mdi-chevron-down" 
                  @click:append-outer="openDialogAddNewCard(m.id)"
                  @click:append="listViewMeta=getMeta(m.id),dialogListView=true"
                  :menu-props="{contentClass:'list-with-preview'}" class="hidden-close"
                  :filter="filterCards" :hint="getMeta(m.id).settings.hint" persistent-hint
                > <template v-slot:selection="data">
                    <v-chip v-bind="data.attrs" class="my-1 px-2" small
                      @click="data.select" :input-value="data.selected"
                      @click:close="removeItem(data.item.id,m.id)" close
                      :color="getColor(m.id,data.item.id)" 
                      :label="getMeta(m.id).settings.chipLabel"
                      :outlined="getMeta(m.id).settings.chipOutlined"
                      @mouseover.stop="showImage($event, data.item.id, 'meta', m.id)" 
                      @mouseleave.stop="$store.state.hoveredImage=false">
                      <span>{{ data.item.meta.name }}</span>
                    </v-chip>
                  </template>
                  <template v-slot:item="data">
                    <div class="list-item" 
                      @mouseover.stop="showImage($event, data.item.id, 'meta', m.id)" 
                      @mouseleave.stop="$store.state.hoveredImage=false"
                    > 
                      <span v-if="getMeta(m.id).settings.favorite">
                        <v-icon :color="data.item.meta.favorite? 'pink':''" left size="14">mdi-heart</v-icon>
                      </span>
                      <span v-if="getMeta(m.id).settings.color">
                        <v-icon :color="data.item.meta.color || ''" left small>
                          mdi-{{getMeta(m.id).settings.icon}}</v-icon>
                      </span>
                      <span>{{data.item.meta.name}}</span>
                      <span v-if="getMeta(m.id).settings.synonyms" class="aliases">
                        {{getCard(data.item.id).meta.synonyms===undefined? '' : getCard(data.item.id).meta.synonyms.join(', ').slice(0,50)}}
                      </span>
                    </div>
                  </template>
                </v-autocomplete>

                <v-text-field v-if="m.type=='simple'&&(getMeta(m.id).dataType==='string')" 
                  @input="setVal($event,m.id)" :value="values[m.id]"
                  :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                  :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                  clearable @click:clear="setVal('', m.id)"/>

                <v-text-field v-if="m.type=='simple'&&(getMeta(m.id).dataType==='number')" 
                  @input="setVal($event,m.id)" :value="values[m.id]" type="number"
                  :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                  :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>

                <v-autocomplete v-if="m.type=='simple'&&getMeta(m.id).dataType==='array'" 
                  :items="getMeta(m.id).settings.items" item-value="id" item-text="name"
                  @input="setVal($event,m.id)" :value="values[m.id]" multiple
                  :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                  :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                  append-outer-icon="mdi-plus" @click:append-outer="openDialogAddNewItem(m.id)"/>
                
                <v-switch v-if="m.type=='simple'&&getMeta(m.id).dataType==='boolean'" 
                  :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                  @change="setVal($event,m.id)" :value="values[m.id]" class="ma-0"
                  :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>
                  
                <v-text-field v-if="m.type=='simple'&&getMeta(m.id).dataType==='date'" 
                  :value="values[m.id]" @click="calendarId=m.id,calendar=true"
                  :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint"
                  clearable @click:clear="setVal('', m.id)" readonly persistent-hint
                  :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>

                <div v-if="m.type=='simple'&&getMeta(m.id).dataType==='rating'" class="d-flex flex-column">
                  <div class="text--secondary caption">{{getMeta(m.id).settings.name}}</div>
                  <div class="d-flex">
                    <v-icon v-html="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''" left/>
                    <v-rating :value="values[m.id]" @input="setVal($event,m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                      :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                      :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable 
                      :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
                  </div>
                  <div class="text--secondary caption">{{getMeta(m.id).settings.hint}}</div>
                </div>
              </v-col>
              <v-col cols="12" class="d-flex mt-4">
                <div class="overline edit-path-title">
                  <v-checkbox :value="pathEditable" @change="changePathEditable" hide-details 
                    class="mt-0 mr-2" off-icon="mdi-pencil" on-icon="mdi-pencil-off"/>
                </div>
                <v-form ref="form" v-model="valid" style="width: 100%;">
                  <v-text-field v-model="pathToFile" 
                    :rules="[value => !!value || 'Path is required']" :disabled="!pathEditable"
                    placeholder="Write file path here" label="File path" class="pt-0 mt-0" />
                </v-form>
              </v-col>
              <v-col cols="12" class="pt-0">
                <v-textarea v-model="bookmark" hide-details clearable auto-grow outlined label="Bookmark" 
                  :prepend-icon="showIcons?`mdi-bookmark`:''"/>
              </v-col>
            </v-row>
          </v-card-text>
        </vuescroll>
      </v-card>
      <div @click="close" class="left-close-panel">
        <div class="content">
          <v-icon color="red" size="15vw">mdi-close</v-icon>
          <span class="red--text">Close</span>
        </div>
      </div>
      <div @click="saveVideoInfo" class="right-close-panel">
        <div class="content">
          <v-icon color="green" size="15vw">mdi-check</v-icon>
          <span class="green--text">Save</span>
        </div>
      </div>
    </v-bottom-sheet>
    
    <v-dialog v-model="calendar" width="300px">
      <v-date-picker @change="setVal($event, calendarId), calendar=false"
        :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
        :value="values[calendarId]" no-title color="primary" full-width/>
    </v-dialog>

    <v-btn @click="close" fab class="close-btn-float">
      <v-icon large>mdi-close</v-icon>
    </v-btn>

    <v-btn @click="saveVideoInfo" fab large class="save-btn">
      <v-icon large>mdi-content-save</v-icon>
    </v-btn>
    
    <!-- TODO create components for dialogs new item and new card -->
    <v-dialog v-if="dialogAddNewCard" v-model="dialogAddNewCard" width="500">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New {{getMeta(metaIdForNewCard).settings.nameSingular.toLowerCase()}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewCard" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-form v-model="validNewCard" ref="formNewCard" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="nameForNewCard" :rules="[nameRules]" label="Name" autofocus/>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <v-dialog v-if="dialogAddNewItem" v-model="dialogAddNewItem" width="700">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New item for meta <b>{{getMeta(metaIdForNewItem).settings.name}}</b></span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewItem" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-form v-model="validNewItem" ref="formNewItem" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="nameForNewItem" :rules="[nameRules]" label="Name"/>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <DialogListView v-if="dialogListView" :meta="listViewMeta" @close="dialogListView=false" />
  </div>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shortid = require('shortid')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction.vue'
import { ipcRenderer } from 'electron'
import Functions from '@/mixins/Functions.vue'
import MetaGetters from '@/mixins/MetaGetters.vue'
import NameRules from '@/mixins/NameRules.vue'

export default {
  name: "DialogEditSingleVideoInfo",
  components: {
    vuescroll,
    DialogListView: () => import('@/components/pages/meta/DialogListView.vue'),
  },
  mixins: [ShowImageFunction, Functions, MetaGetters, NameRules],
  beforeMount() {
    this.initAll()
  },
  mounted() {
    this.$nextTick(function () {})
  },
  beforeDestroy() {
    try {this.$refs.video.src = '' } catch (error) {}
  },
  destroyed() {
    for (const timeout in this.timeouts) { clearTimeout(this.timeouts[timeout]) }
    clearInterval(this.timeouts.z)
  },
  data: () => ({
    valid: false,
    pathEditable: false,
    videoExists: true,
    // info
    rating: 0,
    favorite: false,
    pathToFile: '',
    edit: '',
    added: '',
    viewed: '',
    bookmark: '',
    // header
    timeouts: {},
    muted: true,
    sheet: false,
    // meta
    values: {},
    calendar: false,
    calendarId: null,
    key: Date.now(),
    listViewMeta: null,
    // add new items 
    dialogAddNewCard: false,
    metaIdForNewCard: null,
    nameForNewCard: '',
    validNewCard: false,
    dialogAddNewItem: false,
    metaIdForNewItem: null,
    nameForNewItem: '',
    validNewItem: false,
    dialogListView: false,
  }),
  computed: {
    video() {
      let videoId = this.$store.getters.getSelectedVideos[0]
      return this.$store.getters.videos.find({id:videoId}).value()
    },
    fileName() { return path.parse(this.video.path).name },
    darkMode() { return this.$vuetify.theme.isDark },
    gradient() { 
      let color = this.darkMode ? 'rgb(30 30 30)' : 'rgb(255 255 255)'
      return `background: linear-gradient(to top, ${color}, rgba(0,0,0,.0))`
    },
    fileExtension() { return path.parse(this.video.path).ext.replace('.', '').toLowerCase() },
    metaAssignedToVideos() { return this.$store.state.Settings.metaAssignedToVideos },
    showIcons() { return this.$store.state.Settings.showIconsOfMetaInEditingDialog },
  },
  methods: {
    initAll() {
      this.sheet = true
      let video = _.cloneDeep(this.video)
      
      // get info of video
      this.rating = video.rating || 0
      this.favorite = video.favorite || false
      this.pathToFile = video.path || ''
      this.bookmark = video.bookmark || ''

      // get date added and date of last edit text
      let dateAdded = new Date(video.date)
      this.added = dateAdded.toLocaleDateString() + ' ' + dateAdded.toLocaleTimeString()
      let dateEdit = new Date(video.edit)
      this.edit = dateEdit.toLocaleDateString() + ' ' + dateEdit.toLocaleTimeString()
      if (video.viewed) {
        let dateViewed = new Date(video.viewed)
        this.viewed = dateViewed.toLocaleDateString() + ' ' + dateViewed.toLocaleTimeString()
      } else this.viewed = 'Never'
      setTimeout(() => { this.playPreview() }, 300)

      // parse meta 
      for (let i = 0; i < this.metaAssignedToVideos.length; i++) {
        const id = this.metaAssignedToVideos[i].id
        const type = this.metaAssignedToVideos[i].type
        if (type=='complex') { this.values[id] = _.cloneDeep(this.video[id]) || []; continue }
        const simpleMetaType = this.getMeta(id).dataType
        let defaultValue = ''
        if (simpleMetaType=='array') defaultValue = []
        if (simpleMetaType=='boolean') defaultValue = false
        if (simpleMetaType=='number'||simpleMetaType=='rating') defaultValue = 0
        this.values[id] = _.cloneDeep(this.video[id]) || defaultValue
      }
    },
    playPreview() {
      if (!fs.existsSync(this.video.path)) return
      this.$refs.video.src = this.video.path
      if (this.video.duration > 65) {
        this.setVideoProgress(0.1)
        this.timeouts.a = setTimeout(this.setVideoProgress, 5000, 0.2)
        this.timeouts.b = setTimeout(this.setVideoProgress, 10000, 0.3)
        this.timeouts.c = setTimeout(this.setVideoProgress, 15000, 0.4)
        this.timeouts.d = setTimeout(this.setVideoProgress, 20000, 0.5)
        this.timeouts.e = setTimeout(this.setVideoProgress, 25000, 0.6)
        this.timeouts.f = setTimeout(this.setVideoProgress, 30000, 0.7)
        this.timeouts.g = setTimeout(this.setVideoProgress, 35000, 0.8)
        this.timeouts.h = setTimeout(this.setVideoProgress, 40000, 0.9)
        this.timeouts.i = setTimeout(this.setVideoProgress, 45000, 0.95)
        this.timeouts.z = setInterval(() => {
          for (const timeout in this.timeouts) {
            clearTimeout(this.timeouts[timeout])
          }
          this.setVideoProgress(0.1)
          this.timeouts.a = setTimeout(this.setVideoProgress, 5000, 0.2)
          this.timeouts.b = setTimeout(this.setVideoProgress, 10000, 0.3)
          this.timeouts.c = setTimeout(this.setVideoProgress, 15000, 0.4)
          this.timeouts.d = setTimeout(this.setVideoProgress, 20000, 0.5)
          this.timeouts.e = setTimeout(this.setVideoProgress, 25000, 0.6)
          this.timeouts.f = setTimeout(this.setVideoProgress, 30000, 0.7)
          this.timeouts.g = setTimeout(this.setVideoProgress, 35000, 0.8)
          this.timeouts.h = setTimeout(this.setVideoProgress, 40000, 0.9)
          this.timeouts.i = setTimeout(this.setVideoProgress, 45000, 0.95)
        }, 50000)
      }
    },
    setVideoProgress(percent) { this.$refs.video.currentTime = Math.floor(this.video.duration*percent) },
    filterCards(cardObject, queryText, itemText) {
      let card = _.cloneDeep(cardObject)
      let query = queryText.toLowerCase()

      function foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0
        let foundAllChars = false
        for (let i = 0; i < query.length; i++) {
          const char = query.charAt(i)
          const index = text.indexOf(char, foundCharIndex)
          if (index > -1) foundAllChars = true, foundCharIndex = index + 1
          else return false
        }
        return foundAllChars
      }
      
      if (this.$store.state.Settings.typingFiltersDefault) {
        let index = card.meta.name.toLowerCase().indexOf(query)
        if (index > -1) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            let indexSub = card.meta.synonyms[i].toLowerCase().indexOf(query)
            if (indexSub > -1) return true
          }
          return false
        }
      } else {
        if (foundByChars(card.meta.name, query)) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            return foundByChars(card.meta.synonyms[i], query)
          }
          return false
        }
      }
    },
    changePathEditable() {
      if (this.pathEditable) this.pathToFile = _.cloneDeep(this.video.path)
      this.pathEditable = !this.pathEditable
    },
    close() {
      this.sheet = false
      setTimeout(() => { this.$store.state.Videos.dialogEditVideoInfo = false }, 300)
    },
    saveVideoInfo() {
      this.$refs.form.validate()
      if (this.valid === false) return false

      let presetValues = { 
        rating: this.rating,
        favorite: this.favorite,
        bookmark: this.bookmark || '',
        path: this.pathToFile,
        edit: Date.now(),
      }

      let newValues = {...presetValues, ...this.values}

      this.$store.getters.videos.find({ id: this.video.id }).assign(newValues).write()

      this.$store.commit('updateVideos', [this.video.id])
      this.$store.dispatch('filterVideos', true)
      this.$store.commit('addLog', {type:'info',text:`📹 Video "${this.fileName}" has been edited ✏️`})
      this.close()

      if (this.pathEditable && this.pathToFile!==this.video.path) {
        setTimeout(() => {this.$store.state.updateFoldersData = Date.now()}, 1000)
      }
    },
    getImg() {
      let imgPath = path.join(this.$store.getters.getPathToUserData, `/media/thumbs/${this.video.id}.jpg`)
      if (fs.existsSync(imgPath)) return imgPath
      else return path.join(__static, '/img/default.jpg')
    },
    getTag(tagName) { return this.$store.getters.tags.find({name:tagName}).value() },
    playVideo() {
      const pathToVideo = this.video.path
      if (fs.existsSync(pathToVideo)) {
        this.videoExists = false
        if (this.$store.state.Settings.isPlayVideoInSystemPlayer) shell.openPath(pathToVideo)
        else {
          let data = { videos: [this.video], id: this.video.id, }
          ipcRenderer.send('openPlayer', data)
        }
        setTimeout(() => { this.videoExists = true }, 1500)
      } else this.videoExists = false
    },
    toggleMuted() {
      this.muted = !this.muted
      this.$refs.video.muted = this.muted
    },
    setVal(value, metaId) { 
      let meta = this.getMeta(metaId)
      if (meta && meta.type === 'complex') {
        value.sort((a,b)=>{
          a = this.getCard(a).meta.name
          b = this.getCard(b).meta.name
          return a.localeCompare(b)
        })
        this.$refs[metaId][0].lazySearch = null
      }
      this.values[metaId] = value 
    },
    removeItem(item, id) { 
      const index = this.values[id].indexOf(item)
      if (index > -1) this.values[id].splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    openDialogAddNewCard(metaId) {
      this.dialogAddNewCard = true
      this.metaIdForNewCard = metaId
    },
    addNewCard() {
      this.$refs.formNewCard.validate()
      if (!this.validNewCard) return
      this.$store.dispatch('addMetaCard', { 
        id: shortid.generate(),
        metaId: this.metaIdForNewCard,
        meta: { name: this.nameForNewCard },
      })
      this.dialogAddNewCard = false
      this.nameForNewCard = ''
    },
    openDialogAddNewItem(metaId) {
      this.dialogAddNewItem = true
      this.metaIdForNewItem = metaId
    },
    addNewItem() {
      this.$refs.formNewItem.validate()
      if (!this.validNewItem) return
      this.$store.getters.meta.find({id:this.metaIdForNewItem}).get('settings.items')
        .push({ id:shortid.generate(), name: this.nameForNewItem }).write()
      this.key = Date.now()
      this.dialogAddNewItem = false
      this.nameForNewItem = ''
    },
  },
  watch: {},
}
</script>


<style lang="less">
.video-sheet {
  padding-bottom: 20px;
  &>.v-sheet.v-card {
    border-radius: 10px 10px 0 0;
    overflow: hidden;
  }
  .close-btn {
    top: 10px;
    right: 10px;
    position: absolute;
    z-index: 3;
  }
  .video-container {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    position: absolute;
    img {
      width: 100%;
      position: absolute;
      z-index: 0;
      opacity: 1;
      filter: blur(10px);
    }
    video {
      min-width: 100%;
      min-height: 100%;
      object-fit: contain;
      z-index: 1;
    }
  }
  .video-title {
    word-break: break-word;
    position: absolute;
    bottom: 80px;
    z-index: 3;
    margin: 0 20px;
  }
  .gradient {
    position: absolute;
    height: 100%;
    width: 100%;
    bottom: 0;
    z-index: 1;
  }
  .actions {
    position: absolute;
    width: 100%;
    bottom: 0;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    z-index: 1;
    .v-rating {
      display: inline-flex;
      .v-icon {
        padding: 0;
      }
    }
  }
  .file-info-icon {
    position: absolute;
    left: 10px;
    top: 10px;
    z-index: 3;
    &:hover + .file-info {
      opacity: 1;
    }
  }
  .file-info {
    opacity: 0;
    transition: .3s all;
    position: absolute;
    left: 50px;
    top: 10px;
    padding: 10px;
    z-index: 2;
  }
  &.v-bottom-sheet.v-dialog.v-bottom-sheet--inset {
    max-width: 55% !important;
    min-width: 600px;
  }
  &.v-dialog:not(.v-dialog--fullscreen) {
    max-height: calc(100% - 60px) !important;
  }
}
.rating-favorite {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.edit-path-title {
  display: flex;
  justify-content: center;
}
</style> 