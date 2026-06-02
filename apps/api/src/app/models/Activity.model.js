const mongoose       = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const SpeakerSchema = new mongoose.Schema(
  {
    _id:               { type: String, default: uuidv7 },
    name:              { type: String, required: true },
    position:          { type: String, required: true },
    image_url:         { type: String, default: null },
  }
);

const ScheduleItemSchema = new mongoose.Schema(
  {
    date:        { type: Date,   required: true },
    venue:       { type: String, required: true },
    location:    { type: String, default: null },
    slots: [
      {
        start_time:  { type: String, required: true },
        end_time:    { type: String, required: true },
        title:       { type: String, required: true },
        description: { type: String, default: null },
      },
    ],
    speakers:    { type: [SpeakerSchema], default: [] },
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
    _id:             { type: String, default: uuidv7 },
    name:            { type: String, required: true },
    description:     { type: String, required: true }, //URL
    hero_image_url:  { type: String, required: true },
    price:           { type: Number, required: true, min: 0 },
    seat_capacity:   { type: Number, required: true },
    enrolled_count:  { type: Number, default: 0 },
    tags:            { type: [String], default: [] },
    benefits:        { type: [String], default: [] },

    // ── Registration window ──────────────────────────────────────
    // open_registration_at  — datetime registration opens (null = open from creation)
    // close_registration_at — datetime registration closes (null = no auto-close)
    // is_registration_open is now a VIRTUAL computed from these two dates + manual override.
    // Admin can also force-close via registration_open_override = false regardless of dates.
    open_registration_at:  { type: Date, default: null },
    close_registration_at: { type: Date, default: null },
    // Hard override: false = always closed, true = always open, null = use date window
    registration_open_override: { type: Boolean, default: null },

    is_featured:     { type: Boolean, default: false },
    schedule:        { type: [ScheduleItemSchema], default: [] },
    extra_questions: { type: [ExtraQuestionSchema], default: [] },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

/**
 * Virtual: is_registration_open
 * Priority: registration_open_override → date window → false
 */
ActivitySchema.virtual('is_registration_open').get(function () {
  // Hard override takes da priority
  if (this.registration_open_override !== null && this.registration_open_override !== undefined) {
    return this.registration_open_override;
  }
  const now = new Date();
  const afterOpen  = !this.open_registration_at  || now >= this.open_registration_at;
  const beforeClose = !this.close_registration_at || now <= this.close_registration_at;
  return afterOpen && beforeClose;
});

ActivitySchema.set('toObject', { virtuals: true });
ActivitySchema.set('toJSON',   { virtuals: true });

module.exports = mongoose.model('Activity', ActivitySchema);
