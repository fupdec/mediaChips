<template>
	<v-tabs v-model="active" optional centered :class="{borders:tabBorders}">
    <draggable  
      v-model="tabs" class="tabs-group" v-bind="dragOptions"
      @start="drag = true" @end="drag = false"
    >
      <transition-group type="transition" :name="!drag ? 'flip-tabs' : null" style="display:flex">
        <v-tab 
          v-for="tab in tabs" :key="tab.id" :id="tab.id" exact
          @click.middle.prevent.stop="closeTab($event, tab.id)"
          @mousedown.right="$store.state.contextMenu=false" 
          @contextmenu="showContextMenu($event, tab.id)"
          :to="tab.link" :ripple="false" class="tabs-group-item"
        >
          <div class="tab-name" :title="tab.name"> 
            <v-icon size="16">{{`mdi-${tab.icon}`}}</v-icon> 
            {{ tab.name }} 
          </div>
          <v-btn @click="closeTab($event, tab.id)" class="close-btn" icon tile :ripple="false">
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </v-tab>
      </transition-group>
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
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
  }),
  computed: {
    tabs:{
      get() { return this.$store.getters.tabs },
      set(tabs) { return this.$store.dispatch('updateSettingsState', {key:'tabs',value:_.cloneDeep(tabs)}) },
    },
    tabBorders() { return this.$store.state.Settings.tabBorders },
    tabId() { return this.$route.query.tabId },
  },
  methods: {
    closeTab(e, tabId) {
      e.preventDefault()
      this.$store.dispatch('closeTab', tabId)
      this.$store.state.contextMenu = false
    },
    closeRightTabs(tabId) {
      this.$store.getters.tabs.length = this.getTabIndexById(tabId) + 1
      this.tabs = this.$store.getters.tabs
      if (this.tabId !== 'default' && this.tabId !== undefined) {
        if (!this.$store.getters.tabsDb.find({id: this.tabId}).value()) {
          const link = this.$store.getters.tabs[this.getTabIndexById(tabId)].link
          this.$router.push(link)
        }
      }
    },
    closeOtherTabs(tabId) {
      this.tabs = this.$store.getters.tabsDb.filter({id: tabId}).value()
      if (this.tabId !== 'default' && this.tabId !== tabId && this.tabId !== undefined) {
        const link = this.$store.getters.tabs[this.getTabIndexById(tabId)].link
        this.$router.push(link)
      }
    },
    closeAllTabs() {
      this.tabs = []
      if (this.tabId !== 'default') this.$router.push('/home')
      this.$store.state.menuTabs = false
    },
    getTabIndexById(tabId) { return this.$store.getters.tabsDb.findIndex({id: tabId}).value() },
    showContextMenu(e, tabId) {
      e.preventDefault()
      setTimeout(() => {
        this.$store.state.x = e.clientX
        this.$store.state.y = e.clientY
        let contextMenu = [
          { name: `Close Tab`, type: 'item', icon: 'close', function: ()=>{this.$store.dispatch('closeTab', tabId)}},
          { name: `Close Tabs on the Right`, type: 'item', icon: 'format-horizontal-align-right', function: ()=>{this.closeRightTabs(tabId)}, disabled: this.tabs.length==this.getTabIndexById(tabId)+1},
          { name: `Close Other Tabs`, type: 'item', icon: 'swap-horizontal', function: ()=>{this.closeOtherTabs(tabId)}, disabled: this.tabs.length<2},
          { name: `Close All Tabs`, type: 'item', icon: 'table-row-remove', function: ()=>{this.closeAllTabs()}},
        ]
        this.$store.state.contextMenuContent = contextMenu
        this.$store.state.contextMenu = true
      }, 300)
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