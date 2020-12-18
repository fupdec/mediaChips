<template> 
  <v-container class="px-0">
    <v-row>
      <v-col cols="12" sm="6">
        <div class="subtitle">Light theme colors:</div>
        <v-btn light
          class="ma-2" depressed :color="appColorLightPrimary"
          @click.stop="dialogAppColorLightPrimary = true"
        >Primary</v-btn>
        <v-dialog
          v-model="dialogAppColorLightPrimary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightPrimary"
          ></v-color-picker>
        </v-dialog>

        <v-btn light
          class="ma-2" depressed :color="appColorLightSecondary"
          @click.stop="dialogAppColorLightSecondary = true"
        >Secondary</v-btn>
        <v-dialog
          v-model="dialogAppColorLightSecondary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightSecondary"
          ></v-color-picker>
        </v-dialog>

        <v-btn light
          class="ma-2" depressed :color="appColorLightAccent"
          @click.stop="dialogAppColorLightAccent = true"
        >Accent</v-btn>
        <v-dialog
          v-model="dialogAppColorLightAccent"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightAccent"
          ></v-color-picker>
        </v-dialog>

        <v-btn light
          class="ma-2" depressed :color="appColorLightHeader"
          @click.stop="dialogAppColorLightHeader = true"
        >Header</v-btn>
        <v-dialog
          v-model="dialogAppColorLightHeader"
          width="300"
        >
          <v-color-picker 
            v-model="appColorLightHeader"
          ></v-color-picker>
        </v-dialog>
      </v-col>
      <v-col cols="12" sm="6">
        <div class="subtitle">Dark theme colors:</div>
        <v-btn dark
          class="ma-2" depressed :color="appColorDarkPrimary"
          @click.stop="dialogAppColorDarkPrimary = true"
        >Primary</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkPrimary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkPrimary"
          ></v-color-picker>
        </v-dialog>

        <v-btn dark
          class="ma-2" depressed :color="appColorDarkSecondary"
          @click.stop="dialogAppColorDarkSecondary = true"
        >Secondary</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkSecondary"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkSecondary"
          ></v-color-picker>
        </v-dialog>

        <v-btn dark
          class="ma-2" depressed :color="appColorDarkAccent"
          @click.stop="dialogAppColorDarkAccent = true"
        >Accent</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkAccent"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkAccent"
          ></v-color-picker>
        </v-dialog>

        <v-btn dark
          class="ma-2" depressed :color="appColorDarkHeader"
          @click.stop="dialogAppColorDarkHeader = true"
        >Header</v-btn>
        <v-dialog
          v-model="dialogAppColorDarkHeader"
          width="300"
        >
          <v-color-picker 
            v-model="appColorDarkHeader"
          ></v-color-picker>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>

export default {
  name: 'ThemeColors',
  components: {
	},
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogAppColorLightPrimary: false,
    dialogAppColorLightSecondary: false,
    dialogAppColorLightAccent: false,
    dialogAppColorLightHeader: false,
    dialogAppColorDarkPrimary: false,
    dialogAppColorDarkSecondary: false,
    dialogAppColorDarkAccent: false,
    dialogAppColorDarkHeader: false,
  }),
  computed: {
    appColorLightPrimary: {
      get() {
        return this.$store.getters.appColorLightPrimary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightPrimary', color)
        }, 500)
      },
    },
    appColorLightSecondary: {
      get() {
        return this.$store.getters.appColorLightSecondary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightSecondary', color)
        }, 500)
      },
    },
    appColorLightAccent: {
      get() {
        return this.$store.getters.appColorLightAccent
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightAccent', color)
        }, 500)
      },
    },
    appColorLightHeader: {
      get() {
        return this.$store.getters.appColorLightHeader
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorLightHeader', color)
        }, 500)
      },
    },
    appColorDarkPrimary: {
      get() {
        return this.$store.getters.appColorDarkPrimary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkPrimary', color)
        }, 500)
      },
    },
    appColorDarkSecondary: {
      get() {
        return this.$store.getters.appColorDarkSecondary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkSecondary', color)
        }, 500)
      },
    },
    appColorDarkAccent: {
      get() {
        return this.$store.getters.appColorDarkAccent
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkAccent', color)
        }, 500)
      },
    },
    appColorDarkHeader: {
      get() {
        return this.$store.getters.appColorDarkHeader
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('changeAppColorDarkHeader', color)
        }, 500)
      },
    },
  },
}
</script>