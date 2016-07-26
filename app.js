var koa = require('koa');
var serve = require('koa-static');
var views = require('koa-views');
var bodyParser = require('koa-bodyparser');
var midd = require('./common/middleware');
var config = require('./config');
var apiRouter  = require('./api_router').router;
var appRouter = require('./web_router').router;
var app = module.exports = koa();

app
  .use(views('views', {map: {html: 'swig'}}))
  .use(midd.allow)
  .use(serve(__dirname + '/public'))
  .use(serve(__dirname + '/bower_components'))
  .use(serve(config.uploadDir))
  .use(bodyParser())
  .use(appRouter.routes())
  .use(apiRouter.routes())
  .use(appRouter.allowedMethods())
  .use(apiRouter.allowedMethods());

if (!module.parent) {
  app.listen(config.port);
}