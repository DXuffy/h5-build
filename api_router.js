var config          = require('./config');
var router          = require('koa-router');
var midd            = require('./common/middleware');
var simpleWeb = require('./api/simpleWeb');
var apiRouter       = new router({
  prefix: config.prefix.api
});

apiRouter.post('/simpleWeb/creat', simpleWeb.creat, midd.err);

exports.router = apiRouter;