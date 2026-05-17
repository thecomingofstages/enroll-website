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

      req.user = user;
      next();
    } catch {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Invalid or expired token.' } });
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
