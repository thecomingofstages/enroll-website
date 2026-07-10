const SlidingWindowRateLimiter = require('../utils/RateLimit.util');
const AppKeys = require('../config/app.keys');

const forgotPasswordLimiter = new SlidingWindowRateLimiter(
  AppKeys.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
  AppKeys.FORGOT_PASSWORD_RATE_LIMIT_MAX
);

function forgotPasswordRateLimit(req, res, next) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const key = `${ip}:${email || 'unknown'}`;

  if (!forgotPasswordLimiter.allow(key)) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many password reset requests. Please try again later.' },
    });
  }

  next();
}

module.exports = { forgotPasswordRateLimit };
