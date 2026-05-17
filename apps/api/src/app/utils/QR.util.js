const crypto  = require('crypto');
const AppKeys = require('../config/app.keys');

class QRUtil {
  /**
   * Sign a QR payload.
   * Returns a compact token: base64url(payload_json) + '.' + hmac
   */
  static sign(userId) {
    const now     = Math.floor(Date.now() / 1000);
    const payload = { user_id: userId, iat: now, exp: now + AppKeys.QR_TTL_SECONDS };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig     = crypto.createHmac('sha256', AppKeys.QR_HMAC_SECRET).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  /**
   * Verify a QR token. Returns decoded payload or throws.
   */
  static verify(token) {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) throw Object.assign(new Error('Malformed QR token'), { statusCode: 422, code: 'INVALID_QR' });

    const expected = crypto.createHmac('sha256', AppKeys.QR_HMAC_SECRET).update(encoded).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      throw Object.assign(new Error('QR signature invalid'), { statusCode: 422, code: 'INVALID_QR' });
    }

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Math.floor(Date.now() / 1000) > payload.exp) {
      throw Object.assign(new Error('QR token expired'), { statusCode: 422, code: 'QR_EXPIRED' });
    }

    return payload;
  }
}

module.exports = QRUtil;
