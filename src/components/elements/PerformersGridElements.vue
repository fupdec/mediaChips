<template>
	<div>
    <v-dialog v-model="$store.state.Performers.dialogDeletePerformer" persistent scrollable max-width="600">
      <v-card>
        <v-card-title class="title">
          Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete-alert</v-icon>
        </v-card-title>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>
              You want to delete performer<span v-if="selectedPerformersLength>1">s
              ({{selectedPerformersLength}}) </span>
            </div>
            {{selectedPerformers(true)}}
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn class="ma-4" 
            @click="$store.state.Performers.dialogDeletePerformer = false">No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" dark class="ma-4" @click="deletePerformers">Yes, delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <DialogEditPerformerInfo v-if="$store.state.Performers.dialogEditPerformerInfo"/>
    <DialogEditPerformerImages v-if="$store.state.Performers.dialogEditPerformerImages"/>
    
    <v-menu v-model="$store.state.Performers.menuCard" :position-x="$store.state.x" 
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item class="pr-1" link :disabled="!isSelectedSinglePerformer" @mouseup="addNewTab">
          <v-list-item-title>
            <v-icon left size="18">mdi-tab-plus</v-icon> Open in a new tab
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>

        <v-divider class="ma-1"></v-divider>

        <v-list-item class="pr-1" link :disabled="!isSelectedSinglePerformer"
          @mouseup="$store.state.Performers.dialogEditPerformerInfo = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-square-edit-outline</v-icon> Edit profile
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link :disabled="!isSelectedSinglePerformer"
          @mouseup="$store.state.Performers.dialogEditPerformerImages = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-image-edit</v-icon> Edit images
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
                <v-icon left size="18">mdi-star-off</v-icon> Clear rating 
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
                <v-icon left size="18">mdi-heart-plus</v-icon> Add to favorite 
              </v-list-item-title>
            </v-list-item>
            <v-list-item link @mouseup="removeFromFavorite">
              <v-list-item-title> 
                <v-icon left size="18">mdi-heart-remove</v-icon> Remove from favorite 
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="ma-1"></v-divider>

        <v-list-item class="pr-1" link @mouseup="copyPerformerNameToClipboard">
          <v-list-item-title>
            <v-icon left size="18">mdi-clipboard-text</v-icon> Copy performer name
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>

        <v-divider class="ma-1"></v-divider>
        
        <v-list-item class="pr-1" link @mouseup="$store.state.Performers.dialogDeletePerformer = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-delete</v-icon> Delete performer
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
	</div>
</template>


<script>
const fs = require("fs")
const path = require("path")
import Selection from "@simonwep/selection-js"
import vuescroll from 'vuescroll'

export default {
  name: 'PerformersGridElements',
  components: {
    vuescroll,
    DialogEditPerformerInfo: () => import('@/components/pages/performers/DialogEditPerformerInfo.vue'),
    DialogEditPerformerImages: () => import('@/components/pages/performers/DialogEditPerformerImages.vue'),
  },
  mounted () {
    this.$nextTick(function () {
      this.$store.state.Performers.selection = Selection.create({
        boundaries: ['.performers-grid'],
        selectables: ['.performer-card'],
      }).on('beforestart', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.performer-card')
        if (oe.button === 2 && selected.includes(targetEl)) {
          return false
        }
        return (oe.button !== 1);
      }).on('start', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.performer-card')
        if (oe.button === 2 && selected.includes(targetEl)) {
          return false
        }
        // Remove class if the user isn't pressing the shift or control or ⌘ keys
        if (!oe.shiftKey && !oe.ctrlKey && !oe.metaKey) {
          // Unselect all elements
          for (const el of selected) {
              el.classList.remove('selected');
              inst.removeFromSelection(el);
          }
          // Clear previous selection
          inst.clearSelection();
        }
      }).on('move', ({changed: {removed, added}, inst, selected, oe}) => {
        // Add a custom class to the elements that where selected.
        for (const el of added) {
          el.classList.add('selected');
        }
        // Remove the class from elements that where removed
        // since the last selection
        for (const el of removed) {
          el.classList.remove('selected');
        }
      }).on('stop', ({inst, selected, oe}) => {
        if (oe.shiftKey || oe.ctrlKey || oe.metaKey) {
          let mergedCards = _.union(this.previousSelection, selected)
          let duplicates = _.filter(selected,(v,i,it)=>{return _.find(it, v, i + 1)})
          duplicates.map(duplicated=>{mergedCards = _.reject(mergedCards, duplicated)})
          selected = mergedCards
          this.previousSelection = mergedCards
          for (const el of duplicates) {
            inst.removeFromSelection(el)
          }
        } 
        inst.keepSelection()
        this.getSelectedPerformers(selected)
        let cards = document.querySelectorAll('.performer-card')
        for (let i=0;i<cards.length;++i) {
          cards[i].classList.remove("selected")
          void cards[i].offsetWidth
        }
        for (let i=0;i<selected.length;++i) {
          selected[i].classList.add("selected")
        }
      })
    })
  },
  destroyed() {
    this.$store.state.Performers.selection.destroy()
  },
  data: () => ({
    previousSelection: [],
  }),
  computed: {
    selectedPerformersLength() {
      return this.$store.getters.getSelectedPerformers.length
    },
    isSelectedSinglePerformer() {
      return this.$store.getters.getSelectedPerformers.length == 1
    },
  },
  methods: {
    addNewTab() {
      let performerId = this.$store.getters.getSelectedPerformers[0]
      let tab = { 
        name: this.selectedPerformers(), 
        link: `/performer/:${performerId}`,
        id: performerId + new Date().getTime(),
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
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
    getSelectedVideos(selectedVideos){
      let ids = selectedVideos.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedVideos', ids)
    },
    getSelectedPerformers(selectedPerformers){
      let ids = selectedPerformers.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPerformers', ids)
    },
    changeRating(stars) {
      console.log('rating changed: ' +stars)
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers
          .find({ id: performerId })
          .assign({ rating: stars })
          .write();
      })
      setTimeout(()=>{
        this.$store.state.Performers.rating = 0
      },1000)
      this.$store.commit('updatePerformers')
    },
    clearRating() {
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers
          .find({ id: performerId })
          .assign({ rating: 0 })
          .write();
      })
      this.$store.commit('updatePerformers')
    },
    addToFavorite() {
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers
          .find({ id: performerId })
          .assign({ favorite: true })
          .write();
      })
      this.$store.commit('updatePerformers')
    },
    removeFromFavorite() {
      this.$store.state.Performers.selectedPerformers.map(performerId => {
        this.$store.getters.performers
          .find({ id: performerId })
          .assign({ favorite: false })
          .write();
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
      this.previousSelection = []
      this.$store.dispatch('deletePerformers'), 
      this.$store.state.Performers.dialogDeletePerformer = false
    },
  },
  watch: {
  },
}
</script>