import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import vuescroll from 'vuescroll'

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
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')


function stopMiddleClick (event) {
  event.preventDefault()
}
document.addEventListener('auxclick', stopMiddleClick, false)