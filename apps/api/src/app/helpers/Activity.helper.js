const ActivityModel = require('../models/Activity.model');
const SpeakerModel  = require('../models/Speaker.model');

class ActivityHelper {
  /** GET /activities */
  static async list(filters, pagination) {
    // TODO: build $match from tags/$in, is_featured, is_registration_open; paginate
    throw new Error('Not implemented');
  }

  /** GET /activities/recommended */
  static async getRecommended(userInterests, limit) {
    // TODO: $in tags, score by overlap, sort desc, fallback to featured
    throw new Error('Not implemented');
  }

  /** GET /activities/:id */
  static async getById(activityId) {
    // TODO: findById, join speakers, return full doc including schedule + extra_questions
    throw new Error('Not implemented');
  }

  /** POST /admin/activities */
  static async create(payload) {
    // TODO: generate UUIDv7, auto-gen question_ids, insert, return doc
    throw new Error('Not implemented');
  }

  /** PATCH /admin/activities/:id */
  static async update(activityId, payload) {
    // TODO: whitelist fields (block enrolled_count), $set, return updated doc
    throw new Error('Not implemented');
  }

  /** DELETE /admin/activities/:id */
  static async remove(activityId) {
    // TODO: check no PAID/JOINED registrations, cancel PENDING, soft-delete via deleted_at
    throw new Error('Not implemented');
  }
}

module.exports = ActivityHelper;
