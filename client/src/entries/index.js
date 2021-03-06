/**
 * Created by bangbang93 on 16/9/30.
 */
'use strict'
import Vue from 'vue'
import App from '../pages/index.vue'
import VueRouter from 'vue-router'
import VueFetch from 'vue-fetch'
import {createRouter} from '../router/index'
import {createStore} from '../store/index'
import filters from '../filters/index'
import Vuex from 'vuex'
import {sync} from 'vuex-router-sync'
import '../scss/style.scss'
import 'font-awesome/scss/font-awesome.scss'
import * as es6Promise from 'es6-promise'

es6Promise.polyfill()

Vue.use(VueRouter)
Vue.use(VueFetch)
Vue.use(Vuex)

Vue.mixin({
  filters,
})

export function createApp() {
  const router = createRouter()
  const store = createStore()
  sync(store, router)

  const app = new Vue({
    router,
    store,
    render: (h) => h(App),
  })
  return {app, router, store}
}
