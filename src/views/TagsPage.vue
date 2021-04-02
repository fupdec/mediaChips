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

    <div class="headline text-h3 text-center my-6"> Tags 
      <span class="text-h5">({{$store.getters.filteredTagsTotal}})</span>
    </div>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start py-0">
      <FiltersChips :filters="filters" type="Tag" />
    </v-container>
    
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

    <v-container fluid class="tags-grid" :class="gapSize">
      <TagCard :tag=tag v-for="(tag) in tagsOnPage" :key="tag.id"/>
    </v-container>

    <v-pagination v-if="!$store.state.Tags.filteredEmpty"
      v-model="tagsCurrentPage" :length="tagsPagesSum"
      :total-visible="getNumberOfPagesLimit" class="mt-6 mb-10"
    ></v-pagination>

    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>

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
        <v-card-actions v-if="isSelectedTagsHasVideoCategory">
          <v-radio-group v-model="$store.state.Tags.markersActionOnTagDelete" 
            label="What to do with markers?" hide-details mandatory class="mt-0 mx-2">
            <v-radio label="Delete from database" color="#e00" value="delete" on-icon="mdi-delete-forever"/>
            <v-radio label="Change to type Favorite" color="pink" value="favorite" on-icon="mdi-heart"/>
            <v-radio label="Change to type Bookmark" color="red" value="bookmark" on-icon="mdi-bookmark"/>
          </v-radio-group>
        </v-card-actions>
        <v-card-actions>
          <v-btn class="ma-2" @click="$store.state.Tags.dialogDeleteTag = false">
            No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" class="ma-2" dark @click="deleteTags">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <DialogEditTag v-if="$store.state.Tags.dialogEditTag"/>
    
    <v-menu v-model="$store.state.Tags.menuCard" :position-x="$store.state.x" 
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item link @mouseup="filterVideosByTag" :disabled="!isSelectedTagsOnlyWithVideoCategory">
          <v-list-item-title>
            <v-icon left size="18">mdi-video</v-icon> Filter Videos by Tag 
          </v-list-item-title>
        </v-list-item>
        <v-list-item link @mouseup="filterPerformersByTag" :disabled="!isSelectedTagsOnlyWithPerformerCategory">
          <v-list-item-title>
            <v-icon left size="18">mdi-account</v-icon> Filter Performers by Tag 
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @mouseup="$store.state.Tags.dialogEditTag = true"
          :disabled="!isSelectedSingleTag">
          <v-list-item-title>
            <v-icon left size="18">mdi-pencil</v-icon> Edit Tag
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @mouseup="copyTagNameToClipboard">
          <v-list-item-title>
            <v-icon left size="18">mdi-clipboard-text</v-icon> Copy Tag Name
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @mouseup="$store.state.Tags.dialogDeleteTag = true">
          <v-list-item-title>
            <v-icon left size="18" color="red">mdi-delete</v-icon> Delete Tag
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </vuescroll>
</template>


<script>
const { ipcRenderer, clipboard } = require('electron')

import TagCard from "@/components/pages/tags/TagCard.vue"
import Selection from "@simonwep/selection-js"
import vuescroll from 'vuescroll'

