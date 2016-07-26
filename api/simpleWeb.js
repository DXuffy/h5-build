// 简单的web控制器

var _                 = require('lodash');
var fs                = require('fs');
var parse             = require('co-busboy');
var path              = require('path');
var moment            = require('moment');
var mkdir             = require('mkdir-p');
var format            = require('format');
var shell             = require('shelljs');
var config            = require('../config');
var cp                = require('../common/cp');
var swig              = require('swig');
var hasha = require('hasha');
var guid = require('guid');

// 页面模版
var simpleWebTpl = swig.compileFile('./tpls/simpleWeb.html');

/**
 * 创建web
 */

exports.creat = function *(next){
  var ctx   = this;
  var parts = parse(ctx, {autoFields: true});
  var now   = moment().format('YYYY/MM/DD');
  var part, uploadedFilePath, convertFilePath, fileType, fileName;

  var uploadDir = path.join(config.uploadDir + now);

  // 创建文件夹 日期分类

  if (!fs.existsSync(uploadDir)) {
    try {
      yield cp(mkdir, uploadDir);
    } catch (err) {
      ctx.err = err;
      return yield next;
    }
  }

  // 创建转换文件夹

  if (!fs.existsSync(config.convertDir)) {
    try {
      yield cp(mkdir, config.convertDir);
    } catch (err) {
      ctx.err = err;
      return yield next;
    }
  }

  try {
    while (part = yield parts) {
      fileType = part.filename.split('.')[1].toLowerCase();
      fileName = guid.raw() + '.' + fileType;

      uploadedFilePath = decodeURIComponent(path.join(uploadDir, fileName));

      part.pipe(fs.createWriteStream(uploadedFilePath));  
    }

    convertFilePath = decodeURIComponent(path.join(config.convertDir, 'image.' + parts.field.convertType));

     // 开始操作
    yield convertImg(uploadedFilePath, convertFilePath, parts.field);
    
    compressImg(parts.field);

    var links = getLinks();
    
    var fileContent = initWebFile(links, parts.field);

    var lastFileName = yield addSVN(fileContent, parts.field);

    finish([config.convertDir, uploadedFilePath]);

    if(parts.field.isTempTime){
      lastFileName = path.join('temp', lastFileName);
    }else{
      lastFileName = path.join('long', lastFileName);
    }

    var url = path.join(config.svnProjectDir.singlePage, lastFileName);

    // 操作完成

    ctx.body = {
      isOk: true,
      desc: '上传成功',
      data: {
        fileName: lastFileName,
        proURL: 'https://h5.inkey.com/' + url
      }
    };
  } catch (err) {
    ctx.desc = err;
    return yield next;
  }
  
}

/**
 * 分割图片
 */

function* convertImg(uploadedFilePath, convertFilePath, field){
  // 切图个数计算
  var crop = '100%x' + 100 / field.sum + '%';
  // 获取上传的文件类型
  var fileType = uploadedFilePath.split('.')[1].toLowerCase();
  var convertPSD = format('convert -strip +profile "*" -layers flatten "%s[0]" %s', uploadedFilePath, convertFilePath);
  var convertPosition = 'convert -strip +profile "*" +repage -crop 100%x100%+' + field.position;
  var convertSplit = format('convert -strip +repage -crop %s -quality %s %s %s', crop, field.quality, convertFilePath, convertFilePath);
  
  if(fileType === 'psd'){
    shell.exec(convertPSD);
    convertPosition = convertPosition + ' ' + convertFilePath + ' ' + convertFilePath;
  }else{
    convertPosition = convertPosition + ' ' + uploadedFilePath + ' ' + convertFilePath;
  }

  // 读一次文件防止失败
  yield cp(fs.readFile, uploadedFilePath);

  // 先从起始坐标切图
  shell.exec(convertPosition);

  // 批量切图
  shell.exec(convertSplit);
  
  // 删除原图
  shell.rm('-rf', convertFilePath);
}

/**
 * 图片处理
 * 上传运维平台
 */

function compressImg(field){
  shell.cd(config.convertDir);

  // 在线压缩

  // shell.exec('spider tinypng .');

  // 上传到运维平台
  if(field.isHost){
    shell.exec('spider platform-upload . -h ' + field.host);
  }else{
    shell.exec('spider platform-upload .');
  }
}

/**
 * 获取图片链接
 */

function getLinks(){
  var file = fs.readFileSync(path.join(config.convertDir, 'link.txt'), 'utf-8');

  file = file.split('\n');

  if(_.isEmpty(file[file.length - 1])){
    // 如果最后一个为空, 移除
    file.pop();
  }

  file = _.map(file, function(value){
    return value.split(' => ')[1];
  });

  return file;
}

/**
 * 初始化页面文件
 */

function initWebFile(imgLinks, field){
  var output = simpleWebTpl({
    imgLinks: imgLinks,
    pageTitle: field.pageTitle,
    pagePV: field.pagePV
  });

  return output;
}

/**
 * 生成文件并添加到svn
 */

function* addSVN(fileContent, field){
  var projectDir = path.join(config.svnRootDir, config.svnProjectDir.singlePage);
  var fileName, id;

  return new Promise(function(res, rej){
    // 判断文件夹是否存在
    if (!fs.existsSync(projectDir)) {
      return rej();
    }

    // 判断是否是svn项目
    // if (!fs.existsSync(path.join(config.svnRootDir, '.svn'))) {
    //   return rej();
    // }

    // 生成随机文件名(随机值_日期) 
    var id = hasha(fileContent).substr(0, config.fileNameLen);

    if(field.endTime){
      id = id + '-' + field.endTime + '.html';
    }else{
      id = id + '.html';
    }

    // 选择生成在哪个目录
    if(field.isTempTime){
      projectDir = path.join(projectDir, 'temp');
    }else{
      projectDir = path.join(projectDir, 'long');
    }

    fileName = path.join(projectDir, id);

    // 更新svn 
    shell.cd(config.svnRootDir);

    shell.exec('svn update .');

    // 写入文件
    fs.writeFileSync(fileName, fileContent);

    shell.cd(projectDir);
    
    // 提交文件
    shell.exec('svn add * --force');
    shell.exec('svn commit -m "来自 h5-build 的提交"');

    res(id);

  });

}

function finish(dirs){
  // 切换一下当前命令行路径, 因为下面要删除该目录
  shell.cd();
  shell.rm('-rf', dirs);
}
