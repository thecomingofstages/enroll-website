const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const DbKeys = require('../config/db.keys');
const path   = require('path');

// ── Singleton S3 client pointing at Cloudflare R2 ─────────────────────────────
const s3 = new S3Client({
  region: 'auto',                    // R2 requires 'auto'
  endpoint: DbKeys.R2_ENDPOINT,
  credentials: {
    accessKeyId:     DbKeys.R2_ACCESS_KEY_ID,
    secretAccessKey: DbKeys.R2_SECRET_ACCESS_KEY,
  },
});

class R2Util {
  /**
   * Upload a file buffer to R2.
   *
   * @param {Buffer}  buffer      - File data (e.g. from multer memoryStorage)
   * @param {string}  folder      - Logical folder prefix, e.g. 'avatars' | 'activity-heroes'
   * @param {string}  filename    - Original filename (used to preserve extension)
   * @param {string}  contentType - MIME type, e.g. 'image/jpeg'
   * @returns {Promise<string>}   - Public CDN URL of the uploaded object
   */
  static async upload(buffer, folder, filename, contentType) {
    const ext      = path.extname(filename) || '';
    const key      = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      DbKeys.R2_BUCKET_NAME,
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
    }));

    // Return the public URL — enable "Public Access" on the bucket in Cloudflare dashboard
    // or swap this for a presigned URL if the bucket is private.
    return `${DbKeys.R2_ENDPOINT}/${DbKeys.R2_BUCKET_NAME}/${key}`;
  }

  /**
   * Generate a presigned GET URL for a private object (valid for 1 hour by default).
   *
   * @param {string}  key         - Object key in the bucket (path after bucket name)
   * @param {number}  [expiresIn] - Seconds until URL expires (default 3600)
   * @returns {Promise<string>}   - Presigned URL
   */
  static async getPresignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: DbKeys.R2_BUCKET_NAME,
      Key:    key,
    });
    return getSignedUrl(s3, command, { expiresIn });
  }

  /**
   * Delete an object from R2.
   *
   * @param {string} key - Object key (the path portion after the bucket name in the URL)
   */
  static async delete(key) {
    await s3.send(new DeleteObjectCommand({
      Bucket: DbKeys.R2_BUCKET_NAME,
      Key:    key,
    }));
  }

  /**
   * Helper: extract the R2 object key from a full CDN URL.
   * Useful when you have stored the full URL and need the key for deletion.
   *
   * @param {string} url - Full URL previously returned by R2Util.upload()
   * @returns {string}   - Object key
   */
  static keyFromUrl(url) {
    const prefix = `${DbKeys.R2_ENDPOINT}/${DbKeys.R2_BUCKET_NAME}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : url;
  }
}

module.exports = R2Util;
