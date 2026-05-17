const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const CustomAnswerSchema = new mongoose.Schema(
  {
    question_id: { type: String, required: true },
    answer:      { type: String, required: true },
  },
  { _id: false }
);

const RegistrationSchema = new mongoose.Schema(
  {
    _id:            { type: String, default: uuidv7 },
    user_id:        { type: String, ref: 'User',     required: true },
    activity_id:    { type: String, ref: 'Activity', required: true },
    status:         { type: String, enum: ['PENDING', 'PAID', 'JOINED', 'CANCELLED'], default: 'PENDING' },
    group_name:     { type: String, default: null }, 
    custom_answers: { type: [CustomAnswerSchema], default: [] },
  },
  {
    _id: false,
    timestamps: { createdAt: 'registered_at', updatedAt: false },
  }
);

RegistrationSchema.index({ user_id: 1, activity_id: 1 });

module.exports = mongoose.model('Registration', RegistrationSchema);
