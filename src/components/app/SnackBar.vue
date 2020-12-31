<template>   
  <v-snackbar
    v-model="notificationState"
    :timeout="getNotificationTimeout"
    color="error" right
  > {{$store.getters.getNotificationText}}
    <v-btn @click="$store.commit('closeNotification')" text>Close</v-btn>
  </v-snackbar>
</template>

<script>
export default {
  name: 'SnackBar',
  components: {
  },
  props: {
  },
  mounted() {
  },
  data: () => ({
  }),
  computed: {
    notificationState: {
      get() {
        return this.$store.getters.getNotificationState
      },
      set(value) {
        this.$store.commit('setNotificationState', value)
      }
    },
    getNotificationTimeout() {
      return this.$store.getters.getNotificationTimeout
    },
  },
  methods: {
  },
}
</script>

<style lang="less">
  .v-snack--bottom {
    bottom: 30px !important;
  }
  .v-snack--right {
    right: 30px !important;
  }
</style>