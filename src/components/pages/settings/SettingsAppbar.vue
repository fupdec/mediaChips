<template>
	<v-app-bar app dense clipped-left extension-height="28" :style="{background: headerColor}">
		<div>
			<v-tooltip bottom>
				<template v-slot:activator="{ on }">
					<v-btn href="#videos" icon tile v-on="on">
						<v-icon>mdi-video</v-icon>
					</v-btn>
				</template>
				<span>Go to videos</span>
			</v-tooltip>
			<v-tooltip bottom>
				<template v-slot:activator="{ on }">
					<v-btn href="#performers" icon tile v-on="on">
						<v-icon>mdi-account</v-icon>
					</v-btn>
				</template>
				<span>Go to Performers</span>
			</v-tooltip>
			<v-tooltip bottom>
				<template v-slot:activator="{ on }">
					<v-btn href="#tags" icon tile v-on="on">
						<v-icon>mdi-tag</v-icon>
					</v-btn>
				</template>
				<span>Go to Tags</span>
			</v-tooltip>
			<v-tooltip bottom>
				<template v-slot:activator="{ on }">
					<v-btn href="#websites" icon tile v-on="on">
						<v-icon>mdi-web</v-icon>
					</v-btn>
				</template>
				<span>Go to Websites</span>
			</v-tooltip>
			<v-tooltip bottom>
				<template v-slot:activator="{ on }">
					<v-btn href="#appearance" icon tile v-on="on">
						<v-icon>mdi-application</v-icon>
					</v-btn>
				</template>
				<span>Go to appearance</span>
			</v-tooltip>
			<v-tooltip bottom>
				<template v-slot:activator="{ on }">
					<v-btn href="#database" icon tile v-on="on">
						<v-icon>mdi-database</v-icon>
					</v-btn>
				</template>
				<span>Go to Database</span>
			</v-tooltip>
		</div>
		
    <template v-slot:extension v-if="$store.getters.tabs.length">
      <Tabs />
    </template>
	</v-app-bar>
</template>


<script>
export default {
  name: 'SettingsAppbar',
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
  },
  methods: {
  },
  watch: {
  },
}
</script>