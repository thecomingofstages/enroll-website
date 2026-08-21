module.exports = {
  PORT:         process.env.PORT         || 3001,
  NODE_ENV:     process.env.NODE_ENV     || 'development',
  CLIENT_URL:   process.env.CLIENT_URL   || 'http://localhost:5173',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  // Master switch — when true, /events/scan accepts bare UUID v7 strings in
  // addition to HMAC-signed QR tokens. Strict === 'true' so an unset or
  // typo'd env var stays off.
  ALLOW_RAW_UUID_SCAN: process.env.ALLOW_RAW_UUID_SCAN === 'true',
};
