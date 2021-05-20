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
          <v-card-title class="py-1">
            <span class="headline">Adding New {{meta.settings.nameSingular}}</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-{{meta.settings.icon}}</v-icon>
          </v-card-title>
          <v-divider></v-divider>
            <v-card-text class="pb-0">
              <v-form ref="formAddCard" v-model="validCardName">
                <v-textarea v-model="cardNames" label="Names" outlined required :rules="nameRules"
                  hint="Write a name on a new line to add several websites at once" no-resize/>
                <v-alert v-if="dupCards.length" border="left" text dismissible class="mt-6"
                  icon="mdi-plus-circle-multiple-outline" close-text="Close" type="warning"
                > Already in the database: {{dupCards}} </v-alert>
                <v-alert v-if="newCards.length" border="left" text icon="mdi-plus-circle"
                  close-text="Close" type="success" dismissible class="mt-6" 
                > Added: {{newCards}} </v-alert>
              </v-form>
            </v-card-text>
            <v-card-actions class="pa-0">
              <v-spacer></v-spacer>
              <v-btn @click="addNewCard" color="primary" class="ma-4" small> 
                <v-icon left>mdi-plus</v-icon> Add </v-btn>
            </v-card-actions>
        </v-card>
      </v-menu>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Meta.dialogFilterMetaCards=true" v-on="on" icon tile>
            <v-icon>mdi-filter</v-icon>
          </v-btn>
        </template>
        <span>Filter {{meta.settings.name}}</span>
      </v-tooltip>
    </div>
    <DialogFilterMetaCards v-if="$store.state.Meta.dialogFilterMetaCards"/>

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

    <v-spacer></v-spacer>

    <div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-badge :content="meta.settings.cardSize" class="text-uppercase" color="secondary" overlap offset-x="25" offset-y="25">
                <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                  <v-icon>mdi-card-bulleted</v-icon>
                </v-btn>
              </v-badge>
            </template>
            <span>Card size</span>
          </v-tooltip>
        </template>
        <v-card width="300">
          <v-card-title class="py-1">
            <span class="headline">Card size</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-card-bulleted-settings</v-icon>
          </v-card-title>
          <v-divider></v-divider>
          <v-slider :value="meta.settings.cardSize" min="1" max="5" step="1" class="pa-6"
            @input="updateMetaSettings('cardSize', $event)"/>
        </v-card>
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
  },
  mixins: [MetaGetters],
  beforeMount() {
    this.initSort()
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    validCardName: false,
    nameRules: [v => !!v || 'Name is required'],
    dupCards: '',
    newCards: '',
    cardNames: '',
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
  }),
  computed: {
    sortIcon() {
      let sortObject = _.find(this.sort, {name: this.sortBy})
      if (sortObject) return `mdi-${sortObject.icon}`
      else return 'mdi-help'
    },
    sortDirection() { return this.meta.sortDirection || 'asc' },
  },
  methods: {
    addNewCard() {
      this.$refs.formAddCard.validate()
      if (!this.validCardName) return
      console.log('ok')
      let cardsArray = this.cardNames.trim()
      cardsArray = cardsArray.replace(/[\/\%"?<>{}\[\]]/g, '')
      cardsArray = cardsArray.split(/\r?\n/)
      cardsArray = cardsArray.filter((el)=>(el != ''))
      cardsArray = cardsArray.map(s => s.trim())

      const cardsDb = this.$store.getters.websites
      let dups = []
      let newCards = []
      let vm = this

      async function addCardInDb() {
        for (const card of cardsArray) {
          let duplicate = cardsDb.find(i=>(i.name.toLowerCase()===card.toLowerCase())).value()
          if (duplicate) { dups.push(duplicate.name); continue }
          vm.$store.dispatch('addMetaCard', { 
            id: shortid.generate(),
            metaId: vm.metaId,
            meta: { name: card },
          })
          newCards.push(card)
        }
      }

      addCardInDb().then(() => {
        this.dupCards = dups.join(', ')
        this.newCards = newCards.join(', ')
        this.cardNames = '',
        this.$store.dispatch('filterMetaCards')
        // ipcRenderer.send('updatePlayerDb', 'websites') // TODO update meta in player window
      })
    },
    updateMetaSettings(key, value) {
      this.$store.dispatch('updateMetaSettings', {id: this.metaId, key, value})
    },
    initSort() {
      this.sortBy = this.meta.sortBy || 'name'
      let color = { name: 'color', icon: 'palette', tip: 'Color', }
      if (this.meta.settings.chipColor) this.sort.push(color)
    },
    changeSortBy(e) { this.sortBy = e },
    sortMetaCards() {
      setTimeout(()=>{ 
        this.$store.state.Meta.sortBy = this.sortBy
        this.$store.state.Meta.sortDirection = this.sortDirection=='asc'?'desc':'asc'
        this.$store.dispatch('filterMetaCards') 
      }, 100)
    },
  },
  watch: {
  },
}
</script>


<style lang="scss">
.icon-plus {
  width: 10px !important;
}
</style>