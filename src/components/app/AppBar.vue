<template>
	<v-app-bar app dense clipped-left extension-height="28" :style="{background: headerColor}">
    <router-view name="appbar" :key="$route.name + ($route.params.id || '')" />

    <template v-slot:extension v-if="tabs.length>0">
      <Tabs />
    </template>

    <v-menu v-if="tabs.length>0" v-model="$store.state.menuTabs" :position-x="$store.state.x" 
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item class="pr-1" link @mouseup="closeTab">
          <v-list-item-title>
            <v-icon left size="18">mdi-close</v-icon> Close tab
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="closeRightTabs" :disabled="tabs.length==contextTabIndex+1">
          <v-list-item-title>
            <v-icon left size="18">mdi-format-horizontal-align-right</v-icon> Close tabs on the right
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="closeOtherTabs" :disabled="tabs.length<2">
          <v-list-item-title>
            <v-icon left size="18">mdi-swap-horizontal</v-icon> Close other tabs
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
        <v-list-item class="pr-1" link @mouseup="closeAllTabs">
          <v-list-item-title>
            <v-icon left size="18">mdi-table-row-remove</v-icon> Close all tabs
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>
      </v-list>
    </v-menu>
	</v-app-bar>
</template>


<script>
export default {
  name: 'AppBar',
  components: {
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    headerColor() {
      if (this.$store.state.Settings.headerGradient) {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.headerGradientDark
        } else return this.$store.state.Settings.headerGradientLight
      } else {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.appColorDarkHeader
        } else return this.$store.state.Settings.appColorLightHeader
      }
    },
    tabsNumber() {
      return this.$store.getters.tabs.length
    },
    tabs:{
      get() {
        return this.$store.getters.tabs
      },
      set(tabs) {
        return this.$store.dispatch('updateTabs', tabs)
      },
    },
    tabId() {
      return this.$route.query.tabId
    },
    contextTab() {
      return this.$store.state.contextTab
    },
    contextTabIndex() {
      return this.$store.getters.tabsDb.findIndex({id: this.contextTab}).value()
    },
  },
  methods: {
    closeTab() {
      this.$store.dispatch('closeTab', this.contextTab)
      this.$store.state.menuTabs = false
    },
    closeRightTabs() {
      this.$store.getters.tabs.length = this.contextTabIndex + 1
      const tabs = this.$store.getters.tabs
      this.$store.dispatch('updateTabs', tabs)
      if (this.tabId !== 'default' && this.tabId !== undefined) {
        if (!this.$store.getters.tabsDb.find({id: this.tabId}).value()) {
          const link = this.$store.getters.tabs[this.contextTabIndex].link
          this.$router.push(link)
        }
      }
    },
    closeOtherTabs() {
      const tab = this.$store.getters.tabsDb.filter({id: this.contextTab}).value()
      this.$store.dispatch('updateTabs', tab)
      if (this.tabId !== 'default' && this.tabId !== this.contextTab && this.tabId !== undefined) {
        const link = this.$store.getters.tabs[this.contextTabIndex].link
        this.$router.push(link)
      }
    },
    closeAllTabs() {
      this.$store.dispatch('updateTabs', [])
      if (this.tabId !== 'default') {
        this.$router.push('/home')
      }
      this.$store.state.menuTabs = false
    },
  },
  watch: {
  },
}
</script>