<template>
  <div>
    <v-dialog v-model="dialogHeaderGradient" width="680" scrollable persistent>
      <v-card>
        <v-toolbar :style="{background: gradient}" :dark="themeDark" :light="!themeDark">
          <div class="headline">Gradient for dark theme</div>
          <v-spacer></v-spacer>
          <v-btn @click="close" class="mx-4" outlined> <v-icon left>mdi-close</v-icon> close </v-btn>
          <v-btn @click="saveHeaderGradient" outlined> <v-icon left>mdi-content-save</v-icon> Save </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text>
            <draggable v-model="colors" v-bind="dragOptions">
              <transition-group>
                <div v-for="(color,index) in colors" :key="color.id" class="d-flex justify-center align-center mb-4">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <v-btn v-on="on" icon class="mr-4"> <v-icon>mdi-drag</v-icon> </v-btn>
                    </template>
                    <span>Drag to change order</span>
                  </v-tooltip>
                  <v-btn @click="openDialogPalette(index)" :color="color.hex" outlined rounded width="80%">
                    <v-icon left>mdi-palette</v-icon> change color </v-btn>
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <v-btn v-on="on" @click="lockColor(index)" fab small class="ml-4">
                        <v-icon v-if="color.disabled" size="20">mdi-lock</v-icon>
                        <v-icon v-else size="20">mdi-lock-open-variant</v-icon>
                      </v-btn>
                    </template>
                    <span>Exclude from color randomization</span>
                  </v-tooltip>
                </div>
              </transition-group>
            </draggable>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn @click="addColor" class="ml-4" fab small>
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <transition name="fade">
            <v-btn @click="removeColor" v-if="colors.length > 2" fab small>
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </transition>
          <v-spacer></v-spacer>
          <v-btn @click="generateGradient" class="ma-4" >
            <v-icon left>mdi-dice-5</v-icon> Random
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogPalette" width="300"> 
      <v-card>
        <v-toolbar color="primary">
          <v-btn @click="applyColor" outlined block><v-icon left>mdi-check</v-icon> apply color</v-btn>
        </v-toolbar>
        <v-color-picker @update:color="changeColor($event)" :value="palette" hide-inputs/> 
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import draggable from "vuedraggable"

export default {
  name: 'HeaderGradient',
  props: {
    themeDark: Boolean,
  },
  components: { vuescroll, draggable },
  mounted() {
    this.$nextTick(function () {
      this.dialogHeaderGradient = true
      this.initColors() 
    })
  },
  data: () => ({
    dialogHeaderGradient: false,
    dialogPalette: false,
    colors: [],
    palette: '#435121',
    colorIndex: 0,
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
  }),
  computed: {
    gradient() {
      let colors = "linear-gradient(to right"
      this.colors.forEach(function(e) {
        colors += "," + e.hex
      })
      colors += ")"
      return colors
    },
    savedGradient() {
      return this.themeDark === true
        ? this.$store.state.Settings.headerGradientDark
        : this.$store.state.Settings.headerGradientLight
    },
  },
  methods: {
    initColors() {
      let colors = this.savedGradient.replace('linear-gradient(to right,','').replace(')','').split(',') 
      for (let color of colors) this.colors.push({ id: shortid.generate(), hex: color, disabled: false })
    },
    openDialogPalette(index) {
      this.dialogPalette = true 
      this.colorIndex = index
      this.palette = this.colors[index].hex
    },
    changeColor(e) { this.palette = e.hex },
    applyColor() {
      this.colors[this.colorIndex].hex = this.palette
      this.dialogPalette = false
    },
    addColor() { this.colors.push({ id: shortid.generate(), hex: this.randomHex(), disabled: false }) },
    removeColor() { if (this.colors[this.colors.length - 1].disabled == false) if (this.colors.length > 2) this.colors.pop() },
    generateGradient() { for (let i = 0; i < this.colors.length; i++) if (this.colors[i].disabled === false) this.colors[i].hex = this.randomHex() },
    lockColor(index) { this.colors[index].disabled === true ? (this.colors[index].disabled = false) : (this.colors[index].disabled = true) },
    randomHex() { return ( "#" + Math.random() .toString(16) .slice(2, 8) ) },
    close() { this.$emit('close') },
    saveHeaderGradient() {
      let values = {
        gradient: this.gradient,
        themeDark: this.themeDark,
      } 
      this.$store.dispatch('saveHeaderGradient', values)
      this.close()
    },
  },
}
</script>