export default {
  name: "TagsPage",
  components: {
    TagCard, 
    DialogEditTag: () => import('@/components/pages/tags/DialogEditTag.vue'),
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
    FiltersChips: () => import('@/components/elements/FiltersChips.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
      this.$store.state.Tags.selection = new Selection({
        boundaries: ['.tags-grid'],
        selectables: ['.tag-card'],
        allowTouch: false,
      }).on('beforestart', ({store, event}) => {
        const targetEl = event.target.closest('.tag-card')
        if (event.button == 2 && store.selected.includes(targetEl)) {
          return false
        }
        return (event.button !== 1)
      }).on('start', ({store, event}) => {
        const targetEl = event.target.closest('.tag-card')
        if (event.button == 2 && store.selected.includes(targetEl)) {
          return false
        }
        if (!event.ctrlKey && !event.metaKey) {
          for (const el of store.stored) {
            el.classList.remove('selected')
          }
          this.$store.state.Tags.selection.clearSelection()
        }
      }).on('move', ({store: {changed: {added, removed}}}) => {
        for (const el of added) {
          el.classList.add('selected')
        }
        for (const el of removed) {
          el.classList.remove('selected')
        }
      }).on('stop', ({store, event}) => {
        const targetEl = event.target.closest('.tag-card')
        if (event.button==0 && targetEl) {
          this.$store.state.Tags.selection.select(targetEl)
        }
        this.$store.state.Tags.selection.keepSelection()
        this.getSelectedTags(store.stored)
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
    isScrollToTopVisible: false,
  }),
  computed: {
    chars: {
      get () {
        return this.$store.state.Settings.tagFirstChar
      },
      set (value) {
        this.$store.state.Settings.tagFirstChar = value
        this.$store.dispatch('filterTags')
      },
    },
    colors: {
      get () {
        return this.$store.state.Settings.tagColor
      },
      set (value) {
        this.$store.state.Settings.tagColor = value
        this.$store.dispatch('filterTags')
      },
    },
    getNumberOfPagesLimit() {
      return this.$store.state.Settings.numberOfPagesLimit
    },
    pages() {
      return this.$store.getters.tagsPages
    },
    tagsOnPage() {
      return this.$store.getters.tagsOnPage
    },
    tagsPerPage: {
      get() {
        return this.$store.state.Settings.tagsPerPage
      },
      set(number) {
        this.$store.dispatch('changeTagsPerPage', number)
      },
    },
    tagsPagesSum: {
      get() {
        return this.$store.state.Tags.pageTotal
      },
      set(number) {
        this.$store.state.Tags.pageTotal = number
      },
    },
    tagsCurrentPage: {
      get() {
        return this.$store.state.Settings.tagPage
      },
      set(number) {
        this.$store.state.Settings.tagPage = number
        this.$store.dispatch('saveFiltersOfTags')
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
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
    },
    tab() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id: +this.tabId}).value()    
      }
    },
    isSelectedTagsHasVideoCategory() {
      let ids = this.$store.getters.getSelectedTags
      let tags = this.$store.getters.tags
      if (ids.length!==0) {
        for (let i=0; i<ids.length; i++) {
          let tag = tags.find(tag => tag.id == ids[i] && tag.type.includes('video') ).value()
          if (tag) return true
        }
        return false
      } else return false
    },
    isSelectedTagsOnlyWithVideoCategory() {
      let ids = this.$store.getters.getSelectedTags
      let tags = this.$store.getters.tags
      if (ids.length!==0) {
        let types = []
        for (let i=0; i<ids.length; i++) {
          if (tags.find({ id: ids[i], type: ['video']}).value()) {
            types.push(true)
          } else types.push(false) 
        }
        return !types.includes(false)
      } else return false
    },
    isSelectedTagsOnlyWithPerformerCategory() {
      let ids = this.$store.getters.getSelectedTags
      let tags = this.$store.getters.tags
      if (ids.length!==0) {
        let types = []
        for (let i=0; i<ids.length; i++) {
          if (tags.find({ id: ids[i], type: ['performer']}).value()) {
            types.push(true)
          } else types.push(false) 
        }
        return !types.includes(false)
      } else return false
    },
    filters() {
      return this.$store.state.Settings.tagFilters
    },
  },
  methods: {
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
      this.$store.state.Settings.tagFirstChar = []
      this.$store.dispatch('filterTags')
    },
    clearColors() {
      this.$store.state.Settings.tagColor = []
      this.$store.dispatch('filterTags')
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    getSelectedTags(selectedTags) {
      let ids = selectedTags.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedTags', ids)
    },
    copyTagNameToClipboard() {
      clipboard.writeText(this.selectedTags())
    },
    deleteTags(){
      this.$store.dispatch('deleteTags')
      this.$store.state.Tags.dialogDeleteTag = false
      ipcRenderer.send('updatePlayerDb', 'tags') // update tag in player window
    },
    initFilters() {
      let newFilters
      if (this.tabId === 'default' || typeof this.tab.filters === 'undefined') {
        newFilters = _.cloneDeep(this.$store.getters.settings.get('tagFilters').value())
        this.$store.state.Settings.tagSortBy = this.$store.getters.settings.get('tagSortBy').value()
        this.$store.state.Settings.tagSortDirection = this.$store.getters.settings.get('tagSortDirection').value()
        this.$store.state.Settings.tagPage = this.$store.getters.settings.get('tagPage').value()
        this.$store.state.Settings.tagFirstChar = this.$store.getters.settings.get('tagFirstChar').value()
        this.$store.state.Settings.tagColor = this.$store.getters.settings.get('tagColor').value()
      } else {
        newFilters = _.cloneDeep(this.tab.filters)
        this.$store.state.Settings.tagSortBy = this.tab.sortBy || 'name'
        this.$store.state.Settings.tagSortDirection = this.tab.sortDirection || 'asc'
        this.$store.state.Settings.tagPage = this.tab.page || 1
        this.$store.state.Settings.tagFirstChar = this.tab.firstChar || []
        this.$store.state.Settings.tagColor = this.tab.color || []
      }
      this.$store.state.Settings.tagFilters = newFilters
      this.$store.dispatch('filterTags', true)
    },
    filterVideosByTag() {
      let filters = [{
        param: 'tags',
        cond: 'one of',
        val: this.selectedTags().split(', '),
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
    filterPerformersByTag() {
      let filters = [{
        param: 'tags',
        cond: 'one of',
        val: this.selectedTags().split(', '),
        type: 'array',
        flag: null,
        lock: false,
      }]
      this.$store.state.Settings.performerFilters = _.cloneDeep(filters)
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.performerFiltersForTabName,
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.performerFilters),
        sortBy: 'name',
        sortDirection: 'asc',
        page: 1,
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
  },
  watch: {
    $route(newRoute) {
      if (!this.$route.path.includes('/tags/:')) return
      this.initFilters()
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
  &.gap-size {
    &-xs {
      grid-gap: 10px;
    }
    &-s {
      grid-gap: 15px;
    }
    &-m {
      grid-gap: 20px;
    }
    &-l {
      grid-gap: 25px;
    }
    &-xl {
      grid-gap: 30px;
    }
  }
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
    border: 2px solid var(--v-secondary-base);
  }
}
</style>