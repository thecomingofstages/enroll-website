const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const PasswordResetTokenSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv7 },
    user_id: { type: String, ref: 'User', required: true, index: true },
    token_hash: { type: String, required: true, unique: true, index: true },
    expires_at: { type: Date, required: true, index: true },
    used_at: { type: Date, default: null },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
