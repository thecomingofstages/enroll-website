const crypto         = require('crypto');
const { v7: uuidv7 } = require('uuid');
const StoreModel     = require('../models/Store.model');
const StampUserModel = require('../models/StampUser.model');

// Store codes use SHA-256 (deterministic) so we can do a direct DB lookup.
// bcrypt is not used here — codes are not user credentials and must be matchable.
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

class StampStoreHelper {

  // ┌── GET /stampstore ──────────────────────────────────────────────────────────
  static async listStores(userId) {
    const stores = await StoreModel.find().lean();
    const stampUser = await StampUserModel.findOne({ _id: userId }).lean();

    const collectedStoreIds = new Set(
      (stampUser?.stamp_collected || []).map(s => String(s.store_id))
    );

    return stores.map(store => ({
      name: store.name,
      count: collectedStoreIds.has(String(store._id)) ? 1 : 0
    }));
  }

  // ┌── POST /stampstore/createstamp ───────────────────────────────────────────
  /**
   * Attendee submits a plain-text store code.
   * Hashes it with SHA-256, looks up the matching store, then records a stamp.
   * Idempotent — if the user already has a stamp from this store, returns it silently.
   */
  static async createStamp(userId, code) {
    if (!code) {
      const err = new Error('code is required.');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const store = await StoreModel.findOne({ code_hash: hashCode(code) }).lean();
    if (!store) {
      const err = new Error('No store matches this code.');
      err.statusCode = 404; err.code = 'STORE_NOT_FOUND'; throw err;
    }

    // One stamp per store per user
    // Note: findById is unreliable when schema has { _id: false } — use findOne instead
    const stampUser = await StampUserModel.findOne({ _id: userId }).lean();
    if (stampUser) {
      const existing = stampUser.stamp_collected.find(s => String(s.store_id) === String(store._id));
      if (existing) return existing;
    }

    const newStamp = {
      _id:         uuidv7(),
      store_id:    store._id,
      achieved_at: new Date(),
    };

    await StampUserModel.findOneAndUpdate(
      { _id: userId },
      { $push: { stamp_collected: newStamp } },
      { upsert: true }
    );

    return newStamp;
  }

  // ┌── POST /admin/stampstore/create ──────────────────────────────────────────
  // Note for Mark: hash code with hashCode(code) before saving to code_hash field.
  static async adminCreateStore(name, code) {
    if (!name || !code) {
      const err = new Error('name and code are required.');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const store = await StoreModel.create({
      name,
      code_hash: hashCode(code)
    });

    return {
      _id: store._id,
      name: store.name,
      created_at: store.created_at
    };
  }

  // ┌── PATCH /admin/stampstore/changecode ─────────────────────────────────────
  // Note for Mark: hash new_code with hashCode(new_code) before saving.
  static async adminChangeCode(storeId, newCode) {
    if (!storeId || !newCode) {
      const err = new Error('_id and new_code are required.');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const updated = await StoreModel.findOneAndUpdate(
      { _id: storeId },
      { $set: { code_hash: hashCode(newCode) } },
      { new: true }
    ).lean();

    if (!updated) {
      const err = new Error('Store not found.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    return {
      _id: updated._id,
      name: updated.name,
      created_at: updated.created_at
    };
  }

  // ┌── PATCH /admin/stampstore/markexchanged ──────────────────────────────────
  /**
   * Staff marks a user's stamp card as exchanged for a prize.
   * 404 if no StampUser doc exists (user has never collected any stamps).
   */
  static async adminMarkExchanged(userId) {
    if (!userId) {
      const err = new Error('user_id is required.');
      err.statusCode = 400; err.code = 'VALIDATION_ERROR'; throw err;
    }

    const stampUser = await StampUserModel.findOne({ _id: userId }).lean();
    if (!stampUser) {
      const err = new Error('No stamp record found for this user.');
      err.statusCode = 404; err.code = 'NOT_FOUND'; throw err;
    }

    const updated = await StampUserModel.findOneAndUpdate(
      { _id: userId },
      { $set: { is_exchanged: true } },
      { new: true }
    ).lean();

    return updated;
  }
}

module.exports = StampStoreHelper;
