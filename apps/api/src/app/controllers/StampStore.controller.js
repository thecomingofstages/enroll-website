const StampStoreHelper = require('../helpers/StampStore.helper');
const Logger           = require('../utils/Logger.util');

class StampStoreController {
  /** GET /stampstore */
  static async listStores(req, res, next) {
    try {
      const data = await StampStoreHelper.listStores(req.user._id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[StampStoreController.listStores] ${err.message}`);
      next(err);
    }
  }

  /** POST /stampstore/createstamp */
  static async createStamp(req, res, next) {
    try {
      const { code } = req.body;
      const data = await StampStoreHelper.createStamp(req.user._id, code);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[StampStoreController.createStamp] ${err.message}`);
      next(err);
    }
  }

  /** POST /admin/stampstore/create */
  static async adminCreateStore(req, res, next) {
    try {
      const { name, code } = req.body;
      const data = await StampStoreHelper.adminCreateStore(name, code);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      Logger.error(`[StampStoreController.adminCreateStore] ${err.message}`);
      next(err);
    }
  }

  /** PATCH /admin/stampstore/changecode */
  static async adminChangeCode(req, res, next) {
    try {
      const { _id, new_code } = req.body;
      const data = await StampStoreHelper.adminChangeCode(_id, new_code);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[StampStoreController.adminChangeCode] ${err.message}`);
      next(err);
    }
  }

  /** PATCH /admin/stampstore/markexchanged */
  static async adminMarkExchanged(req, res, next) {
    try {
      const { user_id } = req.body;
      const data = await StampStoreHelper.adminMarkExchanged(user_id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      Logger.error(`[StampStoreController.adminMarkExchanged] ${err.message}`);
      next(err);
    }
  }
}

module.exports = StampStoreController;
