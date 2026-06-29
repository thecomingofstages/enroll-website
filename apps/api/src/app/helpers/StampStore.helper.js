const StoreModel     = require('../models/Store.model');
const StampUserModel = require('../models/StampUser.model');

class StampStoreHelper {

  // ── GET /stampstore ──────────────────────────────────────────────
  static async listStores(userId) {
    throw new Error('Not implemented');
  }

  // ── POST /stampstore/createstamp ─────────────────────────────────
  static async createStamp(userId, code) {
    throw new Error('Not implemented');
  }

  // ── POST /admin/stampstore/create ────────────────────────────────
  static async adminCreateStore(name, code) {
    throw new Error('Not implemented');
  }

  // ── PATCH /admin/stampstore/changecode ───────────────────────────
  static async adminChangeCode(storeId, newCode) {
    throw new Error('Not implemented');
  }

  // ── PATCH /admin/stampstore/markexchanged ────────────────────────
  static async adminMarkExchanged(userId) {
    throw new Error('Not implemented');
  }
}

module.exports = StampStoreHelper;
