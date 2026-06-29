const mongoose = require('mongoose');

const StampSchema = new mongoose.Schema(
  {
    _id:         { type: String, required: true }, // UUIDv7, set by helper
    store_id:    { type: String, ref: 'Store', required: true },
    achieved_at: { type: Date, required: true },
  },
  { _id: false }
);

const StampUserSchema = new mongoose.Schema(
  {
    _id:             { type: String, required: true }, // = User._id
    stamp_collected: { type: [StampSchema], default: [] },
    is_exchanged:    { type: Boolean, default: false },
  },
  { _id: false }
);

module.exports = mongoose.model('StampUser', StampUserSchema);
