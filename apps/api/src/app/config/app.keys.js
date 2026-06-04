module.exports = {
  JWT_ACCESS_SECRET:  process.env.JWT_ACCESS_SECRET  || 'changeme-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'changeme-refresh-secret',
  QR_HMAC_SECRET:     process.env.QR_HMAC_SECRET     || 'changeme-qr-secret',
  JWT_ACCESS_EXPIRY:  '15m',
  JWT_REFRESH_EXPIRY: '7d',
  QR_TTL_SECONDS:     300,
  COOKIE_NAME:        'tcos_refresh',
  BCRYPT_ROUNDS:      12,
};
