<template>
  <div class="app-bar-container">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="$store.state.Settings.dialogScanVideos=true" v-on="on">
            <v-icon>mdi-video-plus</v-icon>
          </v-btn>
        </template>
        <span>Add new videos</span>
      </v-tooltip>
    </div>
    
    <v-spacer></v-spacer>
  </div>
</template>


<script>
export default {
  name: 'HomeAppbar',
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
    changeQuantityRecentVideos(value) {
      // console.log(value)
      this.$store.commit('changeQuantityRecentVideos', value)
    },
  },
  watch: {
  },
}
</script>