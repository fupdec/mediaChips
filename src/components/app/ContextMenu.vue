<template>   
  <v-menu v-model="$store.state.contextMenu" :position-x="$store.state.x" :position-y="$store.state.y"
    leave-absolute absolute offset-y z-index="1000" min-width="150" :close-on-content-click="false">
    <v-list dense class="context-menu">
      <vuescroll>
        <div class="wrapper">
          <div v-for="(item, i) in content" :key="i">
            <v-list-item v-if="item.type=='item'" @mouseup="close(item.function)" :disabled="item.disabled" class="pr-1" link>
              <v-list-item-title> 
                <v-icon left size="18" :color="item.color">mdi-{{item.icon}}</v-icon> {{item.name}} 
              </v-list-item-title>
              <div class="px-3"/>
            </v-list-item>

            <v-divider v-else-if="item.type=='divider'" class="ma-1"></v-divider>
            
            <RecursiveMenu v-else-if="item.type=='menu'" :item="item" />
          </div>
        </div>
      </vuescroll>
    </v-list>
  </v-menu>
</template>

<script>
import vuescroll from 'vuescroll'
import RecursiveMenu from '@/components/elements/RecursiveMenu.vue'

export default {
  name: 'ContextMenu',
  components: { RecursiveMenu, vuescroll },
  computed: {
    content() { return this.$store.state.contextMenuContent },
  },
  methods: {
    close(originalFunction) {
      originalFunction()
      this.$store.state.contextMenu = false
    },
  },
}
</script>