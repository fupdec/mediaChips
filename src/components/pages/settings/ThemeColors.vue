<template> 
  <v-container class="px-0 pt-0">
    <v-row>
      <v-col cols="12">
        <div class="d-flex">
          <span class="mr-6">Use header gradient:</span>
          <v-switch v-model="headerGradient" inset hide-details class="d-inline-flex mt-0 pt-0">
            <template v-slot:label>
              <span v-if="headerGradient">Yes</span>
              <span v-else>No</span>
            </template>
          </v-switch>
        </div>
      </v-col>
      <v-col cols="12" sm="6" v-if="headerGradient">
        <div class="mb-2">Colors for header gradient (light theme):</div>
        <v-btn @click="openDialogHeaderGradientLight" light rounded depressed :style="{background: this.$store.state.Settings.headerGradientLight}">
          <v-icon left>mdi-palette</v-icon> Change header color </v-btn> 
      </v-col>

      <!-- TODO create one dialog for all palletes -->
      
      <v-col cols="12" sm="6" v-else>
        <div class="mb-2">Color for header (light theme):</div>
        <v-btn @click.stop="dialogAppColorLightHeader = true" light rounded depressed :color="appColorLightHeader"> 
          <v-icon left>mdi-palette</v-icon> Change header color 
        </v-btn>
        <v-dialog v-model="dialogAppColorLightHeader" width="300">
          <v-color-picker v-model="appColorLightHeader"/>
        </v-dialog>
      </v-col>

      <v-col cols="12" sm="6" v-if="headerGradient">
        <div class="mb-2">Colors for header gradient (dark theme):</div>
        <v-btn @click="openDialogHeaderGradientDark" dark rounded depressed :style="{background: this.$store.state.Settings.headerGradientDark}">
          <v-icon left>mdi-palette</v-icon> Change header color 
        </v-btn>
      </v-col>

      <v-col cols="12" sm="6" v-else>
        <div class="mb-2">Color for header (dark theme):</div>
        <v-btn @click.stop="dialogAppColorDarkHeader = true" dark rounded depressed :color="appColorDarkHeader"> 
          <v-icon left>mdi-palette</v-icon> Change header color 
        </v-btn>
        <v-dialog v-model="dialogAppColorDarkHeader" width="300">
          <v-color-picker v-model="appColorDarkHeader"/>
        </v-dialog>
      </v-col>
    </v-row>
    <v-divider class="my-4"></v-divider>
    <v-row>
      <v-col cols="12" sm="6">
        <div class="subtitle">Light theme colors:</div>
        <v-btn light rounded
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

        <v-btn light rounded
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

        <v-btn light rounded
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
      </v-col>
      <v-col cols="12" sm="6">
        <div class="subtitle">Dark theme colors:</div>
        <v-btn dark rounded
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

        <v-btn dark rounded
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

        <v-btn dark rounded
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
      </v-col>
    </v-row>

    <HeaderGradient :themeDark="gradientThemeDark"/>

    <v-divider class="my-4"></v-divider>
    <div class="d-flex">
      <span class="mr-6">Color scroll:</span>
      <v-switch v-model="colorScroll" :label="colorScroll?'Yes':'No'" inset hide-details class="d-inline-flex mt-0 pt-0"/>
    </div>
  </v-container>
</template>


<script>
import HeaderGradient from '@/components/pages/settings/HeaderGradient.vue'

export default {
  name: 'ThemeColors',
  components: {
    HeaderGradient,
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
    gradientThemeDark: null,
  }),
  computed: {
    headerGradient: {
      get() {return this.$store.state.Settings.headerGradient},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'headerGradient', value})},
    },
    appColorLightPrimary: {
      get() {
        return this.$store.state.Settings.appColorLightPrimary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          const values = {
            key: 'appColorLightPrimary',
            color: color,
            theme: 'light',
            type: 'primary',
          }
          this.$store.dispatch('updateVuetifyColor', values)
        }, 500)
      },
    },
    appColorLightSecondary: {
      get() {
        return this.$store.state.Settings.appColorLightSecondary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          const values = {
            key: 'appColorLightSecondary',
            color: color,
            theme: 'light',
            type: 'secondary',
          }
          this.$store.dispatch('updateVuetifyColor', values)
        }, 500)
      },
    },
    appColorLightAccent: {
      get() {
        return this.$store.state.Settings.appColorLightAccent
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          const values = {
            key: 'appColorLightAccent',
            color: color,
            theme: 'light',
            type: 'accent',
          }
          this.$store.dispatch('updateVuetifyColor', values)
        }, 500)
      },
    },
    appColorLightHeader: {
      get() {
        return this.$store.state.Settings.appColorLightHeader
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'appColorLightHeader', value:color})
        }, 500)
      },
    },
    appColorDarkPrimary: {
      get() {
        return this.$store.state.Settings.appColorDarkPrimary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          const values = {
            key: 'appColorDarkPrimary',
            color: color,
            theme: 'dark',
            type: 'primary',
          }
          this.$store.dispatch('updateVuetifyColor', values)
        }, 500)
      },
    },
    appColorDarkSecondary: {
      get() {
        return this.$store.state.Settings.appColorDarkSecondary
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          const values = {
            key: 'appColorDarkSecondary',
            color: color,
            theme: 'dark',
            type: 'secondary',
          }
          this.$store.dispatch('updateVuetifyColor', values)
        }, 500)
      },
    },
    appColorDarkAccent: {
      get() {
        return this.$store.state.Settings.appColorDarkAccent
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          const values = {
            key: 'appColorDarkAccent',
            color: color,
            theme: 'dark',
            type: 'accent',
          }
          this.$store.dispatch('updateVuetifyColor', values)
        }, 500)
      },
    },
    appColorDarkHeader: {
      get() {
        return this.$store.state.Settings.appColorDarkHeader
      },
      set(color) {
        if(typeof window.LIT !== 'undefined')clearTimeout(window.LIT)
        window.LIT = setTimeout(() => {
          this.$store.dispatch('updateSettingsState', {key:'appColorDarkHeader', value:color})
        }, 500)
      },
    },
    colorScroll: {
      get() { return this.$store.state.Settings.colorScroll },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'colorScroll', value}) },
    },
  },
  methods: {
    openDialogHeaderGradientLight() {
      this.gradientThemeDark = false
      this.$store.state.Settings.dialogHeaderGradient = true
    },
    openDialogHeaderGradientDark() {
      this.gradientThemeDark = true
      this.$store.state.Settings.dialogHeaderGradient = true
    },
  },
}
</script>