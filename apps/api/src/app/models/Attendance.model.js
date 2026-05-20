const mongoose       = require('mongoose');
const { v7: uuidv7 } = require('uuid');

/**
 * Attendance Collection
 *
 * One document per activity. Tracks per-day check-ins.
 * Date keys are Bangkok-local ISO date strings: "YYYY-MM-DD" (UTC+7).
 *
 * Shape:
 * {
 *   _id:         "uuid",
 *   activity_id: "uuid",
 *   attendance: {
 *     "2026-08-01": ["user_id_1", "user_id_2"],
 *     "2026-08-02": ["user_id_1"],
 *   }
 * }
 *
 * Scan writes:  $push: { [`attendance.${dateKey}`]: user_id }
 * Read:         findOne({ activity_id }) — populate into GET /activities/:id
 */
const AttendanceSchema = new mongoose.Schema(
  {
    _id:         { type: String, default: uuidv7 },
    activity_id: { type: String, ref: 'Activity', required: true, unique: true },
    attendance:  { type: Map, of: [String], default: {} },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

AttendanceSchema.index({ activity_id: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
