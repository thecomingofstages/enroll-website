const multer = require('multer');

// All uploads go to memory — nothing is ever written to disk
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only JPEG/PNG/WEBP images are accepted'), { statusCode: 400 }));
};

const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

class UploadMiddleware {
  /** Slip image for payment verification — field name: 'slip' */
  static handleSlip(req, res, next) {
    upload.single('slip')(req, res, (err) => {
      if (err) return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: err.message },
      });
      next();
    });
  }

  /**
   * Activity hero image — field name: 'hero_image'
   * Optional on PATCH (image may not be changing).
   * req.file will be undefined if no file is sent — helper skips R2 upload in that case.
   */
  static handleActivityImage(req, res, next) {
    upload.single('hero_image')(req, res, (err) => {
      if (err) return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: err.message },
      });
      next();
    });
  }
}

module.exports = UploadMiddleware;
