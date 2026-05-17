const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const SpeakerSchema = new mongoose.Schema(
  {
    _id:         { type: String, default: uuidv7 },
    activity_id: { type: String, ref: 'Activity', required: true },
    name:        { type: String, required: true },
    role:    { type: String, required: true },
    image_url:   { type: String, default: null },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

SpeakerSchema.index({ activity_id: 1 });

module.exports = mongoose.model('Speaker', SpeakerSchema);
