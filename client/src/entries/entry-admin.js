/**
 * Created by bangbang93 on 2017/8/25.
 */
'use strict'
import Vue from 'vue'
import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from '../pages/admin/index.vue'
import VueRouter from 'vue-router'
import VueFetch from 'vue-fetch'
import router from '../router/admin'
import Vuex from 'vuex'
import 'font-awesome/scss/font-awesome.scss'
import * as es6Promise from 'es6-promise'

es6Promise.polyfill()

Vue.use(Element)
Vue.use(VueRouter)
Vue.use(VueFetch)
Vue.use(Vuex)

// const store = createStore()

// sync(store, router)

export const app = new Vue({
  router,
  // store,
  render: (h) => h(App),
}).$mount('app')
