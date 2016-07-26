'use strict';

var _ = require('lodash');

/**
 * 将callback模式转换成promise模式
 * 这里有一个约定: callback模式下 回调参数只能有2个参数 第一个为err 第二个为实际对象
 * sum: 求和函数
 * sum(1, 2, 3, function(err, data){ console.log(data) }) => 6
 * cp(sum, 1, 2, 3).then(function(data){ console.log(data) }) => 6
 * @returns {Promise}
 */

module.exports = function () {
  var fn      = arguments[0];
  var args    = _.toArray(arguments).slice(1);
  return new Promise(function (resolve, reject) {

    function callback(err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    }

    args.push(callback);

    fn.apply(null, args);
  });
};