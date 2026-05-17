const AppConf = require('../config/app.conf');

class Logger {
  static _timestamp() {
    return new Date().toISOString();
  }

  static info(msg) {
    console.log(`[${Logger._timestamp()}] [INFO]  ${msg}`);
  }

  static warn(msg) {
    console.warn(`[${Logger._timestamp()}] [WARN]  ${msg}`);
  }

  static error(msg) {
    console.error(`[${Logger._timestamp()}] [ERROR] ${msg}`);
  }

  static debug(msg) {
    if (AppConf.NODE_ENV === 'development') {
      console.debug(`[${Logger._timestamp()}] [DEBUG] ${msg}`);
    }
  }
}

module.exports = Logger;
