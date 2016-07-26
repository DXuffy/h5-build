var router = require('koa-router')();

router.get('/index', function *() {
  yield this.render('index');
});

exports.router = router;