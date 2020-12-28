<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <v-toolbar dense>
      <v-spacer></v-spacer>
      <v-tooltip bottom v-if="colors.length">
        <template v-slot:activator="{ on }">
          <v-btn @click="clearColors" icon small tile class="mr-2" v-on="on">
            <v-icon size="16">mdi-cancel</v-icon>
          </v-btn>
        </template>
        <span>Clear all colors</span>
      </v-tooltip>
      <v-btn-toggle v-model="colors" group multiple color="primary" class="mr-4">
        <v-btn v-for="(color,i) in swatches" :key="i" icon small class="ma-0" :value="color">
          <v-icon size="10" :color="color">mdi-circle</v-icon>
        </v-btn>
      </v-btn-toggle>
      <v-btn-toggle v-model="chars" group multiple color="primary">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn icon small class="ma-0" :value="27" v-on="on">#</v-btn>
          </template>
          <span>Symbol</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn icon small class="ma-0" :value="0" v-on="on">0-9</v-btn>
          </template>
          <span>Number</span>
        </v-tooltip>
        <v-btn v-for="(char,i) in alphabet" :key="i" icon small class="ma-0" :value="i+1">
          {{char}}
        </v-btn>
      </v-btn-toggle>
      <v-tooltip bottom v-if="chars.length">
        <template v-slot:activator="{ on }">
          <v-btn @click="clearChars" icon small tile class="ml-2" v-on="on">
            <v-icon size="20">mdi-alphabetical-variant-off</v-icon>
          </v-btn>
        </template>
        <span>Clear all characters</span>
      </v-tooltip>
      <v-spacer></v-spacer>
    </v-toolbar>

    <div class="headline text-h3 text-center my-6">Tags</div>
    
    <v-container fluid v-if="!$store.state.Tags.filteredEmpty" class="pagination-container my-6">
      <v-overflow-btn v-model="tagsPerPage" hint="items per page" persistent-hint
        :items="tagsPerPagePreset" dense height="36" solo disable-lookup hide-no-data
        class="items-per-page-dropdown"
      ></v-overflow-btn>
      <v-spacer></v-spacer>
      <v-pagination
        v-model="tagsCurrentPage"
        :length="tagsPagesSum"
        :total-visible="getNumberOfPagesLimit"
      ></v-pagination>
      <v-spacer></v-spacer>
      <v-overflow-btn v-if="tagsPagesSum > 5"
        v-model="tagsCurrentPage" :items="pages" dense height="36" solo
        class="items-per-page-dropdown jump-to-page-menu" 
        disable-lookup hint="jump to page" persistent-hint hide-no-data
        :menu-props="{ 
          auto:true, 
          contentClass:'jump-to-page-menu',
          nudgeBottom: -110,
          origin:'center center', 
          transition:'scale-transition'
        }"
      ></v-overflow-btn>
      <div v-else style="min-width:80px;"></div>
    </v-container>

    <div v-if="$store.state.Tags.filteredEmpty" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching tags for the selected filters.
    </div>

    <Loading/>

    <v-container fluid class="tags-grid">
      <TagCard :tag=tag v-for="(tag) in tagsOnPage" :key="tag.id"/>
    </v-container>

    <v-pagination v-if="!$store.state.Tags.filteredEmpty"
      v-model="tagsCurrentPage" :length="tagsPagesSum"
      :total-visible="getNumberOfPagesLimit" class="mt-6 mb-10"
    ></v-pagination>

    <div v-show="$store.getters.navigationSide=='0'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>

    <v-dialog v-model="$store.state.Tags.dialogDeleteTag" scrollable persistent max-width="600">
      <v-card>
        <v-card-title class="headline red--text">Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>You want to delete tag<span v-if="selectedTagsLength>1">s</span></div>
            {{selectedTags(true)}}
          </v-card-text>
          <!-- TODO: fix too much notifications if delete more then 1 item -->
        </vuescroll>
        <v-card-actions>
          <v-btn class="ma-4" @click="$store.state.Tags.dialogDeleteTag = false">
            No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" class="ma-4" dark @click="deleteTags">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <DialogEditTag v-if="$store.state.Tags.dialogEditTag"/>
    
    <v-menu v-model="$store.state.Tags.menuCard" :position-x="$store.state.x" 
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item class="pr-1" link :disabled="!isSelectedSingleTag" @mouseup="addNewTab">
          <v-list-item-title>
            <v-icon left size="18">mdi-tab-plus</v-icon> Open in a new tab
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @click="$store.state.Tags.dialogEditTag = true"
          :disabled="!isSelectedSingleTag">
          <v-list-item-title>
            <v-icon left size="18">mdi-pencil</v-icon> Edit tag
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @click="copyTagNameToClipboard">
          <v-list-item-title>
            <v-icon left size="18">mdi-clipboard-text</v-icon> Copy tag name
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @click="$store.state.Tags.dialogDeleteTag = true">
          <v-list-item-title>
            <v-icon left size="18">mdi-delete</v-icon> Delete tag
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </vuescroll>
</template>


<script>
const fs = require("fs")
const path = require("path")

import TagCard from "@/components/pages/tags/TagCard.vue";
import Selection from "@simonwep/selection-js";
import vuescroll from 'vuescroll'

