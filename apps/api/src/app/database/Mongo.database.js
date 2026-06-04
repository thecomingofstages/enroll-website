const mongoose = require('mongoose');
const DbConf   = require('../config/db.conf');
const Logger   = require('../utils/Logger.util');

class MongoDatabase {
  static async connect() {
    try {
      await mongoose.connect(DbConf.MONGO_URI);
      Logger.info('MongoDB connection established');
    } catch (error) {
      Logger.error(`MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }
  }
}

module.exports = MongoDatabase;
