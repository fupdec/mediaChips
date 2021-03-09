<template>
	<div>
    <v-dialog v-model="$store.state.Performers.dialogDeletePerformer" persistent scrollable max-width="600">
      <v-card>
        <v-card-title class="headline red--text">
          Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>
              You want to delete performer<span v-if="selectedPerformersLength>1">s
              ({{selectedPerformersLength}}) </span>
            </div>
            {{selectedPerformers(true)}}
          </v-card-text>
        </vuescroll>
        <v-card-actions class="mx-4">
          <v-checkbox v-model="deleteVideos" color="red" hide-details class="mr-6"> 
            <template v-slot:label>
              <span class="red--text">Delete videos with this performer from database</span>
            </template>
          </v-checkbox>
          <v-spacer></v-spacer>
          <v-checkbox v-model="$store.state.Videos.deleteFile" color="red" hide-details 
            :disabled="!deleteVideos"> 
            <template v-slot:label>
              <span class="red--text">Also delete files</span>
            </template>
          </v-checkbox>
        </v-card-actions>
        <v-card-actions>
          <v-btn class="ma-4" 
            @click="$store.state.Performers.dialogDeletePerformer = false">No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" dark class="ma-4" @click="deletePerformers">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <DialogEditPerformerInfo v-if="$store.state.Performers.dialogEditPerformerInfo"/>
    <DialogEditPerformerImages v-if="$store.state.Performers.dialogEditPerformerImages"/>
    
    <v-menu v-model="$store.state.Performers.menuCard" :position-x="$store.state.x" 
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item class="pr-1" link :disabled="!isSelectedSinglePerformer" @mouseup="addNewTabPerformer(selectedPerformers())">
          <v-list-item-title>
            <v-icon left size="18">mdi-tab-plus</v-icon> Open in a New Tab
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="filterVideosByPerformers">
          <v-list-item-title>
            <v-icon left size="18">mdi-video</v-icon> Filter Videos by Performers 
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>

        <v-divider class="ma-1"></v-divider>

        <v-menu open-on-hover offset-x nudge-top="3" min-width="150" >
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on" :disabled="!isSelectedSinglePerformer">
              <v-list-item-title> 
                <v-icon left size="18">mdi-filter</v-icon> Filter Performers by Tag 
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item v-if="performerTags.length===0" class="pr-1" link>
              <v-list-item-title>
                <v-icon left size="18">mdi-cancel</v-icon> No tags
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-for="tag in performerTags" :key="tag" @mouseup="filterByTag(tag)" class="pr-1" link>
              <v-list-item-title>
                <v-icon left size="18" :color="getTagColor(tag)">mdi-tag</v-icon> {{tag}}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="ma-1"></v-divider>

        <v-list-item class="pr-1" link :disabled="!isSelectedSinglePerformer"
          @mouseup="$store.state.Performers.dialogEditPerformerInfo = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-pencil</v-icon> Edit Profile
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link :disabled="!isSelectedSinglePerformer"
          @mouseup="$store.state.Performers.dialogEditPerformerImages = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-image-edit</v-icon> Edit Images
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-star</v-icon> Rating 
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link>
              <v-rating
                v-model="$store.state.Performers.rating"
                color="yellow darken-3"
                background-color="grey darken-1"
                empty-icon="$ratingFull"
                half-icon="mdi-star-half-full"
                dense half-increments hover size="18"
                @input="changeRating($event)"
              ></v-rating>
            </v-list-item>
            <v-list-item link @mouseup="clearRating">
              <v-list-item-title> 
                <v-icon left size="18">mdi-star-off</v-icon> Clear Rating 
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu open-on-hover offset-x nudge-top="3" min-width="50">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart</v-icon> Favorite
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <v-list-item link @mouseup="addToFavorite">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart-plus</v-icon> Add to Favorite 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeFromFavorite">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart-remove</v-icon> Remove from Favorite 
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="ma-1"></v-divider>

        <v-list-item class="pr-1" link @mouseup="copyPerformerNameToClipboard">
          <v-list-item-title>
            <v-icon left size="18">mdi-clipboard-text</v-icon> Copy Performer Name
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>

        <v-divider class="ma-1"></v-divider>
        
        <v-list-item class="pr-1" link @mouseup="$store.state.Performers.dialogDeletePerformer = true">
          <v-list-item-title>
            <v-icon left size="18" color="red">mdi-delete</v-icon> Delete Performer
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
	</div>
</template>


<script>
import Selection from "@simonwep/selection-js"
import vuescroll from 'vuescroll'
import LabelFunctions from '@/mixins/LabelFunctions'

