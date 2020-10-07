import 'lodash'
import Vue from 'vue'
import App from './App.vue'
import * as utils from './utils.js'

Vue.config.productionTip = false
Vue.mixin({methods: {...utils}})

new Vue({render: h => h(App)}).$mount('#app')