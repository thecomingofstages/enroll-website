const multer = require('multer');

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only JPEG/PNG/WEBP images are accepted'), { statusCode: 400 }));
};

const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });

class UploadMiddleware {
  /** Slip image for payment — field: 'slip' */
  static handleSlip(req, res, next) {
    upload.single('slip')(req, res, (err) => {
      if (err) return res.status(err.statusCode || 400).json({
        success: false, error: { code: 'UPLOAD_ERROR', message: err.message },
      });
      next();
    });
  }

  /** Profile image — field: 'profile_image'. Used for PATCH /users/me */
  static handleProfileImage(req, res, next) {
    upload.single('profile_image')(req, res, (err) => {
      if (err) return res.status(err.statusCode || 400).json({
        success: false, error: { code: 'UPLOAD_ERROR', message: err.message },
      });
      next();
    });
  }
}

module.exports = UploadMiddleware;
