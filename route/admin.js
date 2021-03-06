/**
 * Created by bangbang93 on 2017/9/3.
 */
'use strict'
/* eslint-disable @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
const router = require('express-promise-router')()
const history = require('connect-history-api-fallback')


let _hash;
(async () => {
  const path = require('path')
  const fs = require('fs-extra')
  const files = await fs.readdir(path.join(__dirname, '../client/dist/admin/js/hljs'))
  let match
  for (const file of files) {
    match = file.match(/hljs\.\w+\.(\w+)\.js/i)
    if (match) {
      break
    }
  }
  _hash = match[1]
})()


router.get('/login', (req, res) => {
  res.redirect('/admin/login.html')
})

router.use((req, res, next) => {
  if (req.url === '/login.html' || req.url.match(/\.(js|css)$/)) {
    return next()
  }
  if (!req.session.user) {
    return res.redirect('/admin/login.html')
  }
  next()
})


router.get('/:type/js/hljs.:lang.js', (req, res) => {
  const lang = req.params.lang
  const hash = req.app.get('bundleHash') || _hash
  res.redirect(`/admin/js/hljs/hljs.${lang}.${hash}.js`)
})

router.get('/', (req, res) => {
  res.redirect('/admin/home')
})

router.use(history({
  verbose: true,
}))

module.exports = router
