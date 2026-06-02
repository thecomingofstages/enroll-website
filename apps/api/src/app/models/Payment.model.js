const mongoose       = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const PaymentSchema = new mongoose.Schema(
  {
    _id:               { type: String, default: () => uuidv7() },
    registration_id:   { type: String, ref: 'Registration', required: true },
    user_id:           { type: String, ref: 'User',         required: true },
    amount:            { type: Number, default: null },
    promptpay_qr_data: { type: String, required: true },
    slip_submitted_at: { type: Date, required: true },
    status:            { type: String, enum: ['WAITING', 'VERIFIED', 'FAILED'], default: 'WAITING' },
    verified_at:       { type: Date, default: null },
    note:              { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('Payment', PaymentSchema);
