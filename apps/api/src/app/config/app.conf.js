module.exports = {
  PORT:         process.env.PORT         || 3001,
  NODE_ENV:     process.env.NODE_ENV     || 'development',
  CLIENT_URL:   process.env.CLIENT_URL   || 'http://localhost:5173',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
};
