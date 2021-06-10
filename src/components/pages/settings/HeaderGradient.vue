<template> 
  <v-dialog v-model="$store.state.Settings.dialogHeaderGradient" width="680" scrollable persistent>
    <v-card>
      <v-toolbar :style="{background: gradient}">
        <div class="headline">Gradient for dark theme</div>
        <v-spacer></v-spacer>
        <v-btn @click="$store.state.Settings.dialogHeaderGradient=false" 
          class="mx-4" outlined>
          <v-icon left>mdi-close</v-icon> close </v-btn>
        <v-btn @click="saveHeaderGradient" outlined>
          <v-icon left>mdi-content-save</v-icon> Save </v-btn>
      </v-toolbar>
      <vuescroll>
        <v-card-text class="px-10">
          <transition-group name="flip-list">
            <div v-for="(color,index) in colors" :key="color.id" class="pick">
              <div class="move">
                <v-btn @click="up(index)" v-if="index>0" icon small>
                  <v-icon>mdi-arrow-up</v-icon>
                </v-btn>
                <v-btn @click="down(index)" v-if="index<colors.length-1" icon small>
                  <v-icon>mdi-arrow-down</v-icon>
                </v-btn>
              </div>
              <v-text-field v-model.trim="color.hex" :disabled="color.disabled" 
                :color="color.hex" :style="{color: color.hex}" outlined solo rounded dense
                placeholder="Color" hide-details="" class="v-input--is-focused"/>
              <v-btn @click="lockColor(index)" fab small class="ml-4">
                <v-icon v-if="color.disabled">mdi-lock</v-icon>
                <v-icon v-else>mdi-lock-open-variant</v-icon>
              </v-btn>
            </div>
          </transition-group>
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
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'HeaderGradient',
  props: {
    themeDark: Boolean,
  },
  components: {
    vuescroll,
	},
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    colors: [
      { id: 0, hex: "#f12711", disabled: false },
      { id: 1, hex: "#f5af19", disabled: false }
    ],
    id: 2
  }),
  computed: {
    gradient() {
      let colors = "linear-gradient(to right"
      this.colors.forEach(function(e) {
        colors += "," + e.hex
      })
      colors += ")"
      return colors
    }
  },
  methods: {
    addColor() {
      this.colors.push({ id: this.id, hex: this.randomHex(), disabled: false })
      this.id++
    },
    removeColor() {
      if (this.colors[this.colors.length - 1].disabled == false) {
        if (this.colors.length > 2) {
          this.colors.pop()
        }
      }
    },
    generateGradient() {
      for (let i = 0; i < this.colors.length; i++) {
        if (this.colors[i].disabled === false)
          this.colors[i].hex = this.randomHex()
      }
    },
    lockColor(index) {
      this.colors[index].disabled === true
        ? (this.colors[index].disabled = false)
        : (this.colors[index].disabled = true)
    },
    randomHex() {
      return (
        "#" +
        Math.random()
          .toString(16)
          .slice(2, 8)
      )
    },
    up(index) {
      if (index > 0) {
        let temp = this.colors[index]
        this.$set(this.colors, index, this.colors[index - 1])
        this.$set(this.colors, index - 1, temp)
      }
    },
    down(index) {
      if (index < this.colors.length - 1) {
        let temp = this.colors[index]
        this.$set(this.colors, index, this.colors[index + 1])
        this.$set(this.colors, index + 1, temp)
      }
    },
    saveHeaderGradient() {
      let values = {
        gradient: this.gradient,
        themeDark: this.themeDark,
      } 
      this.$store.dispatch('saveHeaderGradient', values)
      this.$store.state.Settings.dialogHeaderGradient = false
    },
  },
}
</script>

<style lang="less">
.pick {
  input {
    color: inherit !important;
    text-align: center;
  }
}
</style>
<style lang="less" scoped>
.pick {
  margin: 10px;
  display: flex;
  align-items: center;
  position: relative;
  &:hover {
    .move {
      opacity: 1;
    }
  }
}
.move {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 10px;
  height: 100%;
  opacity: 0;
  transition: opacity 0.25s;
}
.flip-list-move {
  transition: transform 0.25s;
}
.flip-list-leave-active {
  position: absolute;
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>