var config = {
  svnRootDir  : '/opt/svn',
  uploadDir   : '/opt/upload/',
  convertDir  : '/opt/upload/convertImg',
  port        : 7001,
  fileNameLen : 20,
  prefix      : {
    api : '/api'
  },
  svnProjectDir: {
    singlePage: 'singlePage'
  }
};

if ('test' === process.env.NODE_ENV) {
  config.svnRootDir = '/Users/chuangker/Documents/inkey/svn/Spider';
  config.uploadDir = '/Users/chuangker/Desktop/upload/';
  config.convertDir = '/Users/chuangker/Desktop/upload/convertImg';
  config.svnProjectDir.singlePage = 'static/singlePage';
}

module.exports = config;