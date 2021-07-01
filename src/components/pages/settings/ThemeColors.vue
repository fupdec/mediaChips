<template> 
  <v-container class="px-0 pt-0">
    <v-dialog v-model="dialogPalette" width="300"> 
      <v-card>
        <v-toolbar color="primary">
          <v-btn @click="applyColor" outlined block><v-icon left>mdi-check</v-icon> apply color</v-btn>
        </v-toolbar>
        <v-color-picker @update:color="changeColor($event)" :value="palette" hide-inputs/> 
      </v-card>
    </v-dialog>

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

      <v-col cols="12" sm="6" v-else>
        <div class="mb-2">Color for header (light theme):</div>
        <v-btn @click="openDialogPalette('appColorLightHeader')" light rounded :color="appColorLightHeader">
          <v-icon left>mdi-palette</v-icon> Change header color</v-btn>
      </v-col>

      <v-col cols="12" sm="6" v-if="headerGradient">
        <div class="mb-2">Colors for header gradient (dark theme):</div>
        <v-btn @click="openDialogHeaderGradientDark" dark rounded depressed :style="{background: this.$store.state.Settings.headerGradientDark}">
          <v-icon left>mdi-palette</v-icon> Change header color 
        </v-btn>
      </v-col>

      <v-col cols="12" sm="6" v-else>
        <div class="mb-2">Color for header (dark theme):</div>
        <v-btn @click="openDialogPalette('appColorDarkHeader')" dark rounded :color="appColorDarkHeader">
          <v-icon left>mdi-palette</v-icon> Change header color</v-btn>
      </v-col>
    </v-row>
    <v-divider class="my-4"></v-divider>
    <v-row>
      <v-col cols="12" sm="6">
        <div class="subtitle">Light theme colors:</div>
        <v-btn @click="openDialogPalette('appColorLightPrimary')" light rounded class="ma-2" depressed :color="appColorLightPrimary">
          <v-icon left>mdi-palette</v-icon> Primary</v-btn>
        <v-btn @click="openDialogPalette('appColorLightSecondary')" light rounded class="ma-2" depressed :color="appColorLightSecondary">
          <v-icon left>mdi-palette</v-icon> Secondary</v-btn>
        <v-btn @click="openDialogPalette('appColorLightAccent')" light rounded class="ma-2" depressed :color="appColorLightAccent">
          <v-icon left>mdi-palette</v-icon> Accent</v-btn>
      </v-col>
      <v-col cols="12" sm="6">
        <div class="subtitle">Dark theme colors:</div>
        <v-btn @click="openDialogPalette('appColorDarkPrimary')" dark rounded class="ma-2" depressed :color="appColorDarkPrimary">
          <v-icon left>mdi-palette</v-icon> Primary</v-btn>
        <v-btn @click="openDialogPalette('appColorDarkSecondary')" dark rounded class="ma-2" depressed :color="appColorDarkSecondary">
          <v-icon left>mdi-palette</v-icon> Secondary</v-btn>
        <v-btn @click="openDialogPalette('appColorDarkAccent')" dark rounded class="ma-2" depressed :color="appColorDarkAccent">
          <v-icon left>mdi-palette</v-icon> Accent</v-btn>
      </v-col>
    </v-row>

    <HeaderGradient v-if="dialogHeaderGradient" :themeDark="gradientThemeDark" @close="dialogHeaderGradient=false"/>

    <v-divider class="my-4"></v-divider>
    <div class="d-flex">
      <span class="mr-6">Color scroll bar:</span>
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
    dialogHeaderGradient: false,
    dialogPalette: false,
    gradientThemeDark: null,
    palette: '#777777',
    colorType: null,
  }),
  computed: {
    headerGradient: {
      get() {return this.$store.state.Settings.headerGradient},
      set(value) {this.$store.dispatch('updateSettingsState', {key:'headerGradient', value})},
    },
    appColorLightPrimary: {
      get() { return this.$store.state.Settings.appColorLightPrimary },
      set(color) {
        const values = { key: 'appColorLightPrimary', color: color, theme: 'light', type: 'primary', }
        this.$store.dispatch('updateVuetifyColor', values)
      },
    },
    appColorLightSecondary: {
      get() { return this.$store.state.Settings.appColorLightSecondary },
      set(color) {
        const values = { key: 'appColorLightSecondary', color: color, theme: 'light', type: 'secondary', }
        this.$store.dispatch('updateVuetifyColor', values)
      },
    },
    appColorLightAccent: {
      get() { return this.$store.state.Settings.appColorLightAccent },
      set(color) {
        const values = { key: 'appColorLightAccent', color: color, theme: 'light', type: 'accent', }
        this.$store.dispatch('updateVuetifyColor', values)
      },
    },
    appColorLightHeader: {
      get() { return this.$store.state.Settings.appColorLightHeader },
      set(color) { this.$store.dispatch('updateSettingsState', {key:'appColorLightHeader', value:color}) },
    },
    appColorDarkPrimary: {
      get() { return this.$store.state.Settings.appColorDarkPrimary },
      set(color) {
        const values = { key: 'appColorDarkPrimary', color: color, theme: 'dark', type: 'primary', }
        this.$store.dispatch('updateVuetifyColor', values)
      },
    },
    appColorDarkSecondary: {
      get() { return this.$store.state.Settings.appColorDarkSecondary },
      set(color) {
        const values = { key: 'appColorDarkSecondary', color: color, theme: 'dark', type: 'secondary', }
        this.$store.dispatch('updateVuetifyColor', values)
      },
    },
    appColorDarkAccent: {
      get() { return this.$store.state.Settings.appColorDarkAccent },
      set(color) {
        const values = { key: 'appColorDarkAccent', color: color, theme: 'dark', type: 'accent', }
        this.$store.dispatch('updateVuetifyColor', values)
      },
    },
    appColorDarkHeader: {
      get() { return this.$store.state.Settings.appColorDarkHeader },
      set(color) { this.$store.dispatch('updateSettingsState', {key:'appColorDarkHeader', value:color}) },
    },
    colorScroll: {
      get() { return this.$store.state.Settings.colorScroll },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'colorScroll', value}) },
    },
  },
  methods: {
    openDialogPalette(colorType) {
      this.dialogPalette = true 
      this.colorType = colorType
      this.palette = this[colorType]
    },
    changeColor(e) { this.palette = e.hex },
    applyColor() {
      this[this.colorType] = this.palette
      this.dialogPalette = false
    },
    openDialogHeaderGradientLight() {
      this.gradientThemeDark = false
      this.dialogHeaderGradient = true
    },
    openDialogHeaderGradientDark() {
      this.gradientThemeDark = true
      this.dialogHeaderGradient = true
    },
  },
}
</script>