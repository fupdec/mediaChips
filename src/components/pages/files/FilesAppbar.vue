<template>
  <div class="app-bar-container">
    <div>
      <!-- <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.navDrawer=!$store.state.navDrawer" icon tile v-on="on"> 
            <v-icon>mdi-file-tree</v-icon>
          </v-btn>
        </template>
        <span>Toggle Folder Tree</span>
      </v-tooltip> -->
    </div>
  </div>
</template>


<script>
export default {
  name: 'FilesAppbar',
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
  },
  methods: {
  },
  watch: {
  },
}
</script>