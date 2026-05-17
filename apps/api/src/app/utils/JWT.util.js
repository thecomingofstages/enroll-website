const jwt     = require('jsonwebtoken');
const AppKeys = require('../config/app.keys');

class JWTUtil {
  static signAccess(payload) {
    return jwt.sign(payload, AppKeys.JWT_ACCESS_SECRET, {
      expiresIn: AppKeys.JWT_ACCESS_EXPIRY,
    });
  }

  static signRefresh(payload) {
    return jwt.sign(payload, AppKeys.JWT_REFRESH_SECRET, {
      expiresIn: AppKeys.JWT_REFRESH_EXPIRY,
    });
  }

  static verifyAccess(token) {
    return jwt.verify(token, AppKeys.JWT_ACCESS_SECRET);
  }

  static verifyRefresh(token) {
    return jwt.verify(token, AppKeys.JWT_REFRESH_SECRET);
  }
}

module.exports = JWTUtil;
