'use strict';
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { createBundleRenderer } = require('vue-server-renderer')
const fs = require('fs')

const app = express();
app.set('trust proxy', 'loopback');

if (app.get('env') === 'development'){
  app.use(logger('dev'));
} else {
  app.use(logger('combined'));
}

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(cookieParser());
app.use(session(Object.assign({
    store: new RedisStore({
      prefix: 'freyja:session:'
    })
  }, require('./config').session)
));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', require('./route/index'));

require('express-simple-route')(path.join(__dirname, 'route'), app)
app.use(express.static(path.join(__dirname, 'public')));


const template = fs.readFileSync(path.join(__dirname, './client/src/html/index.html'), 'utf-8')
function createRenderer (bundle, options) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return createBundleRenderer(bundle, Object.assign(options, {
    template,
    // for component caching
    // cache: LRU({
    //   max: 1000,
    //   maxAge: 1000 * 60 * 15
    // }),
    // recommended for performance
    runInNewContext: false
  }))
}

let renderer
let renderPromise
if (app.get('env') === 'production') {
  // In production: create server renderer using built server bundle.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const bundle = require('./client/dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('./client/dist/vue-ssr-client-manifest.json')
  renderer = createRenderer(bundle, {
    clientManifest
  })
  renderer = require('./middleware/server-render')(renderer)
  app.get('*', function (req, res, next) {
    renderer(req, res, next)
  })
} else {
  renderPromise = require('./setup-dev-server')(app, (bundle, options) => {
    renderer = createRenderer(bundle, options)
    renderer = require('./middleware/server-render')(renderer)
  })
  app.get('*', function (req, res, next) {
    console.log('server-render')
    if (renderPromise && renderPromise.isFulfilled) {
      renderer(req, res, next)
    } else {
      renderPromise.then(() => {
        renderer(req, res, next)
      })
    }
  })
}

app.use(express.static(path.join(__dirname, 'client/dist')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).json({
    message: 'not found'
  })
});

// error handler
if (app.get('env') === 'development'){
  app.use(function (err, req, res, next) {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({
      message: err.message,
      err,
    })
  })
} else {
  app.use(function(err, req, res, next) {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({
      message: err.message,
    })
  });
}

module.exports = app;
