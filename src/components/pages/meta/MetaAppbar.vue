<template>
	<div class="app-bar-container">
		<div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon small class="icon-plus">mdi-plus</v-icon>
                <v-icon>mdi-{{meta.settings.icon}}</v-icon>
              </v-btn>
            </template>
            <span>Add New {{meta.settings.nameSingular}}</span>
          </v-tooltip>
        </template>
        <v-card width="500">
          <v-toolbar color="primary">
            <span class="headline">Adding New {{meta.settings.nameSingular}}</span>
            <v-spacer></v-spacer>
            <v-btn @click="addNewCard" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
          </v-toolbar>
          <v-card-text>
            <v-form ref="formAddCard" v-model="validCardName">
              <v-textarea v-model="cardNames" label="Names" outlined required :rules="nameRules"
                :hint="`Write a name on a new line to add several ${meta.settings.name.toLowerCase()} at once`" no-resize/>
              <v-alert v-if="dupCards.length" border="left" dense text dismissible class="mt-4 mb-0"
                icon="mdi-plus-circle-multiple-outline" close-text="Close" type="warning"
              > Already in the database: {{dupCards.join(', ')}} </v-alert>
              <v-alert v-if="newCards.length" border="left" dense text icon="mdi-plus-circle"
                close-text="Close" type="success" dismissible class="mt-4 mb-0" 
              > Added: {{newCards.join(', ')}} </v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Meta.dialogFilterMetaCards=true" v-on="on" icon tile>
            <v-badge :value="filterBadge" :content="filteredTotal" overlap bottom style="z-index: 5;"> 
              <v-icon>mdi-filter</v-icon> </v-badge>
          </v-btn>
        </template>
        <span>Filter {{meta.settings.name}}</span>
      </v-tooltip>
    
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-badge :value="searchStringComputed" icon="mdi-format-letter-case" overlap offset-x="23" offset-y="44">
                <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                  <v-icon>mdi-magnify</v-icon>
                </v-btn>
              </v-badge>
            </template>
            <span>Search by Name</span>
          </v-tooltip>
        </template>
        <v-card width="350">
          <div class="pa-2 d-flex">
            <v-text-field :value="searchStringComputed" @input="changeSearchString($event)" autofocus
              @click:clear="clearSearch" outlined dense hide-details clearable class="pt-0"/>
            <v-btn @click="search" class="ml-2" color="primary" depressed height="40">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
          </div>
        </v-card>
      </v-menu>

      <v-tooltip v-if="meta.settings.favorite" bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="toggleFavorites" v-on="on" icon tile>
            <v-icon v-if="favoritesFilterExist">mdi-heart</v-icon>
            <v-icon v-else>mdi-heart-outline</v-icon>
          </v-btn>
        </template>
        <span>Toggle Favorites</span>
      </v-tooltip>

      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-badge :icon="sortIcon" overlap offset-x="23" offset-y="44" class="badge-sort">
                <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                  <v-icon>mdi-sort-variant</v-icon>
                  <v-icon v-if="sortDirection=='desc'" size="16" class="badge-sort-icon">mdi-arrow-up-thick</v-icon>
                  <v-icon v-else size="16" class="badge-sort-icon">mdi-arrow-down-thick</v-icon>
                </v-btn>
              </v-badge>
            </template>
            <span>Sort {{meta.settings.name}}</span>
          </v-tooltip>
        </template>
        <v-card>
          <v-btn-toggle :value="sortBy" @change="changeSortBy($event)" mandatory class="group-buttons-sort" color="primary">
            <v-tooltip v-for="(s,i) in sort" :key="i" bottom>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" @click="sortMetaCards" :value="s.name" outlined>
                  <v-icon>mdi-{{s.icon}}</v-icon>
                  <v-icon right size="14" v-if="sortBy==s.name && sortDirection=='desc'">mdi-arrow-up-thick</v-icon>
                  <v-icon right size="14" v-if="sortBy==s.name && sortDirection=='asc'">mdi-arrow-down-thick</v-icon>
                </v-btn>
              </template>
              <span>Sort by {{s.tip}}</span>
            </v-tooltip>
          </v-btn-toggle>
        </v-card>
      </v-menu>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="addNewTab" icon tile v-on="on">
            <v-icon>mdi-tab-plus</v-icon>
          </v-btn>
        </template>
        <span>Add New Tab</span>
      </v-tooltip>

      <v-tooltip v-if="meta.settings.nested" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" @click="dialogNested=true" icon tile>
            <v-icon>mdi-file-tree</v-icon>
          </v-btn>
        </template>
        <span>Show Tree of {{meta.settings.name}}</span>
      </v-tooltip>
    </div>
    <DialogFilterMetaCards v-if="$store.state.Meta.dialogFilterMetaCards"/>
    <DialogNestedMetaCards v-if="dialogNested" @close="dialogNested=false"/>


    <v-spacer></v-spacer>

    <div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-badge :content="cardSizes[meta.state.cardSize-1]" class="text-uppercase" color="secondary" overlap offset-x="25" offset-y="25">
                <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                  <v-icon>mdi-card-bulleted</v-icon>
                </v-btn>
              </v-badge>
            </template>
            <span>Card Size</span>
          </v-tooltip>
        </template>
        <v-card width="300">
          <v-toolbar color="primary" height="30">
            <span class="headline">Card Size</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-card-bulleted-settings</v-icon>
          </v-toolbar>
          <v-slider :value="meta.state.cardSize" min="1" max="5" step="1" class="pa-6"
            @input="updateMetaState('cardSize', $event)" :tick-labels="cardSizes"/>
        </v-card>
      </v-menu>

      <v-menu bottom offset-y min-width="160">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <span>Visibility</span>
          </v-tooltip>
        </template>
        
        <v-list dense class="context-menu">
          <v-list-item v-for="(item) in specificMeta" :key="item" link @click="toggleVisibility(item)">
            <v-list-item-title> 
              <v-icon left size="18">mdi-{{getMeta(item).settings.icon}}</v-icon>
              {{getMeta(item).settings.name}}
            </v-list-item-title>
            <v-icon size="20" class="pl-10" :color="visibility[item]?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
          </v-list-item>
          <v-divider class="ma-1"></v-divider>
          <v-list-item v-for="(mc) in metaInCard" :key="mc.id" link @click="toggleVisibility(mc.id)">
            <v-list-item-title>
              <v-icon left size="18">mdi-{{getMeta(mc.id).settings.icon}}</v-icon>
              {{getMeta(mc.id).settings.name}}
            </v-list-item-title>
            <v-icon size="20" class="pl-10" :color="visibility[mc.id]?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
	</div>
