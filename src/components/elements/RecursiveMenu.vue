<template>
  <v-menu :open-on-hover="false" offset-x nudge-top="3" min-width="150" :close-on-content-click="false">
    <template v-slot:activator="{ on, attrs }">
      <v-list-item class="pr-1" link v-bind="attrs" v-on="on" :disabled="item.disabled">
        <v-list-item-title> 
          <v-icon left size="18" :color="item.color">mdi-{{item.icon}}</v-icon> {{item.name}}
        </v-list-item-title>
        <v-icon size="22">mdi-menu-right</v-icon>
      </v-list-item>
    </template>

    <v-list dense class="context-menu">
      <vuescroll>
        <div class="wrapper">
          <div v-for="(itemSub, j) in item.menu" :key="j">
            <v-list-item v-if="itemSub.type=='item'" @mouseup="close(itemSub.function)" class="pr-1" link>
              <v-list-item-title>
                <v-icon left size="18" :color="itemSub.color">mdi-{{itemSub.icon}}</v-icon> {{itemSub.name}} 
              </v-list-item-title>
              <div class="px-3"/>
            </v-list-item>

            <v-divider v-else-if="itemSub.type=='divider'" class="ma-1"></v-divider>

            <RecursiveMenu v-else-if="itemSub.type=='menu'" :item="itemSub" />
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
  name: 'RecursiveMenu',
  props: {
    item: Object,
  },
  components: { RecursiveMenu, vuescroll },
  methods: {
    close(originalFunction) {
      originalFunction()
      this.$store.state.contextMenu = false
    },
  }
}
</script>