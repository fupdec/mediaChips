<template>
	<v-tabs v-model="active" optional centered>
    <draggable  
      v-model="tabs" class="tabs-group" v-bind="dragOptions"
      @start="drag = true" @end="drag = false"
    >
      <transition-group type="transition" :name="!drag ? 'flip-tabs' : null" style="display:flex">
        <v-tab 
          v-for="tab in tabs" :key="tab.id" :id="tab.id" exact
          @click.middle.prevent.stop="closeTab($event, tab.id)"
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
      get() {
        return this.$store.getters.tabs
      },
      set(tabs) {
        return this.$store.dispatch('updateTabs', tabs) // TODO: check if can delete return
      },
    },
  },
  methods: {
    closeTab(e, tabId) {
      e.preventDefault()
      this.$store.dispatch('closeTab', tabId)
      this.$store.state.menuTabs = false
    },
    showContextMenu(e, tabId) {
      e.preventDefault()
      this.$store.state.contextTab = tabId
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