<template>
	<div>
    <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-badge :content="getCardSizeIcon()" class="text-uppercase" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn v-bind="attrs" v-on="on" icon tile>
            <v-icon>mdi-card-bulleted</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <v-card width="300">
        <v-card-title class="py-1">
          <span class="headline">Card size</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-card-bulleted-settings</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-slider v-model="$store.state.Settings.performerCardSize"
          min="1" max="5" step="1" :tick-labels="cardSizes"
          @input="changeCardSize" class="pa-6"
        />
      </v-card>
    </v-menu>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
				<v-badge :value="isChipsColored" class="colored" overlap offset-x="25" offset-y="25">
          <v-btn @click="toggleChipsColored()" v-on="on" icon tile>
            <v-icon>mdi-label</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isChipsColored">Make labels grey</span>
      <span v-else>Make labels colored</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isEditBtnHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleEditBtnVisibilty()" v-on="on">
            <v-icon>mdi-account-edit</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isEditBtnHidden">Show edit button</span>
      <span v-else>Hide edit button</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isRatingHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleRatingVisibilty()" v-on="on">
            <v-icon>mdi-star</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isRatingHidden">Show Rating</span>
      <span v-else>Hide Rating</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isNationalityHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleNationalityVisibilty()" v-on="on">
            <v-icon>mdi-flag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isNationalityHidden">Show country flag</span>
      <span v-else>Hide country flag</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFavoriteHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFavoriteVisibilty()" v-on="on">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFavoriteHidden">Show Favorite's heart</span>
      <span v-else>Hide Favorite's heart</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isProfileProgressHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleProfileProgressVisibilty()" v-on="on">
            <v-icon>mdi-progress-check</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isProfileProgressHidden">Show profile complete progress</span>
      <span v-else>Hide profile complete progress</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isNameHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleNameVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical-variant</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isNameHidden">Show Name</span>
      <span v-else>Hide Name & aliases</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isAliasesHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleAliasesVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isAliasesHidden">Show Aliases</span>
      <span v-else>Hide Aliases</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isMeterHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleMeterVisibilty()" v-on="on">
            <v-icon>mdi-gauge</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isMeterHidden">Show Tags Meter</span>
      <span v-else>Hide Tags Meter</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isCareerStatusHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleCareerStatusVisibilty()" v-on="on">
            <v-icon>mdi-list-status</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isCareerStatusHidden">Show Career Status</span>
      <span v-else>Hide Career Status</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isTagsHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleTagsVisibilty()" v-on="on">
            <v-icon>mdi-tag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isTagsHidden">Show Tags</span>
      <span v-else>Hide Tags</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isVideoTagsHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleVideoTagsVisibilty()" v-on="on">
            <v-icon>mdi-tag-outline</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isVideoTagsHidden">Show Video Tags</span>
      <span v-else>Hide Video Tags</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isWebsitesHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleWebsitesVisibilty()" v-on="on">
            <v-icon>mdi-web</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isWebsitesHidden">Show Websites</span>
      <span v-else>Hide Websites</span>
    </v-tooltip>
  </div>
</template>


<script>
export default {
  name: 'PerformersAppbarCardView',
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    cardSizes: ['XS','S','M','L','XL'],
  }),
  computed: {
    isChipsColored: {
      get() {
        return this.$store.state.Performers.performerChipsColored
      },
      set(value) {
        this.$store.dispatch('updatePerformerChipsColored', value)
      },
    },
    isEditBtnHidden: {
      get() {
        return this.$store.state.Performers.performerEditBtnHidden
      },
      set(value) {
        this.$store.dispatch('updatePerformerEditBtnHidden', value)
      },
    },
    isRatingHidden: {
      get () {
        return this.$store.state.Performers.performerRatingHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerRatingHidden', value)
      },
    },
    isNationalityHidden: {
      get () {
        return this.$store.state.Performers.performerNationalityHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerNationalityHidden', value)
      },
    },
    isFavoriteHidden: {
      get () {
        return this.$store.state.Performers.performerFavoriteHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerFavoriteHidden', value)
      },
    },
    isProfileProgressHidden: {
      get () {
        return this.$store.state.Performers.performerProfileProgressHidden
      },
      set (value) {
        this.$store.dispatch('updateProfileProgressHidden', value)
      },
    },
    isNameHidden: {
      get () {
        return this.$store.state.Performers.performerNameHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerNameHidden', value)
      },
    },
    isAliasesHidden: {
      get () {
        return this.$store.state.Performers.performerAliasesHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerAliasesHidden', value)
      },
    },
    isMeterHidden: {
      get () {
        return this.$store.state.Performers.performerMeterHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerMeterHidden', value)
      },
    },
    isCareerStatusHidden: {
      get () {
        return this.$store.state.Performers.performerCareerStatusHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerCareerStatusHidden', value)
      },
    },
    isTagsHidden: {
      get () {
        return this.$store.state.Performers.performerTagsHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerTagsHidden', value)
      },
    },
    isVideoTagsHidden: {
      get () {
        return this.$store.state.Performers.performerVideoTagsHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerVideoTagsHidden', value)
      },
    },
    isWebsitesHidden: {
      get () {
        return this.$store.state.Performers.performerWebsitesHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerWebsitesHidden', value)
      },
    },
  },
  methods: {
    toggleChipsColored() {
      this.isChipsColored = !this.isChipsColored
    },
    toggleEditBtnVisibilty() {
      this.isEditBtnHidden = !this.isEditBtnHidden
    },
    toggleMeterVisibilty() {
      this.isMeterHidden = !this.isMeterHidden
    },
    toggleNameVisibilty() {
      this.isNameHidden = !this.isNameHidden
    },
    toggleRatingVisibilty() {
      this.isRatingHidden = !this.isRatingHidden
    },
    toggleNationalityVisibilty() {
      this.isNationalityHidden = !this.isNationalityHidden
    },
    toggleFavoriteVisibilty() {
      this.isFavoriteHidden = !this.isFavoriteHidden
    },
    toggleProfileProgressVisibilty() {
      this.isProfileProgressHidden = !this.isProfileProgressHidden
    },
    toggleAliasesVisibilty() {
      this.isAliasesHidden = !this.isAliasesHidden
    },
    toggleCareerStatusVisibilty() {
      this.isCareerStatusHidden = !this.isCareerStatusHidden
    },
    toggleTagsVisibilty() {
      this.isTagsHidden = !this.isTagsHidden
    },
    toggleVideoTagsVisibilty() {
      this.isVideoTagsHidden = !this.isVideoTagsHidden
    },
    toggleWebsitesVisibilty() {
      this.isWebsitesHidden = !this.isWebsitesHidden
    },
    changeCardSize(event) {
      this.getCardSizeIcon()
      this.$store.getters.settings.set('performerCardSize', event).write()
    },
    getCardSizeIcon() {
      let size = ''
      switch(this.$store.state.Settings.performerCardSize) {
        case 1: size = 'xs'; break;
        case 2: size = 's'; break;
        case 3: size = 'm'; break;
        case 4: size = 'l'; break;
        case 5: size = 'xl'; break;
      }
      return size
    },
  },
}
</script>