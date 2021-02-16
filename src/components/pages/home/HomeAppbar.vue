<template>
  <div class="app-bar-container">
    <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-icon>mdi-counter</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-btn-toggle v-model="$store.state.quantityRecentVideos"
          @change="changeQuantityRecentVideos" :value="$store.state.quantityRecentVideos"
          color="primary" mandatory
        > 
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" outlined :value="10">10</v-btn>
            </template>
            <span>10 previews</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" outlined :value="20">20</v-btn>
            </template>
            <span>20 previews</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" outlined :value="30">30</v-btn>
            </template>
            <span>30 previews</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" outlined :value="50">50</v-btn>
            </template>
            <span>50 previews</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" outlined :value="80">80</v-btn>
            </template>
            <span>80 previews</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-card>
    </v-menu>
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
      console.log(value)
      this.$store.commit('changeQuantityRecentVideos', value)
    },
  },
  watch: {
  },
}
</script>