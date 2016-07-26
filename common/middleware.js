/**
 * 允许跨域;访问
 * @param next
 */

exports.allow = function *(next) {

  this.set("Access-Control-Allow-Origin", "*");
  this.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  this.set("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  this.set("X-Powered-By", ' 3.2.1');

  yield next
};

/**
 * 异常处理
 */

exports.err = function *() {
  var ctx = this;
  ctx.body = {
    isOk: false,
    desc: ctx.desc || 'API异常, 请检查服务器'
  };
};