const multer = require('multer');

// Store in memory — slip images are processed in-memory and immediately discarded
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only JPEG/PNG/WEBP images are accepted'), { statusCode: 400 }));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB cap

class UploadMiddleware {
  /** Single slip image — field name: 'slip' */
  static handleSlip(req, res, next) {
    upload.single('slip')(req, res, (err) => {
      if (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          error: { code: 'UPLOAD_ERROR', message: err.message },
        });
      }
      next();
    });
  }
}

module.exports = UploadMiddleware;
