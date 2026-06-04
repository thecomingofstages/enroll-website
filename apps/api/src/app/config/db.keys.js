module.exports = {
  // ── Cloudflare R2 ──────────────────────────────────────────────
  R2_ACCOUNT_ID:        process.env.R2_ACCOUNT_ID        ,
  R2_ACCESS_KEY_ID:     process.env.R2_ACCESS_KEY_ID     ,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ,
  R2_BUCKET_NAME:       process.env.R2_BUCKET_NAME       || 'enrollmentwebsiteimages',
  // Endpoint: https://<account_id>.r2.cloudflarestorage.com
  get R2_ENDPOINT() {
    return `https://${this.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  },

  
};
