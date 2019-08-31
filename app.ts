'use strict'
import * as bodyParser from 'body-parser'
import * as cacheControl from 'cache-control'
import * as connectRedis from 'connect-redis'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import * as session from 'express-session'
import * as fs from 'fs'
import * as helmet from 'helmet'
import * as logger from 'morgan'
import * as path from 'path'
import * as favicon from 'serve-favicon'
import {BundleRenderer, createBundleRenderer} from 'vue-server-renderer'
import * as Config from './config'
import {haruhiMiddleware} from './middleware/middlewares'
import serverRender from './middleware/server-render'

const app = express()
app.set('trust proxy', 'loopback')

if (app.get('env') === 'development') {
  app.use(logger('dev'))
} else {
  app.use(logger('combined'))
}
const RedisStore = connectRedis(session)

app.use(cookieParser())
app.use(session({store: new RedisStore({
  prefix: 'freyja:session:',
  ...Config.database.redis,
}),
...Config.session},))
app.use(haruhiMiddleware)

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(helmet())

// eslint-disable-next-line @typescript-eslint/no-require-imports
app.use('/', require('./route/index'))

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('express-simple-route')(path.join(__dirname, 'route'), app)
app.use(express.static(path.join(__dirname, 'public')))

const template = fs.readFileSync(path.join(__dirname, './client/src/html/index.html'), 'utf-8')
function createRenderer(bundle, options): BundleRenderer {
  return createBundleRenderer(bundle, {...options,
    template,
    runInNewContext: false})
}

/* eslint-disable @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
if (app.get('env') === 'production') {
  // In production: create server renderer using built server bundle.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const bundle = require('./client/dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('./client/dist/vue-ssr-client-manifest.json')
  const LRU = require('lru-cache')
  const renderer = createRenderer(bundle, {
    clientManifest,
    cache: new LRU({
      max: 10000,
    }),
  })
  app.use(cacheControl({
    '/': 3600,
    '/article/**': 3600,
  }))
  app.get('*', serverRender(renderer))

  app.use(express.static(path.join(__dirname, 'client/dist')))
} else {
  let renderer
  const renderPromise = require('./setup-dev-server')(app)
  renderPromise.then(({bundle, options}) => {
    renderer = serverRender(createRenderer(bundle, options))
  })
  app.get('*', (req, res, next) => {
    if (renderPromise && renderPromise.isFulfilled) {
      renderer(req, res, next)
    } else {
      renderPromise.then(() => {
        renderer(req, res, next)
      })
    }
  })
}
/* eslint-enable @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404)
    .json({
      message: 'not found',
    })
})

// error handler
if (app.get('env') !== 'production') {
  app.use((err, req, res, next) => {
    if (!err.status) {
      req.logger.fatal({err})
      err.status = 500
    }
    if (res.headersSent) return
    res.status(err.status)
      .json({
        err,
        message: err.message,
      })
  })
} else {
  if (Config.freyja.fundebug.enable) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
    const fundebug = require('fundebug-nodejs')
    fundebug.apikey = Config.freyja.fundebug.apikey
    app.use((err, req, res, next) => {
      res.status(500)
      next(err)
    })
    app.use(fundebug.ExpressErrorHandler)
  }
  app.use((err, req, res, next) => {
    if (!err.status) {
      req.logger.fatal({err})
      err.status = 500
    }
    if (res.headersSent) return
    res.status(err.status || 500)
      .json({
        message: err.message,
      })
  })
}

module.exports = app
