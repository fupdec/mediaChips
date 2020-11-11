<template>
	<keep-alive include="PerformersAppbar,VideosAppbar">
    <router-view name="appbar" />
	</keep-alive>
</template>


<script>
export default {
  name: 'AppBar',
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