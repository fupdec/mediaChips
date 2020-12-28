<template>
	<v-tabs v-model="active" optional centered>
    <draggable  
      v-model="tabs" class="tabs-group" v-bind="dragOptions"
      @start="drag = true" @end="drag = false"
    >
      <transition-group type="transition" :name="!drag ? 'flip-tabs' : null" style="display:flex">
        <v-tab 
          @click.middle.prevent.stop="closeTab($event, tab.id)"
          @contextmenu="showContextMenu($event, tab.id)"
          v-for="(tab, i) in tabs" :key="i" :id="tab.id" exact
          :to="tab.link" :ripple="false" class="tabs-group-item"
        >
          <div class="tab-name" :title="tab.name"> 
            <v-icon size="13">{{`mdi-${tab.icon}`}}</v-icon> 
            {{ tab.name }} 
          </div>
          <v-btn @click="closeTab($event, tab.id)" class="close-btn" icon tile :ripple="false">
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </v-tab>
      </transition-group>
    
      <v-menu v-model="$store.state.menuTabs" :position-x="$store.state.x" 
        :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
        <v-list dense class="context-menu">
          <v-list-item class="pr-1" link @mouseup="closeTab(null, contextTab)">
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
    </draggable>
	</v-tabs>
</template>


<script>
import draggable from "vuedraggable"

export default {
  name: 'Tabs',
  components: {
    draggable
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    active: 0,
    drag: false,
    contextTab: '',
  }),
  computed: {
    tabs:{
      get() {
        return this.$store.getters.tabs
      },
      set(tabs) {
        return this.$store.dispatch('updateTabs', tabs)
      },
    },
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      };
    },
    tabId() {
      return this.$route.query.tabId
    },
    contextTabIndex() {
      return this.$store.getters.tabsDb.findIndex({id: this.contextTab}).value()
    },
  },
  methods: {
    closeTab(e, tabId) {
      this.$store.dispatch('closeTab', tabId)
      this.$store.state.menuTabs = false
    },
    closeRightTabs() {
      this.$store.getters.tabs.length = this.contextTabIndex + 1
      const tabs = this.$store.getters.tabs
      this.$store.dispatch('updateTabs', tabs)
      if (this.tabId !== 'default') {
        if (!this.$store.getters.tabsDb.find({id: this.tabId}).value()) {
          const link = this.$store.getters.tabs[this.contextTabIndex].link
          this.$router.push(link)
        }
      }
    },
    closeOtherTabs() {
      const tab = this.$store.getters.tabsDb.filter({id: this.contextTab}).value()
      this.$store.dispatch('updateTabs', tab)
      if (this.tabId !== 'default' && this.tabId !== this.contextTab) {
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
    showContextMenu(e, tabId) {
      e.preventDefault()
      this.contextTab = tabId
      this.$store.state.Videos.menuCard = false
      this.$store.state.Performers.menuCard = false
      this.$store.state.Tags.menuCard = false
      this.$store.state.Websites.menuCard = false
      this.$store.state.menuTabs = false
      this.$store.state.x = e.clientX
      this.$store.state.y = e.clientY
      this.$nextTick(() => {
        this.$store.state.menuTabs = true
      })
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.flip-tabs-move {
  transition: transform 0.2s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.2;
  background: #777;
}
.tabs-group-item {
  cursor: default;
}
</style>