</template>


<script>
const shortid = require('shortid')

import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'MetaAppbar',
  components: {
    DialogFilterMetaCards: () => import('@/components/pages/meta/DialogFilterMetaCards.vue'),
    DialogNestedMetaCards: () => import('@/components/pages/meta/DialogNestedMetaCards.vue'),
  },
  mixins: [MetaGetters],
  beforeMount() {
    this.initSort()
    this.initSpecificMeta()
    this.initVisibility()
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    validCardName: false,
    nameRules: [v => !!v || 'Name is required'],
    dupCards: [],
    newCards: [],
    cardNames: '',
    searchString: '',
    sort: [
      {
        name: 'name',
        icon: 'alphabetical-variant',
        tip: 'Name',
      },
      {
        name: 'date',
        icon: 'calendar-plus',
        tip: 'Date Added',
      },
      {
        name: 'edit',
        icon: 'calendar-edit',
        tip: 'Date of Editing',
      },
    ],
    sortBy: 'name',
    cardSizes: ['XS','S','M','L','XL'],
    specificMeta: ['name'],
    dialogNested: false,
  }),
  computed: {
    sortIcon() {
      let sortObject = _.find(this.sort, {name: this.sortBy})
      if (sortObject) return `mdi-${sortObject.icon}`
      else return 'mdi-help'
    },
    filters() { return this.$store.state.Meta.filters || [] },
    filterBadge() {
      let filters = this.filters
      if (filters.length) {
        filters = _.filter(filters, f => {
          if (f.type == null) return false 
          if (f.type == 'boolean') return true
          if (['number','string','date','select','array'].includes(f.type)) {
            if (f.val.length) return true 
            else return false
          } 
        })
        return filters.length > 0
      } else return false
    },
    filteredTotal() {
      let filters = this.filters
      if (filters.length) {
        filters = _.filter(filters, f => {
          if (f.type == null) return false 
          if (f.type == 'boolean') return true
          if (['number','string','date','select','array'].includes(f.type)) {
            if (f.val.length) return true 
            else return false
          } 
        })
        return filters.length
      } else return 0
    },
    searchStringComputed() {
      let search = _.find(this.filters, {by: 'name', appbar: true})
      if (search) return search.val
      else return ''
    },
    favoritesFilterExist() {
      let favorite = {by:'favorite',cond:'yes',val:'',type:'boolean',flag:null,appbar:true,lock:false}
      let index = _.findIndex(this.filters, favorite)
      return index > -1
    },
    sortDirection() { return this.meta.state.sortDirection || 'asc' },
    metaInCard() { return this.meta.settings.metaInCard || [] },
    visibility() { return this.$store.state.Meta.visibility },
  },
  methods: {
    initSpecificMeta() {
      if (this.meta.settings.synonyms) this.specificMeta.push('synonyms')
      if (this.meta.settings.favorite) this.specificMeta.push('favorite')
      if (this.meta.settings.rating) this.specificMeta.push('rating')
      if (this.meta.settings.bookmark) this.specificMeta.push('bookmark')
      if (this.meta.settings.country) this.specificMeta.push('country')
      if (this.meta.settings.color) this.specificMeta.push('color')
    },
    initVisibility() {
      let visibility = {}
      for (let i = 0; i < this.specificMeta.length; i++) visibility[this.specificMeta[i]] = true
      for (let i = 0; i < this.metaInCard.length; i++) visibility[this.metaInCard[i].id] = true
      this.$store.state.Meta.visibility = {...visibility, ...this.meta.state.visibility}
    },
    addNewCard() {
      this.$refs.formAddCard.validate()
      if (!this.validCardName) return
      let cardsArray = this.cardNames.trim()
      cardsArray = cardsArray.split(/\r?\n/)
      cardsArray = cardsArray.filter((el)=>(el != ''))
      cardsArray = cardsArray.map(s => s.trim())

      const cardsDb = this.$store.getters.metaCards.filter({metaId:this.meta.id})
      this.dupCards = []
      this.newCards = []
      let vm = this

      async function addCardInDb() {
        for (const card of cardsArray) {
          let duplicate = cardsDb.find(i=>(i.meta.name.toLowerCase()===card.toLowerCase())).value()
          if (duplicate) { vm.dupCards.push(duplicate.meta.name); continue }
          vm.$store.dispatch('addMetaCard', { 
            id: shortid.generate(),
            metaId: vm.metaId,
            meta: { name: card },
          })
          vm.newCards.push(card)
        }
      }

      addCardInDb().then(() => {
        this.cardNames = '',
        this.$store.dispatch('filterMetaCards')
        // ipcRenderer.send('updatePlayerDb', 'websites') // TODO update meta in player window
      })
    },
    search() {
      if (this.searchString == null || this.searchString.length == 0) return
      let index = _.findIndex(this.filters, {by: 'name', appbar: true})
      if (index > -1) this.$store.state.Meta.filters.splice(index, 1)
      this.$store.state.Meta.filters.push({
        by: 'name', cond: 'includes', val: this.searchString,
        type: 'string', flag: null, appbar: true, lock: false
      })
      this.$store.dispatch('filterMetaCards')
    },
    changeSearchString(e) { this.searchString = e },
    clearSearch() {
      let index = _.findIndex(this.filters, {by: 'name', appbar: true,})
      if (index > -1) this.$store.state.Meta.filters.splice(index, 1)
      else return
      this.$store.dispatch('filterMetaCards')
    },
    toggleFavorites() {
      let filters = this.filters
      let favorite = {by:'favorite',cond:'yes',val:'',type:'boolean',flag:null,appbar:true,lock:false}
      let index = _.findIndex(filters, favorite)
      if (index > -1) this.$store.state.Meta.filters.splice(index, 1)
      else this.$store.state.Meta.filters.push(favorite)
      this.$store.dispatch('filterMetaCards')
    },
    updateMetaState(key, value) { this.$store.dispatch('updateMetaState', {id: this.metaId, key, value}) },
    initSort() {
      this.sortBy = this.meta.state.sortBy || 'name'
      let color = { name: 'color', icon: 'palette', tip: 'Color', }
      if (this.meta.settings.color) this.sort.push(color)
    },
    changeSortBy(e) { this.sortBy = e },
    sortMetaCards() {
      setTimeout(()=>{ 
        this.$store.state.Meta.sortBy = this.sortBy
        this.$store.state.Meta.sortDirection = this.sortDirection=='asc'?'desc':'asc'
        this.$store.dispatch('filterMetaCards') 
      }, 100)
    },
    addNewTab() {
      let tabId = Date.now().toString()
      let tab = { 
        name: this.meta.settings.name, 
        link: `/meta/?metaId=${this.meta.id}&tabId=${tabId}`,
        id: tabId,
        filters: this.filters,
        sortBy: this.sortBy,
        sortDirection: this.sortDirection,
        page: 1,
        icon: this.meta.settings.icon
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    toggleVisibility(item) {
      let value = !this.visibility[item]
      this.$store.state.Meta.visibility[item] = value
      this.$store.getters.meta.find({id:this.meta.id}).get('state.visibility').set(item,value).write()
    },
  },
  watch: {},
}
</script>


<style lang="scss">
.icon-plus {
  width: 10px !important;
}
</style>