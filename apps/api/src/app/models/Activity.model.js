const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const ScheduleItemSchema = new mongoose.Schema(
  {
    date:        { type: Date,   required: true },
    venue:       { type: String, required: true },
    // Per-day activity slots
    slots: [
      {
        start_time:  { type: String, required: true },
        end_time:    { type: String, required: true },
        title:       { type: String, required: true },
        description: { type: String, default: null },
      },
    ],
  },
  { _id: false }
);

const ExtraQuestionSchema = new mongoose.Schema(
  {
    question_id:   { type: String, required: true },
    question_text: { type: String, required: true },
    type:          { type: String, enum: ['text', 'single_choice'], required: true },
    options:       { type: [String], default: null },
    is_required:   { type: Boolean, default: true },
  },
  { _id: false }
);

const ActivitySchema = new mongoose.Schema(
  {
    _id:                   { type: String, default: uuidv7 },
    name:                  { type: String, required: true },
    description:           { type: String, required: true },
    hero_image_url:        { type: String, required: true },
    price:                 { type: Number, required: true, min: 0 },
    seat_capacity:         { type: Number, required: true },
    enrolled_count:        { type: Number, default: 0 },
    tags:                  { type: [String], default: [] },
    benefits:              { type: [String], default: [] },       
    is_registration_open:  { type: Boolean, default: false },
    is_featured:           { type: Boolean, default: false },
    schedule:              { type: [ScheduleItemSchema], default: [] },
    extra_questions:       { type: [ExtraQuestionSchema], default: [] },
    // speakers populated from Speaker collection via activity_id ref
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Activity', ActivitySchema);
