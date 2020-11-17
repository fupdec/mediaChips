<template>
	<v-tabs v-model="active" optional fixed-tabs>
    <draggable  
      v-model="tabs" class="tabs-group" v-bind="dragOptions"
      @start="drag = true" @end="drag = false"
    >
      <transition-group type="transition" :name="!drag ? 'flip-tabs' : null" style="display:flex">
        <v-tab 
          @click.middle="closeTab($event, tab.id)" 
          v-for="(tab, i) in tabs" :key="i" :id="tab.id" exact
          :to="tab.link" :ripple="false" class="tabs-group-item"
        >
          <div class="tab-name" :title="tab.name"> 
            <v-icon small>{{`mdi-${tab.icon}`}}</v-icon> 
            {{ tab.name }} 
          </div>
          <v-btn @click="closeTab($event, tab.id)" class="close-btn" icon tile :ripple="false">
            <v-icon small>mdi-close</v-icon>
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
    }
  },
  methods: {
    closeTab(e, tabId) {
      e.preventDefault()
      this.$store.dispatch('closeTab', tabId)
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.flip-tabs-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
  background: #777;
}
.tabs-group-item {
  cursor: default;
}
</style>