/**
 * Created by bangbang93 on 2017/8/25.
 */
'use strict';


module.exports = function (renderer) {
  return function render (req, res, next) {
    const s = Date.now()

    res.setHeader("Content-Type", "text/html")

    const handleError = err => {
      if (err.url) {
        res.redirect(err.url)
      } else if(err.code === 404) {
        next()
      } else {
        // Render Error Page or Redirect
        next(err)
      }
    }

    // const cacheable = isCacheable(req)
    // if (cacheable) {
    //   const hit = microCache.get(req.url)
    //   if (hit) {
    //     if (!isProd) {
    //       console.log(`cache hit!`)
    //     }
    //     return res.end(hit)
    //   }
    // }
    const origin = `http://localhost:${req.app.get('port')}`

    const context = {
      title: 'Vue HN 2.0', // default title
      url: req.url,
      origin,
    }
    console.log(context)
    renderer.renderToString(context, (err, html) => {
      if (err) {
        return handleError(err)
      }
      res.end(html)
      // if (cacheable) {
      //   microCache.set(req.url, html)
      // }
      if (!req.app.get('env') !== 'production') {
        console.log(`whole request: ${Date.now() - s}ms`)
      }
    })
  }
}