export default {
  name: 'PerformersGridElements',
  components: {
    vuescroll,
    DialogEditPerformerInfo: () => import('@/components/pages/performers/DialogEditPerformerInfo.vue'),
    DialogEditPerformerImages: () => import('@/components/pages/performers/DialogEditPerformerImages.vue'),
  },
  mixins: [LabelFunctions],
  mounted () {
    this.$nextTick(function () {
      this.$store.state.Performers.selection = new Selection({
        boundaries: ['.performers-grid'],
        selectables: ['.performer-card'],
      }).on('beforestart', ({store, event}) => {
        const targetEl = event.target.closest('.performer-card')
        if (event.button == 2 && store.selected.includes(targetEl)) {
          return false
        }
        return (event.button !== 1)
      }).on('start', ({store, event}) => {
        const targetEl = event.target.closest('.performer-card')
        if (event.button == 2 && store.selected.includes(targetEl)) {
          return false
        }
        if (!event.ctrlKey && !event.metaKey) {
          for (const el of store.stored) {
              el.classList.remove('selected')
          }
          this.$store.state.Performers.selection.clearSelection()
        }
      }).on('move', ({store: {changed: {added, removed}}}) => {
        for (const el of added) {
          el.classList.add('selected')
        }
        for (const el of removed) {
          el.classList.remove('selected')
        }
      }).on('stop', ({store, event}) => {
        const targetEl = event.target.closest('.performer-card')
        if (event.button==0 && targetEl) {
          this.$store.state.Performers.selection.select(targetEl)
        }
        this.$store.state.Performers.selection.keepSelection()
        this.getSelectedPerformers(store.stored)
      })
    })
  },
  destroyed() {
    this.$store.state.Performers.selection.destroy()
  },
  data: () => ({
    deleteVideos: false,
  }),
  computed: {
    selectedPerformersLength() {
      return this.$store.getters.getSelectedPerformers.length
    },
    isSelectedSinglePerformer() {
      return this.$store.getters.getSelectedPerformers.length == 1
    },
    performerTags() {
      if (this.$store.getters.getSelectedPerformers.length>0) {
        let id = this.$store.getters.getSelectedPerformers[0]
        let ps = this.$store.getters.performers
        return ps.find({id}).value().tags
      } else return []
    },
  },
  methods: {
    filterVideosByPerformers() {
      let filters = [{
        param: 'performers',
        cond: 'one of',
        val: this.selectedPerformers().split(', '),
        type: 'array',
        flag: null,
        lock: false,
      }]
      this.$store.state.Settings.videoFilters = _.cloneDeep(filters)
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.videoFiltersForTabName,
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.videoFilters),
        sortBy: 'name',
        sortDirection: 'asc',
        page: 1,
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    selectedPerformers(list) {
      let ids = this.$store.getters.getSelectedPerformers
      let ps = this.$store.getters.performers
      if (ids.length!==0) {
        // console.log('it shoudnt work')
        let names = ids.map(i=>(ps.find({id:i}).value().name))
        if (list) {
          return names.map((n,i) => (`${i+1}) ${n}`)).join('\r\n')
        } else {
          return names.join(', ')
        }
      }
    },
    getSelectedPerformers(selectedPerformers){
      let ids = selectedPerformers.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPerformers', ids)
    },
    changeRating(stars) {
      console.log('rating changed: ' +stars)
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers.find({ id: performerId }).assign({ 
          rating: stars,
          edit: Date.now(),
        }).write()
      })
      setTimeout(()=>{
        this.$store.state.Performers.rating = 0
      },1000)
      this.$store.commit('updatePerformers')
    },
    filterByTag(tag) {
      let filter = {
        param: 'tags',
        cond: 'one of',
        val: [tag],
        type: 'array',
        flag: null,
        lock: false,
      }
      this.$store.state.Settings.performerFilters.push(filter)
      this.$store.dispatch('filterPerformers')
    },
    getTagColor(tag) {
      return this.$store.getters.tags.find({name: tag}).value().color
    },
    clearRating() {
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers.find({ id: performerId }).assign({ 
          rating: 0,
          edit: Date.now(),
        }).write()
      })
      this.$store.commit('updatePerformers')
    },
    addToFavorite() {
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers.find({ id: performerId }).assign({ 
          favorite: true,
          edit: Date.now(), 
        }).write()
      })
      this.$store.commit('updatePerformers')
    },
    removeFromFavorite() {
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers.find({ id: performerId }).assign({ 
          favorite: false,
          edit: Date.now(),
        }).write()
      })
      this.$store.commit('updatePerformers')
    },
    copyPerformerNameToClipboard(){
      navigator.clipboard.writeText(this.selectedPerformers()).then(function() {
        console.log('Async: Copying to clipboard was successful!');
      }, function(err) {
        console.error('Async: Could not copy text: ', err);
      })
    },
    deletePerformers() {
      if (this.deleteVideos) {
        let perfs = this.$store.getters.getSelectedPerformers
        let ps = this.$store.getters.performers
        let names = perfs.map(i=>(ps.find({id:i}).value().name))
        let vids = []
        for (let i = 0; i < names.length; i++) {
          let ids = this.$store.getters.videos.filter(v=>(
            v.performers.includes(names[i]))
          ).map('id').value()
          vids = vids.concat(ids)
        }
        // remove duplicates
        vids = vids.filter((value, index, self) => (self.indexOf(value) === index))
        this.$store.commit('updateSelectedVideos', vids)
        this.$store.dispatch('deleteVideos')
      }
      this.$store.dispatch('deletePerformers')
      this.$store.state.Performers.dialogDeletePerformer = false
    },
  },
  watch: {
  },
}
</script>