# FREYJA

[![Greenkeeper badge](https://badges.greenkeeper.io/bangbang93/freyja.svg)](https://greenkeeper.io/)

freyja是一个轻量级的blog系统，使用vue-ssr，首屏在服务端渲染，之后的所有请求都由浏览器自行路由。

文章页只有文章内容在服务端渲染，评论是浏览器ajax加载的。

配合http2多路复用，首屏渲染完成时间可以控制在300ms以内（公网环境下，网络延迟约30ms），