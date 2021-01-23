import Vue from 'vue'
import store from './store/player'
import vuetify from './plugins/vuetify'
import vuescroll from 'vuescroll'
import Player from './Player.vue'

Vue.use(vuescroll, {
  ops: {
    rail: {
      size: '12px',
      specifyBorderRadius: '0',
      gutterOfEnds: '0',
      gutterOfSide: '0',
    },
    bar: {
      background: '#555',
      opacity: 0.6,
      minSize: 0.2,
      size: '12px',
    }
  }
})
Vue.config.productionTip = false

new Vue({
  store,
  vuetify,
  render: h => h(Player)
}).$mount('#player')


function stopMiddleClick (event) {
  event.preventDefault()
}
document.addEventListener('auxclick', stopMiddleClick, false)