export default {
  name: "TagsPage",
  components: {
    TagCard, 
    DialogEditTag: () => import('@/components/pages/tags/DialogEditTag.vue'),
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      this.$store.dispatch('filterTags')
      this.$store.state.Tags.selection = Selection.create({
        boundaries: ['.tags-grid'],
        selectables: ['.tag-card'],
      }).on('beforestart', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.tag-card')
        if (oe.button === 2 && selected.includes(targetEl)) {
          return false
        }
        return (oe.button !== 1);
      }).on('start', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.tag-card')
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
        this.getSelectedTags(selected)
        let cards = document.querySelectorAll('.tag-card')
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
    this.$store.state.Tags.selection.destroy()
  },
  data: () => ({
    alphabet: [
      'a','b','c','d','e','f','g','h','i','j','k','l','m','n',
      'o','p','q','r','s','t','u','v','w','x','y','z'
    ],
    swatches: [
      "#cc0e00", "#e8004f", "#ae0eff", "#2041f7", "#2196f3", "#00bcd4", "#009688", 
      "#2ac530", "#8bc34a", "#ff9800", "#ff5722", "#795548", "#9b9b9b"
    ],
    tagsPerPagePreset: [20,40,60,80,100,150,200],
    selection: null,
    previousSelection: [],
    isScrollToTopVisible: false,
  }),
  computed: {
    chars: {
      get () {
        return this.$store.state.Tags.filters.firstChar
      },
      set (value) {
        this.updateFiltersOfTags('firstChar', value)
      },
    },
    colors: {
      get () {
        return this.$store.state.Tags.filters.colors
      },
      set (value) {
        this.updateFiltersOfTags('colors', value)
      },
    },
    getNumberOfPagesLimit() {
      return this.$store.getters.getNumberOfPagesLimit
    },
    pages: {
      get() {
        return this.$store.getters.tagsPages
      },
      set(value) {
      },
    },
    tagsOnPage: {
      get() {
        return this.$store.getters.tagsOnPage
      },
      set(value) {
      },
    },
    tagsPerPage: {
      get() {
        return this.$store.getters.tagsPerPage
      },
      set(quantity) {
        this.$store.dispatch('changeTagsPerPage', quantity)
      },
    },
    tagsPagesSum: {
      get() {
        return this.$store.getters.tagsPagesSum
      },
      set(quantity) {
        this.$store.dispatch('changeTagsPageTotal', quantity)
      },
    },
    tagsCurrentPage: {
      get() {
        return this.$store.getters.tagsCurrentPage
      },
      set(quantity) {
        this.$store.dispatch('changeTagsPageCurrent', quantity)
      },
    },
    selectedTagsLength() {
      return this.$store.getters.getSelectedTags.length
    },
    isSelectedSingleTag() {
      return this.$store.getters.getSelectedTags.length == 1
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    addNewTab() {
      let tabId = this.$store.getters.getSelectedTags[0]
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with tag "${this.selectedTags()}" already exists`
        })
        return
      }
      let tab = { 
        name: this.selectedTags(), 
        link: `/tag/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    selectedTags(list) {
      let ids = this.$store.getters.getSelectedTags
      let tags = this.$store.getters.tags
      if (ids.length!==0) {
        let names = ids.map(i=>(tags.find({id:i}).value().name))
        if (list) {
          return names.map((n,i) => (`${i+1}) ${n}`)).join('\r\n')
        } else {
          return names.join(', ')
        }
      }
    },
    clearChars() {
      this.updateFiltersOfTags('firstChar', [])
    },
    clearColors() {
      this.updateFiltersOfTags('colors', [])
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    updateTabFilters() {
      let newFilters = _.cloneDeep(this.$store.state.Tags.filters)
      if (this.tabId === 'default') {
        this.$store.state.Tags.filtersReserved = newFilters
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.tagsFilters,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    updateFiltersOfTags(key, value){
      this.$store.commit('updateFiltersOfTags', {key, value})
      this.$store.dispatch('filterTags')
      this.updateTabFilters()
    },
    getSelectedTags(selectedTags){
      let ids = selectedTags.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedTags', ids)
    },
    copyTagNameToClipboard(){
      navigator.clipboard.writeText(this.selectedTags())
    },
    deleteTags(){
      this.previousSelection = []
      this.$store.dispatch('deleteTags')
      this.$store.state.Tags.dialogDeleteTag = false
    },
  },
  watch: {
    $route(newRoute) {
      if (!this.$route.path.includes('/tags/:')) return
      let id = newRoute.params.id.replace(':', '')
      let newFilters
      if (id === 'default') {
        newFilters = _.cloneDeep(this.$store.state.Tags.filtersReserved)
      } else {
        newFilters = _.cloneDeep(this.$store.getters.tabsDb.find({id}).value().filters)
      }
      this.$store.state.Tags.filters = newFilters
      this.$store.dispatch('filterTags')
    },
  }
}
</script>


<style lang="less">
.tags-grid {
  padding: 10px;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  grid-auto-rows: minmax(260px, auto);
}
.tag-card.selected {
  position: relative;
  overflow: visible;
  &:after {
    content: '';
    position: absolute;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    left: -4px;
    top: -4px;
    border-radius: 7px;
    pointer-events: none;
    border: 1.5px solid rgb(122, 122, 122);
  }
}
</style>