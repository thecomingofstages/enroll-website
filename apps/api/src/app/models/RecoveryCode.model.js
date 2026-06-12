const mongoose  = require('mongoose');
const { v7: uuidv7 } = require('uuid');

/**
 * One-time recovery codes generated per user. Plaintext is never stored —
 * only the bcrypt hash. Codes are regenerated (this collection cleared for
 * the user) every time one is consumed, so a stolen code is only useful
 * until the legitimate owner uses it.
 */
const RecoveryCodeSchema = new mongoose.Schema(
  {
    _id:        { type: String, default: uuidv7 },
    user_id:    { type: String, required: true, index: true },
    code_hash:  { type: String, required: true },
    used:       { type: Boolean, default: false },
    used_at:    { type: Date,    default: null },
    created_at: { type: Date,    default: Date.now },
    expires_at: { type: Date,    default: null }, // null = no expiry
  },
  {
    _id: false,
    timestamps: false,
  }
);

module.exports = mongoose.model('RecoveryCode', RecoveryCodeSchema);
