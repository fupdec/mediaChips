<template>
  <div v-show="loading" class="text-center">
    <h3 class="mb-2">Loading...</h3>
    <v-icon x-large class="loading-animation">mdi-loading</v-icon>
  </div>
</template>


<script>
export default {
  name: 'Loading',
  mounted() {
    this.$nextTick(function () {
      setTimeout(() => { 
        this.$store.commit('stopLoading')
      }, 0)
    })
  },
  updated() {
    setTimeout(() => { 
      this.$store.commit('stopLoading')
    }, 0)
  },
  computed: {
    loading() {
      return this.$store.state.itemsLoading
    },
  },
}
</script>