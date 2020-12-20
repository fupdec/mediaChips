<template>
	<v-app-bar app dense clipped-left extension-height="28" :style="{background: headerColor}">
    <router-view name="appbar" />

    <template v-slot:extension v-if="tabsNumber>0">
      <Tabs />
    </template>
	</v-app-bar>
</template>


<script>
export default {
  name: 'AppBar',
  components: {
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    headerColor() {
      if (this.$store.state.Settings.headerGradient) {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.headerGradientDark
        } else return this.$store.state.Settings.headerGradientLight
      } else {
        if (this.$vuetify.theme.isDark) {
          return this.$store.state.Settings.appColorDarkHeader
        } else return this.$store.state.Settings.appColorLightHeader
      }
    },
    tabsNumber() {
      return this.$store.getters.tabs.length
    },
  },
  methods: {
  },
  watch: {
  },
}
</script>