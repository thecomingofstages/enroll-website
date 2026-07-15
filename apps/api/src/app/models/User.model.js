const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const UserSchema = new mongoose.Schema(
  {
    _id:               { type: String, default: uuidv7 },
    first_name:        { type: String, required: true },
    last_name:         { type: String, required: true },
    nickname:          { type: String, required: true },
    email:             { type: String, required: true, unique: true, lowercase: true },
    phone:             { type: String, required: true },
    password_hash:     { type: String, required: true },
    role:              { type: String, enum: ['user', 'admin'], default: 'user' },
    gender:            { type: String, enum: ['Male', 'Female', 'LGBTQ+', 'Unspecified'], required: true },
    interests:         { type: [String], default: [] },
    profile_image_url: { type: String, default: null },
    // Optional fields (pending board confirm)
    address:           { type: String, default: null },
    education_level:   { type: String, default: null },
    institution:       { type: String, default: null },
    // Set only when the password is actually changed (see Auth.helper.resetPassword).
    // No default — leaving it null on new users prevents a clock-skew race where
    // a freshly-issued JWT (iat ≈ now) loses against password_changed_at (= now)
    // and gets rejected as "Session invalidated" on the very next request.
    password_changed_at: { type: Date, default: null },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('User', UserSchema);
