const JWTUtil   = require('../utils/JWT.util');
const UserModel = require('../models/User.model');
const Logger    = require('../utils/Logger.util');

class AuthMiddleware {
  /** Bearer token required — 401 if missing/invalid */
  static async requireAuth(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ success: false, error: { code: 'TOKEN_MISSING', message: 'No token provided.' } });

      const decoded = JWTUtil.verifyAccess(token);
      const user    = await UserModel.findById(decoded.sub).lean();
      if (!user) return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'User not found.' } });

      const issuedAt = decoded.iat ? decoded.iat * 1000 : null;
      const passwordChangedAt = user.password_changed_at ? new Date(user.password_changed_at).getTime() : null;
      if (issuedAt && passwordChangedAt && issuedAt < passwordChangedAt) {
        return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Session invalidated. Please log in again.' } });
      }

      req.user = user;
      next();
    } catch {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Invalid or expired token.' } });
    }
  }

  /**
   * Optional auth — if a Bearer token is present it is verified and req.user is set.
   * If no token is present, req.user stays null and the request continues.
   * Used for POST /registrations where existing users send a token but new users don't.
   */
  static async optionalAuth(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        req.user = null;
        return next();
      }

      const decoded = JWTUtil.verifyAccess(token);
      const user    = await UserModel.findById(decoded.sub).lean();
      if (user) {
        const issuedAt = decoded.iat ? decoded.iat * 1000 : null;
        const passwordChangedAt = user.password_changed_at ? new Date(user.password_changed_at).getTime() : null;
        if (issuedAt && passwordChangedAt && issuedAt < passwordChangedAt) {
          req.user = null;
          return next();
        }
      }
      req.user = user || null;
      next();
    } catch {
      // Invalid token on an optional route — treat as unauthenticated, not an error
      req.user = null;
      next();
    }
  }

  /** Admin role required — 403 if not admin */
  static async requireAdmin(req, res, next) {
    await AuthMiddleware.requireAuth(req, res, async () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } });
      }
      next();
    });
  }
}

module.exports = AuthMiddleware;
