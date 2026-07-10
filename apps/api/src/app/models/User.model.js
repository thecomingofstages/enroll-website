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
    password_changed_at: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('User', UserSchema);
