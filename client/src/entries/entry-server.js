/**
 * Created by bangbang93 on 2017/8/25.
 */
'use strict'
import {createApp} from './index'

export default async (context) => {
  return new Promise((resolve, reject) => {
    const {app, router, store} = createApp()
    router.push(context.url)

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      if (!matchedComponents.length) {
        const error = new Error('no such route')
        error.code = 404
        return reject(error)
      }
      Promise.all(matchedComponents.map((Component) => {
        if (!Component) return Promise.resolve()
        if (Component.asyncData) {
          store.commit('setOrigin', context.origin)
          store.commit('setReferer', context.referer)
          return Component.asyncData({
            store,
            route: router.currentRoute,
          })
        }
        return null
      }))
        .then(() => {
          context.state = store.state
          if (router.currentRoute.meta.status) {
            context.status = router.currentRoute.meta.status
          }
          resolve(app)
        })
        .catch(reject)
    })
  })
}
