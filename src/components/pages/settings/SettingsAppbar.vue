<template>
	<div class="app-bar-container">
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
</template>


<script>
export default {
  name: 'SettingsAppbar',
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