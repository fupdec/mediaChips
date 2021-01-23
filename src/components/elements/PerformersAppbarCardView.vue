<template>
	<div>
    <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-badge :content="getCardSizeIcon()" class="text-uppercase" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn v-bind="attrs" v-on="on" icon tile>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-icon v-on="on">mdi-card-bulleted</v-icon>
              </template>
              <span>Card size</span>
            </v-tooltip>
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

    <v-menu bottom offset-y min-width="160">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" icon tile>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      
      <v-list dense class="context-menu">
        <v-list-item link @click="toggleEditBtnVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-account-edit</v-icon> Edit Buttons
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isEditBtnHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item v-if="!$store.state.Settings.ratingAndFavoriteInCard" link @click="toggleRatingVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-star</v-icon> Rating 
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isRatingHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item v-if="!$store.state.Settings.ratingAndFavoriteInCard" link @click="toggleFavoriteVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-heart</v-icon> Favorite
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isFavoriteHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleNationalityVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-flag</v-icon> Country Flag 
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isNationalityHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleProfileProgressVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-progress-check</v-icon> Profile Complete Progress
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isProfileProgressHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleNameVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-alphabetical-variant</v-icon> Name and Aliases
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isNameHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleAliasesVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-alphabetical</v-icon> Aliases
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isAliasesHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleCareerStatusVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-list-status</v-icon> Career Status
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isCareerStatusHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleTagsVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-tag</v-icon> Tags
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isTagsHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleVideoTagsVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-tag-outline</v-icon> Video Tags
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isVideoTagsHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>

        <v-list-item link @click="toggleWebsitesVisibilty()">
          <v-list-item-title>
            <v-icon left size="18">mdi-web</v-icon> Websites
          </v-list-item-title>
          <v-icon size="20" class="pl-10" :color="!isWebsitesHidden?'':'rgba(0,0,0,0)'">mdi-check</v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
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
        return this.$store.state.Settings.performerChipsColored
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'performerChipsColored', value})
      },
    },
    isEditBtnHidden: {
      get() {
        return this.$store.state.Settings.performerEditBtnHidden
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'performerEditBtnHidden', value})
      },
    },
    isRatingHidden: {
      get () {
        return this.$store.state.Settings.performerRatingHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerRatingHidden', value})
      },
    },
    isNationalityHidden: {
      get () {
        return this.$store.state.Settings.performerNationalityHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerNationalityHidden', value})
      },
    },
    isFavoriteHidden: {
      get () {
        return this.$store.state.Settings.performerFavoriteHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerFavoriteHidden', value})
      },
    },
    isProfileProgressHidden: {
      get () {
        return this.$store.state.Settings.performerProfileProgressHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerProfileProgressHidden', value})
      },
    },
    isNameHidden: {
      get () {
        return this.$store.state.Settings.performerNameHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerNameHidden', value})
      },
    },
    isAliasesHidden: {
      get () {
        return this.$store.state.Settings.performerAliasesHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerAliasesHidden', value})
      },
    },
    isMeterHidden: {
      get () {
        return this.$store.state.Settings.performerMeterHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerMeterHidden', value})
      },
    },
    isCareerStatusHidden: {
      get () {
        return this.$store.state.Settings.performerCareerStatusHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerCareerStatusHidden', value})
      },
    },
    isTagsHidden: {
      get () {
        return this.$store.state.Settings.performerTagsHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerTagsHidden', value})
      },
    },
    isVideoTagsHidden: {
      get () {
        return this.$store.state.Settings.performerVideoTagsHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerVideoTagsHidden', value})
      },
    },
    isWebsitesHidden: {
      get () {
        return this.$store.state.Settings.performerWebsitesHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'performerWebsitesHidden', value})
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
    changeCardSize(value) {
      this.$store.dispatch('updateSettingsState', {key:'performerCardSize', value})
      this.getCardSizeIcon()
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