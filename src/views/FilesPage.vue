<template>
  <vuescroll>
    <div class="headline text-h3 d-flex align-center justify-center py-6">
      <v-icon x-large left>mdi-file-find-outline</v-icon> Files
    </div>

    <div v-show="navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'FilesPage',
  components: {
    vuescroll,
  },
  mounted () {
    this.$nextTick(function () {
    })
  },
  beforeDestroy() {
    this.$store.state.navDrawer = false
  },
  data: ()=>({
  }),
  computed: {
    navigationSide() {return this.$store.state.Settings.navigationSide},
  },
  methods: {},
}
</script>