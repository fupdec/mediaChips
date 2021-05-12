<template>   
  <v-menu v-model="$store.state.contextMenu" :position-x="$store.state.x" :position-y="$store.state.y"
    leave-absolute absolute offset-y z-index="1000" min-width="150" close-on-click>
    <v-list @click="handler($event)" dense class="context-menu">
      <div v-for="(item, i) in content" :key="i">
        <v-list-item v-if="item.type=='item'" class="pr-1" link @mouseup="item.function">
          <v-list-item-title>
            <v-icon left size="18">mdi-{{item.icon}}</v-icon> {{item.name}} 
          </v-list-item-title>
          <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
        </v-list-item>

        <v-menu v-if="item.type=='submenu'" open-on-hover offset-x nudge-top="3" min-width="150">
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="pr-1" link v-bind="attrs" v-on="on" :disabled="item.disabled">
              <v-list-item-title> 
                <v-icon left size="18">mdi-{{item.icon}}</v-icon> {{item.name}}
              </v-list-item-title>
              <v-icon size="22">mdi-menu-right</v-icon>
            </v-list-item>
          </template>
          
          <v-list dense class="context-menu">
            <div v-for="(itemSub, j) in item.menu" :key="j">
              <v-list-item class="pr-1" link @mouseup="itemSub.function">
                <v-list-item-title>
                  <v-icon left size="18">mdi-{{itemSub.icon}}</v-icon> {{itemSub.name}} 
                </v-list-item-title>
                <v-icon size="22" color="rgba(0,0,0,0)">mdi-menu-right</v-icon>
              </v-list-item>
            </div>
          </v-list>
        </v-menu>

        <v-divider v-if="item.type=='divider'" class="ma-1"></v-divider>
      </div>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  name: 'ContextMenu',
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    content() {
      return this.$store.state.contextMenuContent
    },
  },
  methods: {
    handler(e) {
      console.log(e)
      return false
    }, 
    close(e) {
      setTimeout(() => {
        this.$store.state.contextMenu = false
      }, 100)
    }, 
  },
  watch: {
  },
}
</script>