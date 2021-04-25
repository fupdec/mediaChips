<template>
	<div class="app-bar-container">
		<div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-card-plus</v-icon>
              </v-btn>
            </template>
            <span>Add New Card</span>
          </v-tooltip>
        </template>
        <v-card width="500">
          <v-card-title class="py-1">
            <span class="headline">Add New Card</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-card-plus</v-icon>
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
    </div>

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

export default {
  name: 'MetaAppbar',
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    validCardName: false,
    nameRules: [
      v => !!v || 'Name is required',
      v => v.length > 1 || 'Name must be more than 1 characters',
      v => !/[\/\%"?<>{}\[\]]/g.test(v) || 'Name must not content \/%\"?<>{}\[\]',
    ],
    dupCards: '',
    newCards: '',
    cardNames: '',
  }),
  computed: {
    metaId() {
      return this.$route.query.metaId
    },
    meta() {
      return this.$store.getters.meta.find({id: this.metaId}).value()
    },
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
            cardId: shortid.generate(),
            name: card,
            metaId: vm.metaId,
          })
          newCards.push(card)
        }
      }

      addCardInDb().then(() => {
        this.dupCards = dups.join(', ')
        this.newCards = newCards.join(', ')
        this.cardNames = '',
        this.$store.dispatch('filterMetaCards', {metaId:this.metaId})
        // ipcRenderer.send('updatePlayerDb', 'websites') // TODO update meta in player window
      })
    },
    updateMetaSettings(key, value) {
      this.$store.dispatch('updateMetaSettings', {id: this.metaId, key, value})
    },
  },
  watch: {
  },
}
</script>